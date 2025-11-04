import React, { useRef, useEffect, useMemo, useState } from 'react';

interface GameCanvasProps {
  width?: number;
  height?: number;
}

interface ChartNote {
  time: number; // Sekunden, wann die Note die Hitline treffen soll
  lane: number; // 0..3
}

interface RuntimeNote extends ChartNote {
  judged?: 'perfect' | 'good' | 'miss';
}

const GameCanvas: React.FC<GameCanvasProps> = ({ width = 800, height = 600 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null); // performance.now() Start
  const timeRef = useRef<number>(0); // aktuelle Spielzeit in Sekunden

  // UI/Score
  const [score, setScore] = useState(0);
  const comboRef = useRef<number>(0);
  const lastJudgementRef = useRef<string>('');
  const feedbackTimerRef = useRef<number>(0);

  // Konstanten
  const LANES = 4;
  const LANE_KEYS = ['1', '2', '3', '4'];
  const LANE_COLORS = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db'];
  const SPEED_PX_PER_SEC = 320; // Fallgeschwindigkeit
  const NOTE_HEIGHT = 60;
  const LANE_PADDING = 10;
  const HITLINE_Y = height - 140; // Position der Ziellinie

  // Timing Windows (Sekunden)
  const PERFECT_WINDOW = 0.07;
  const GOOD_WINDOW = 0.14;
  const LATE_WINDOW = 0.18; // danach Miss

  // Einfache Demo-Chart (8 Takte, 120 BPM -> Schlag alle 0.5s)
  const chart: ChartNote[] = useMemo(() => {
    const notes: ChartNote[] = [];
    const beat = 0.5; // 120 BPM
    let t = 2; // Start mit kleinem Vorlauf (2s)
    const pattern = [0, 1, 2, 3, 2, 1, 0, 3];
    for (let i = 0; i < 32; i++) {
      notes.push({ time: t, lane: pattern[i % pattern.length] });
      t += beat;
    }
    return notes;
  }, []);

  const notesRef = useRef<RuntimeNote[]>([]);
  // Initialisiere Runtime-Noten einmal
  useEffect(() => {
    notesRef.current = chart.map((n) => ({ ...n }));
  }, [chart]);

  // Keyboard Handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const idx = LANE_KEYS.indexOf(e.key);
      if (idx === -1) return;
      handleHit(idx);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleHit = (lane: number) => {
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
      comboRef.current += 1;
      setScore((s) => s + 100 + comboRef.current * 2);
      flashFeedback('PERFECT');
    } else if (delta <= GOOD_WINDOW) {
      note.judged = 'good';
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

      // Getroffene Noten leicht transparent
      if (n.judged === 'perfect' || n.judged === 'good') {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(x, y, w, NOTE_HEIGHT);
      }
    }

    // HUD
    ctx.fillStyle = '#f9fafb';