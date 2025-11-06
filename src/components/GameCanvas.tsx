import React, { useRef, useEffect, useMemo, useState } from 'react';

interface GameCanvasProps {
  width?: number;
  height?: number;
  // Externe Steuerung
  songId: string;
  onScoreChange?: (score: number) => void;
  canStart?: boolean; // darf das Spiel gestartet werden (z.B. nur wenn ein Spieler gewählt ist)
  onFinished?: (finalScore: number) => void; // wird aufgerufen, wenn der Song abgeschlossen ist
  startSignal?: number; // erhöht sich, wenn extern ein neuer Start (mit Countdown) gewünscht ist
  activePlayerName?: string; // Name des aktiven Spielers für Vorbereitungseinblendung
  sessionFinished?: boolean; // Gesamtsession beendet (alle Spieler gespielt)
  onManualStart?: () => void; // Benutzer hat Start geklickt (Parent steuert Session/Startsignal)
  winnerName?: string; // Gewinnername am Ende
  onRestart?: () => void; // Neues Spiel starten
}

interface ChartNote {
  time: number; // Sekunden, wann die Note die Hitline treffen soll
  lane: number; // 0..3
}

interface RuntimeNote extends ChartNote {
  judged?: 'perfect' | 'good' | 'miss';
  hitFlash?: number; // Kurzer Flash-Timer für helle Aufleuchteffekte nach einem Treffer
}

// Neu: Song-Definitionen und Chart-Builder
export interface SongConfig {
  id: string;
  title: string;
  bpm: number;
  noteCount: number;
  leadIn: number; // Sekunden Vorlauf
  pattern: number[]; // Lanes 0..3
}

export const SONGS: SongConfig[] = [
  { id: 'demo-120', title: 'Demo – 120 BPM', bpm: 120, noteCount: 32, leadIn: 2, pattern: [0, 1, 2, 3, 2, 1, 0, 3] },
  { id: 'demo-140', title: 'Demo – 140 BPM', bpm: 140, noteCount: 40, leadIn: 2, pattern: [0, 2, 1, 3, 3, 1, 2, 0] },
];

function buildChart(song: SongConfig): ChartNote[] {
  const notes: ChartNote[] = [];
  const beat = 60 / song.bpm;
  let t = song.leadIn;
  for (let i = 0; i < song.noteCount; i++) {
    notes.push({ time: t, lane: song.pattern[i % song.pattern.length] });
    t += beat;
  }
  return notes;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ width = 800, height = 600, songId, onScoreChange, canStart = true, onFinished, startSignal, activePlayerName, sessionFinished, onManualStart, winnerName, onRestart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null); // performance.now() Start
  const timeRef = useRef<number>(0); // aktuelle Spielzeit in Sekunden
  const pausedTimeRef = useRef<number>(0); // gemerkte Zeit beim Pausieren
  const prevFrameTimeRef = useRef<number | null>(null); // Delta-Time für Effekte (Flash, Feedback) berechnen
  const finishedRef = useRef<boolean>(false);
  const countdownRef = useRef<number>(0); // Countdown in Sekunden (3..0)
  const prepareRef = useRef<number>(0); // Vorbereitung vor Countdown (Spieler bereit machen)
  const prevStartSignalRef = useRef<number | undefined>(undefined);

  // UI/Score/State
  const [score, setScore] = useState(0);
  const comboRef = useRef<number>(0);
  const lastJudgementRef = useRef<string>('');
  const feedbackTimerRef = useRef<number>(0);
  const [isRunning, setIsRunning] = useState(false);

  // Notify parent when score changes
  useEffect(() => {
    onScoreChange?.(score);
  }, [score, onScoreChange]);

  // Konstanten
  const LANES = 4;
  const LANE_KEYS = ['a', 's', 'd', 'f'];
  const LANE_COLORS = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db'];
  const SPEED_PX_PER_SEC = 220; // Fallgeschwindigkeit (verlangsamt)
  const NOTE_HEIGHT = 60;
  const LANE_PADDING = 10;
  const HITLINE_Y = height - 140; // Position der Ziellinie

  // Timing Windows (Sekunden)
  const PERFECT_WINDOW = 0.07;
  const GOOD_WINDOW = 0.14;
  const LATE_WINDOW = 0.18; // danach Miss
  const HIT_FLASH_DURATION = 0.25; // Dauer des hellen Aufblitzens nach einem Treffer
  const PREPARE_DURATION = 5.0; // Sekunden Vorbereitung vor Countdown

  // Aktive Lane-Highlights beim Tastendruck
  const laneActiveRef = useRef<boolean[]>(Array.from({ length: LANES }, () => false));

  // Erzeuge Chart abhängig vom ausgewählten Song
  const chart: ChartNote[] = useMemo(() => {
    const song = SONGS.find((s) => s.id === songId)!;
    return buildChart(song);
  }, [songId]);

  const lastNoteTime = useMemo(() => {
    return chart.length ? Math.max(...chart.map(n => n.time)) : 0;
  }, [chart]);

  const notesRef = useRef<RuntimeNote[]>([]);
  // Initialisiere Runtime-Noten und resette Status bei Songwechsel
  useEffect(() => {
    notesRef.current = chart.map((n) => ({ ...n }));
    comboRef.current = 0;
    setScore(0);
    timeRef.current = 0;
    pausedTimeRef.current = 0;
    startTimeRef.current = null;
    finishedRef.current = false;
    countdownRef.current = 0;
    prepareRef.current = 0;
    setIsRunning(false);
  }, [chart]);

  // Externer Start-Trigger mit Vorbereitung + Countdown
  useEffect(() => {
    if (startSignal === undefined || sessionFinished) return;
    if (prevStartSignalRef.current === undefined) {
      prevStartSignalRef.current = startSignal;
      return;
    }
    if (startSignal !== prevStartSignalRef.current) {
      prevStartSignalRef.current = startSignal;
      if (canStart) beginPreparation();
    }
  }, [startSignal, canStart, sessionFinished]);

  const beginPreparation = () => {
    // Reset aller Laufzeitdaten
    notesRef.current = chart.map((n) => ({ ...n }));
    comboRef.current = 0;
    setScore(0);
    lastJudgementRef.current = '';
    feedbackTimerRef.current = 0;
    timeRef.current = 0;
    pausedTimeRef.current = 0;
    startTimeRef.current = null;
    finishedRef.current = false;
    setIsRunning(false);
    countdownRef.current = 0; // Countdown startet erst nach Vorbereitung
    prepareRef.current = PREPARE_DURATION; // Vorbereitung starten
  };

  // Keyboard Handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const idx = LANE_KEYS.indexOf(key);
      if (idx === -1) return;

      // Lane aktiv solange Taste gehalten wird
      laneActiveRef.current[idx] = true;

      // Wertung nur wenn laufend
      if (isRunning) handleHit(idx);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const idx = LANE_KEYS.indexOf(key);
      if (idx === -1) return;
      laneActiveRef.current[idx] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isRunning]);

  const handleHit = (lane: number) => {
    if (!isRunning) return;
    const now = timeRef.current;
    // Finde die beste (zeitlich nächste) unbewertete Note in der Lane im aktiven Fenster
    let best: { note: RuntimeNote; delta: number } | null = null;
    for (const n of notesRef.current) {
      if (n.lane !== lane || n.judged) continue;
      const delta = Math.abs(n.time - now);
      if (delta <= LATE_WINDOW) {
        if (!best || delta < best.delta) best = { note: n, delta };
      }
    }

    if (!best) return; // keine Note im Fenster

    const { note, delta } = best;
    if (delta <= PERFECT_WINDOW) {
      note.judged = 'perfect';
      note.hitFlash = HIT_FLASH_DURATION; // Starte hellen Flash für getroffene Note
      comboRef.current += 1;
      setScore((s) => s + 100 + comboRef.current * 2);
      flashFeedback('PERFECT');
    } else if (delta <= GOOD_WINDOW) {
      note.judged = 'good';
      note.hitFlash = HIT_FLASH_DURATION; // Starte hellen Flash für getroffene Note
      comboRef.current += 1;
      setScore((s) => s + 70 + comboRef.current);
      flashFeedback('GOOD');
    } else {
      note.judged = 'miss';
      comboRef.current = 0;
      flashFeedback('MISS');
    }
  };

  const flashFeedback = (text: string) => {
    lastJudgementRef.current = text;
    feedbackTimerRef.current = 0.5; // Sekunden anzeigen
  };

  // Miss-Erkennung für Noten, die vorbei sind
  const updateMisses = (now: number) => {
    for (const n of notesRef.current) {
      if (!n.judged && now - n.time > LATE_WINDOW) {
        n.judged = 'miss';
        comboRef.current = 0;
        flashFeedback('MISS');
      }
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, now: number) => {
    const laneWidth = width / LANES;
    // Hintergrund
    ctx.clearRect(0, 0, width, height);
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1f2937');
    gradient.addColorStop(1, '#111827');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Lanes + Separatoren
    for (let i = 0; i < LANES; i++) {
      const x = i * laneWidth;
      // Lane Hintergrund
      ctx.fillStyle = LANE_COLORS[i] + '20';
      ctx.fillRect(x, 0, laneWidth, height);
      // Separator
      if (i > 0) {
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Aktives Highlight der Lane
      if (laneActiveRef.current[i]) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x, 0, laneWidth, height);
        ctx.strokeStyle = LANE_COLORS[i];
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 4, 4, laneWidth - 8, height - 8);
        ctx.restore();
      }
    }

    // Hitline
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, HITLINE_Y - NOTE_HEIGHT / 2, width - 12, NOTE_HEIGHT);

    // Noten zeichnen
    for (const n of notesRef.current) {
      if (n.judged === 'miss') continue; // verpasste Note ausblenden
      // Position: bei now == n.time ist die Note zentriert auf der Hitline
      const y = HITLINE_Y - (n.time - now) * SPEED_PX_PER_SEC - NOTE_HEIGHT / 2;
      const x = n.lane * laneWidth + LANE_PADDING;
      const w = laneWidth - LANE_PADDING * 2;

      if (y < -NOTE_HEIGHT || y > height + NOTE_HEIGHT) continue; // außerhalb

      // Schatten
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 3, y + 3, w, NOTE_HEIGHT);
      // Körper
      ctx.fillStyle = LANE_COLORS[n.lane];
      ctx.fillRect(x, y, w, NOTE_HEIGHT);
      // Glanz
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x, y, w, NOTE_HEIGHT / 3);
      // Rand
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, NOTE_HEIGHT);

      // Getroffene Noten: Grundoverlay + kurzer heller Flash/Glow
      if (n.judged === 'perfect' || n.judged === 'good') {
        // Grundoverlay (wie zuvor)
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x, y, w, NOTE_HEIGHT);

        const flash = n.hitFlash ?? 0;
        if (flash > 0) {
          const t = Math.max(0, Math.min(1, flash / HIT_FLASH_DURATION));
          // Heller Overlay mit additiver Mischung
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = `rgba(255,255,255,${0.65 * t + 0.15})`;
          ctx.fillRect(x, y, w, NOTE_HEIGHT);
          // Glow-Rand
          ctx.shadowColor = `rgba(255,255,255,${0.9 * t})`;
          ctx.shadowBlur = 22 * t + 6;
          ctx.lineWidth = 4 + 8 * t;
          ctx.strokeStyle = `rgba(255,255,255,${0.8 * t})`;
          ctx.strokeRect(x - 2, y - 2, w + 4, NOTE_HEIGHT + 4);
          ctx.restore();
        }
      }
    }

    // HUD
    ctx.fillStyle = '#f9fafb';
    ctx.font = 'bold 26px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Piano Hero', width / 2, 36);

    // Vorbereitung Overlay
    if (prepareRef.current > 0 && !isRunning) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.fillText(`Spieler ${activePlayerName || ''} bereit machen...`, width / 2, height / 2 - 30);
      ctx.font = '18px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.fillText('Gleich startet der Countdown', width / 2, height / 2 + 10);
    }

    // Countdown Overlay
    if (countdownRef.current > 0) {
      const n = Math.max(1, Math.ceil(countdownRef.current));
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 96px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.fillText(String(n), width / 2, height / 2);
    }

    // Session beendet Overlay (nur Hintergrund, Text wird via HTML Overlay gerendert)
    if (sessionFinished) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
    }

    // Feedback
    if (feedbackTimerRef.current > 0) {
      ctx.fillStyle = lastJudgementRef.current === 'MISS' ? '#ef4444' : '#22c55e';
      ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.fillText(lastJudgementRef.current, width / 2, HITLINE_Y - 20);
    }

    // Key Labels unten
    ctx.font = 'bold 16px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillStyle = '#e5e7eb';
    for (let i = 0; i < LANES; i++) {
      const x = i * laneWidth + laneWidth / 2;
      ctx.fillText(LANE_KEYS[i].toUpperCase(), x, height - 12);
    }
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nowMs = performance.now();
    let dt = 0;
    if (prevFrameTimeRef.current == null) {
      prevFrameTimeRef.current = nowMs;
    } else {
      dt = (nowMs - prevFrameTimeRef.current) / 1000;
      prevFrameTimeRef.current = nowMs;
    }

    // Vorbereitung herunter zählen -> danach Countdown starten
    if (prepareRef.current > 0 && dt > 0) {
      prepareRef.current = Math.max(0, prepareRef.current - dt);
      if (prepareRef.current <= 0 && countdownRef.current === 0 && !sessionFinished) {
        countdownRef.current = 3; // Countdown startet
      }
    }

    // Countdown ablaufen lassen; Start, wenn erreicht
    if (countdownRef.current > 0 && dt > 0) {
      countdownRef.current = Math.max(0, countdownRef.current - dt);
      if (countdownRef.current <= 0 && !isRunning) {
        // Start direkt nach Countdown
        startTimeRef.current = nowMs;
        timeRef.current = 0;
        setIsRunning(true);
      }
    }

    // Zeit aktualisieren nur wenn laufend
    if (isRunning) {
      if (startTimeRef.current === null) {
        startTimeRef.current = nowMs - pausedTimeRef.current * 1000;
      }
      const nowSec = (nowMs - startTimeRef.current) / 1000;
      timeRef.current = nowSec;
      updateMisses(nowSec);

      // Song-Ende prüfen
      const allJudged = notesRef.current.length > 0 && notesRef.current.every(n => !!n.judged);
      if (!finishedRef.current && allJudged && nowSec >= lastNoteTime + LATE_WINDOW + 0.05) {
        finishedRef.current = true;
        setIsRunning(false);
        pausedTimeRef.current = timeRef.current;
        onFinished?.(score);
      }
    }

    // Feedback abklingen lassen
    if (feedbackTimerRef.current > 0 && dt > 0) {
      feedbackTimerRef.current = Math.max(0, feedbackTimerRef.current - dt);
    }

    // Flash der getroffenen Noten herunterzählen
    if (dt > 0) {
      for (const n of notesRef.current) {
        if ((n.judged === 'perfect' || n.judged === 'good') && n.hitFlash && n.hitFlash > 0) {
          n.hitFlash = Math.max(0, n.hitFlash - dt);
        }
      }
    }

    // Zeichnen mit aktueller Zeit
    draw(ctx, timeRef.current);

    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initial draw
    draw(ctx, 0);

    // Start loop
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, isRunning, sessionFinished]);

  // Start/Stop Buttons (manueller Start ignoriert wenn Session beendet)
  const onStart = () => {
    if (!canStart || sessionFinished) return;
    // Parent soll Session starten und Startsignal geben
    onManualStart?.();
  };
  const onStop = () => {
    if (!isRunning) return;
    // Zeit merken und stoppen
    pausedTimeRef.current = timeRef.current;
    setIsRunning(false);
  };

  return (
    <div style={{ maxWidth: width + 40, margin: '0 auto', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          margin: '0 auto',
          borderRadius: 12,
          background: '#111827',
        }}
      />
      {sessionFinished && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 20,
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 42, margin: 0 }}>Spiel beendet</h2>
          <div style={{ fontSize: 20 }}>
            {winnerName ? `Gewinner: ${winnerName}` : 'Gewinner ermittelt'}
          </div>
          <button
            onClick={onRestart}
            style={{
              padding: '12px 28px',
              fontSize: 18,
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 6px 18px -4px rgba(0,0,0,0.5)'
            }}
          >
            Neues Spiel starten
          </button>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={onStart}
          disabled={!canStart || isRunning || sessionFinished}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#22c55e',
            color: '#fff',
            cursor: (!canStart || isRunning || sessionFinished) ? 'not-allowed' : 'pointer',
          }}
        >
          Start
        </button>
        <button
          onClick={onStop}
          disabled={!isRunning}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            cursor: !isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          Stop
        </button>
      </div>
    </div>
  );
};

export { GameCanvas };
export default GameCanvas;
