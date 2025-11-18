// Renamed from GameCanvas.tsx to Canvas.tsx for clarity.
// This component handles rendering, loop, input, judgement.
import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { SONGS, buildChart, type ChartNote } from '../game/songs';
import EndOverlay from './EndOverlay';
import { LANES, LANE_KEYS, LANE_COLORS, SPEED_PX_PER_SEC, NOTE_HEIGHT, LANE_PADDING, TIMING_WINDOWS, HIT_FLASH_DURATION } from '../game/config';
import { useGameLoop, usePreparationAndCountdown, useLaneInput } from '../game/hooks';
import { findCandidate, judgeNote, markLateMisses, type RuntimeNote } from '../game/judgement';
import styles from '../css/canvas.module.scss';

interface CanvasProps {
  width?: number;
  height?: number;
  songId: string;
  onScoreChange?: (score: number) => void;
  canStart?: boolean;
  onFinished?: (finalScore: number) => void;
  startSignal?: number;
  activePlayerName?: string;
  sessionFinished?: boolean;
  onManualStart?: () => void;
  winnerName?: string;
  onRestart?: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ width = 800, height = 600, songId, onScoreChange, canStart = true, onFinished, startSignal, activePlayerName, sessionFinished = false, onManualStart, winnerName, onRestart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);
  const prevStartSignalRef = useRef<number | undefined>(undefined);
  const [score, setScore] = useState(0);
  const comboRef = useRef<number>(0);
  const lastJudgementRef = useRef<string>('');
  const feedbackTimerRef = useRef<number>(0);

  const prep = usePreparationAndCountdown(sessionFinished);
  const { isRunning, setIsRunning, startPreparation, getPrepare, getCountdown, tick } = prep;

  const chart: ChartNote[] = useMemo(() => {
    const song = SONGS.find(s => s.id === songId)!;
    return buildChart(song);
  }, [songId]);
  const lastNoteTime = useMemo(() => chart.length ? Math.max(...chart.map(n => n.time)) : 0, [chart]);
  const notesRef = useRef<RuntimeNote[]>([]);

  // Audio laden wenn Song sich ändert
  const currentSong = useMemo(() => SONGS.find(s => s.id === songId)!, [songId]);
  useEffect(() => {
    if (currentSong.audioPath) {
      const audio = new Audio(currentSong.audioPath);
      audio.preload = 'auto';
      audioRef.current = audio;
      return () => { audio.pause(); audio.src = ''; };
    } else {
      audioRef.current = null;
    }
  }, [currentSong]);

  useEffect(() => { onScoreChange?.(score); }, [score, onScoreChange]);

  useEffect(() => {
    notesRef.current = chart.map(n => ({ ...n }));
    comboRef.current = 0; setScore(0); timeRef.current = 0; pausedTimeRef.current = 0; startTimeRef.current = null; finishedRef.current = false; setIsRunning(false);
  }, [chart, setIsRunning]);

  useEffect(() => {
    if (startSignal === undefined || sessionFinished) return;
    if (prevStartSignalRef.current === undefined) { prevStartSignalRef.current = startSignal; return; }
    if (startSignal !== prevStartSignalRef.current) { prevStartSignalRef.current = startSignal; if (canStart) beginPreparation(); }
  }, [startSignal, canStart, sessionFinished]);

  const beginPreparation = () => {
    notesRef.current = chart.map(n => ({ ...n })); comboRef.current = 0; setScore(0); lastJudgementRef.current=''; feedbackTimerRef.current=0; timeRef.current=0; pausedTimeRef.current=0; startTimeRef.current=null; finishedRef.current=false; setIsRunning(false); startPreparation();
  };

  const flashFeedback = (text: string) => { lastJudgementRef.current = text; feedbackTimerRef.current = 0.5; };

  const handleHit = useCallback((lane: number) => {
    if (!isRunning) return; const now = timeRef.current; const candidate = findCandidate(notesRef.current, lane, now); if (!candidate) return; const result = judgeNote(candidate, now, { current: comboRef.current }); if (result.addScore) setScore(s => s + result.addScore); flashFeedback(result.feedback);
  }, [isRunning]);

  const laneActiveRef = useLaneInput(isRunning, LANE_KEYS, handleHit);
  const updateMisses = (now: number) => { markLateMisses(notesRef.current, now, { current: comboRef.current }, flashFeedback); };

  const draw = (ctx: CanvasRenderingContext2D, now: number) => {
    const laneWidth = width / LANES; const HITLINE_Y = height - 140; ctx.clearRect(0,0,width,height);
    const gradient = ctx.createLinearGradient(0,0,0,height); gradient.addColorStop(0,'#1f2937'); gradient.addColorStop(1,'#111827'); ctx.fillStyle = gradient; ctx.fillRect(0,0,width,height);
    for (let i=0;i<LANES;i++){ const x=i*laneWidth; ctx.fillStyle = LANE_COLORS[i] + '20'; ctx.fillRect(x,0,laneWidth,height); if(i>0){ ctx.strokeStyle='#6b7280'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); }
      if(laneActiveRef.current[i]){ ctx.save(); ctx.fillStyle='rgba(255,255,255,0.18)'; ctx.fillRect(x,0,laneWidth,height); ctx.strokeStyle=LANE_COLORS[i]; ctx.lineWidth=4; ctx.strokeRect(x+4,4,laneWidth-8,height-8); ctx.restore(); }
    }
    ctx.strokeStyle='#e5e7eb'; ctx.lineWidth=3; ctx.strokeRect(6,HITLINE_Y - NOTE_HEIGHT/2,width-12,NOTE_HEIGHT);
    for(const n of notesRef.current){ if(n.judged==='miss') continue; const y = HITLINE_Y - (n.time - now) * SPEED_PX_PER_SEC - NOTE_HEIGHT/2; const x = n.lane * laneWidth + LANE_PADDING; const w = laneWidth - LANE_PADDING*2; if(y < -NOTE_HEIGHT || y > height + NOTE_HEIGHT) continue; ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(x+3,y+3,w,NOTE_HEIGHT); ctx.fillStyle=LANE_COLORS[n.lane]; ctx.fillRect(x,y,w,NOTE_HEIGHT); ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(x,y,w,NOTE_HEIGHT/3); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.strokeRect(x,y,w,NOTE_HEIGHT); if(n.judged==='perfect' || n.judged==='good'){ ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.fillRect(x,y,w,NOTE_HEIGHT); const flash=n.hitFlash??0; if(flash>0){ const t=Math.max(0,Math.min(1,flash/HIT_FLASH_DURATION)); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.fillStyle=`rgba(255,255,255,${0.65*t+0.15})`; ctx.fillRect(x,y,w,NOTE_HEIGHT); ctx.shadowColor=`rgba(255,255,255,${0.9*t})`; ctx.shadowBlur=22*t+6; ctx.lineWidth=4+8*t; ctx.strokeStyle=`rgba(255,255,255,${0.8*t})`; ctx.strokeRect(x-2,y-2,w+4,NOTE_HEIGHT+4); ctx.restore(); } } }
    ctx.fillStyle='#f9fafb'; ctx.font='bold 26px system-ui, -apple-system, Segoe UI, Roboto, Arial'; ctx.textAlign='center'; ctx.fillText('Piano Hero', width/2,36);
    if(getPrepare()>0 && !isRunning){ ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,width,height); ctx.fillStyle='#fff'; ctx.font='bold 34px system-ui, -apple-system, Segoe UI, Roboto, Arial'; ctx.fillText(`Spieler ${activePlayerName || ''} bereit machen...`, width/2,height/2 - 30); ctx.font='18px system-ui, -apple-system, Segoe UI, Roboto, Arial'; ctx.fillText('Gleich startet der Countdown', width/2,height/2 + 10); }
    if(getCountdown()>0){ const n=Math.max(1,Math.ceil(getCountdown())); ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fillRect(0,0,width,height); ctx.fillStyle='#fff'; ctx.font='bold 96px system-ui, -apple-system, Segoe UI, Roboto, Arial'; ctx.fillText(String(n), width/2, height/2); }
    if(sessionFinished){ ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,width,height); }
    
    // Feedback (PERFECT/GOOD/MISS) - größer und tiefer positioniert
    if(feedbackTimerRef.current>0){ 
      const isMiss = lastJudgementRef.current==='MISS';
      ctx.fillStyle = isMiss ? '#ef4444' : '#22c55e'; 
      ctx.font='bold 48px system-ui, -apple-system, Segoe UI, Roboto, Arial'; 
      ctx.textAlign='center';
      // 35px weiter unten: war "height - 140 + 5", jetzt "height - 140 + 15"
      ctx.fillText(lastJudgementRef.current, width/2, height - 140 + 15); 
    }
    
    ctx.font='bold 16px system-ui, -apple-system, Segoe UI, Roboto, Arial'; ctx.fillStyle='#e5e7eb'; for(let i=0;i<LANES;i++){ const x=i*laneWidth + laneWidth/2; ctx.fillText(LANE_KEYS[i].toUpperCase(), x, height - 12); }
  };

  useGameLoop((dt, nowMs) => {
    const started = tick(dt); 
    if(started){ 
      startTimeRef.current = nowMs; 
      timeRef.current = 0;
      // Audio starten wenn vorhanden
      if (audioRef.current && currentSong.audioPath) {
        audioRef.current.currentTime = currentSong.audioStartTime || 0;
        audioRef.current.play().catch(err => console.warn('Audio play failed:', err));
      }
    }
    if(isRunning){ 
      if(startTimeRef.current === null){ startTimeRef.current = nowMs - pausedTimeRef.current * 1000; }
      const nowSec = (nowMs - startTimeRef.current)/1000; 
      timeRef.current = nowSec; 
      updateMisses(nowSec);
      
      // Prüfen ob Audio-Endzeit erreicht wurde
      if (audioRef.current && currentSong.audioEndTime) {
        const audioTime = audioRef.current.currentTime;
        if (audioTime >= currentSong.audioEndTime) {
          finishedRef.current = true;
          setIsRunning(false);
          pausedTimeRef.current = timeRef.current;
          audioRef.current.pause();
          onFinished?.(score);
          return; // Früher exit wenn Audio-Ende erreicht
        }
      }
      
      const allJudged = notesRef.current.length>0 && notesRef.current.every(n => !!n.judged);
      if(!finishedRef.current && allJudged && nowSec >= lastNoteTime + TIMING_WINDOWS.LATE + 0.05){ 
        finishedRef.current=true; 
        setIsRunning(false); 
        pausedTimeRef.current = timeRef.current; 
        // Audio stoppen
        if (audioRef.current) audioRef.current.pause();
        onFinished?.(score); 
      }
    }
    if(feedbackTimerRef.current>0 && dt>0){ feedbackTimerRef.current = Math.max(0, feedbackTimerRef.current - dt); }
    if(dt>0){ for(const n of notesRef.current){ if((n.judged==='perfect' || n.judged==='good') && n.hitFlash && n.hitFlash>0){ n.hitFlash = Math.max(0, n.hitFlash - dt); } } }
    const ctx = canvasRef.current?.getContext('2d'); if(ctx) draw(ctx, timeRef.current);
  }, [width, height, isRunning, sessionFinished, chart, lastNoteTime, currentSong, score, onFinished]);

  const onStart = () => { if(!canStart || sessionFinished) return; onManualStart?.(); };
  const onStop = () => { 
    if(!isRunning) return; 
    pausedTimeRef.current = timeRef.current; 
    setIsRunning(false);
    // Audio pausieren
    if (audioRef.current) audioRef.current.pause();
  };

  return (
    <div style={{ maxWidth: width + 40, margin: '0 auto', position: 'relative' }}>
      <canvas ref={canvasRef} width={width} height={height} className={styles.canvasElement} />
      <EndOverlay visible={!!sessionFinished} winnerName={winnerName} onRestart={onRestart} />
      <div className={styles.gameControls}>
        <button className={`${styles.btn} ${styles.btnStart}`} onClick={onStart} disabled={!canStart || isRunning || sessionFinished}>Start</button>
        <button className={`${styles.btn} ${styles.btnStop}`} onClick={onStop} disabled={!isRunning}>Stop</button>
      </div>
    </div>
  );
};

export default Canvas;
