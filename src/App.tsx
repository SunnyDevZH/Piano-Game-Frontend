import { useState, useEffect, useMemo } from 'react'
import GameCanvas, { SONGS } from './components/GameCanvas'
import './App.css'

interface Player {
  id: number
  name: string
  score: number
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [songId, setSongId] = useState(SONGS[0].id)

  // Responsive Canvas: 100% Breite der Center-Spalte, Höhe 80% des Bildschirms
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  useEffect(() => {
    const recalc = () => {
      const vh80 = Math.floor(window.innerHeight * 0.8)
      const rightWidth = 260
      const gap = 20
      const padding = 40 // layout padding links + rechts (2x20)
      const centerWidth = Math.max(300, window.innerWidth - rightWidth - gap - padding)
      setCanvasSize({ width: centerWidth, height: vh80 })
    }
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [])

  // Players und aktive Auswahl
  const [players, setPlayers] = useState<Player[]>([])
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null)
  const activePlayer = useMemo(() => players.find(p => p.id === activePlayerId) || null, [players, activePlayerId])

  // Session-Steuerung
  const [startSignal, setStartSignal] = useState(0)
  const [sessionFinished, setSessionFinished] = useState(false)
  const [playersPlayedThisRound, setPlayersPlayedThisRound] = useState<number>(0)
  const winner = useMemo(() => {
    if (players.length === 0) return null
    return players.slice().sort((a, b) => b.score - a.score)[0]
  }, [players])

  const [newPlayerName, setNewPlayerName] = useState('')
  const addPlayer = () => {
    const name = newPlayerName.trim()
    if (!name) return
    const p: Player = { id: Date.now(), name, score: 0 }
    setPlayers(prev => [...prev, p])
    if (activePlayerId == null) setActivePlayerId(p.id)
    setNewPlayerName('')
  }

  const onScoreChange = (score: number) => {
    if (activePlayerId == null) return
    setPlayers(prev => prev.map(p => (p.id === activePlayerId ? { ...p, score } : p)))
  }

  const advanceToNextPlayer = () => {
    if (players.length === 0 || activePlayerId == null) return
    const idx = players.findIndex(p => p.id === activePlayerId)
    if (idx === -1) return

    const nextPlayedCount = playersPlayedThisRound + 1
    const roundDone = nextPlayedCount >= players.length

    if (roundDone) {
      // Alle Spieler haben gespielt -> Session beenden, kein Auto-Start
      setSessionFinished(true)
      setPlayersPlayedThisRound(0)
      return
    }

    const nextIdx = (idx + 1) % players.length
    setActivePlayerId(players[nextIdx].id)
    setPlayersPlayedThisRound(nextPlayedCount)
    // Nach dem Wechsel automatisch neu starten (Vorbereitung + Countdown im Canvas)
    setStartSignal(s => s + 1)
  }

  const onManualStart = () => {
    if (!activePlayerId) return
    // Neue Session starten oder nächste Runde fortsetzen
    setSessionFinished(false)
    setPlayersPlayedThisRound(0)
    // Scores behalten für Highscore Anzeige bis Restart
    setStartSignal(s => s + 1)
  }

  const onRestart = () => {
    // Neues Spiel: Scores auf 0, aktiven Spieler auf ersten setzen, Session zurücksetzen
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })))
    if (players.length > 0) setActivePlayerId(players[0].id)
    setPlayersPlayedThisRound(0)
    setSessionFinished(false)
    setStartSignal(s => s + 1)
  }

  useEffect(() => {
    // Zeige Spinner für 3.5 Sekunden
    const timer = setTimeout(() => setIsLoading(false), 3500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner-container">
          <div className="spinner"></div>
          <h1 className="game-title">Piano Game</h1>
          <div className="keys-hint">
            Steuere mit den Tasten
            {' '}
            <span className="keycap">A</span>
            <span className="keycap">S</span>
            <span className="keycap">D</span>
            <span className="keycap">F</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app" style={{ maxHeight: '100vh', overflow: 'hidden' }}>
      <div className="layout" style={{ maxHeight: '100vh', gridTemplateColumns: `1fr 260px` }}>
        {/* Center: Canvas */}
        <main className="center" style={{ maxHeight: 'calc(100vh - 40px)', overflow: 'auto' }}>
          <div className="canvas-wrapper" style={{ width: '100%' }}>
            <GameCanvas
              songId={songId}
              width={canvasSize.width}
              height={canvasSize.height}
              onScoreChange={onScoreChange}
              canStart={activePlayerId != null}
              onFinished={() => advanceToNextPlayer()}
              startSignal={startSignal}
              activePlayerName={activePlayer?.name}
              sessionFinished={sessionFinished}
              onManualStart={onManualStart}
              winnerName={winner?.name}
              onRestart={onRestart}
            />
          </div>
        </main>

        {/* Right Sidebar: Spieler & Scores + Songs */}
        <aside className="sidebar right" style={{ maxHeight: 'calc(100vh - 40px)', overflow: 'auto' }}>
          <h3>Spieler</h3>
          <div className="add-player">
            <input
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Name hinzufügen"
            />
            <button onClick={addPlayer}>+</button>
          </div>
          <ul className="players-list">
            {players.length === 0 && <li className="muted">Noch keine Spieler</li>}
            {players.map(p => (
              <li
                key={p.id}
                className={`player-item ${p.id === activePlayerId ? 'active' : ''}`}
                onClick={() => setActivePlayerId(p.id)}
                style={p.id === activePlayerId ? { border: '2px solid #000', padding: '5px' } : {}}
              >
                <span className="name">{p.name}</span>
                <span className="score">{p.score}</span>
              </li>
            ))}
          </ul>
          {activePlayer && (
            <div className="active-hint">Aktiv: {activePlayer.name}</div>
          )}

          {/* Songs Box unter Spieler */}
          <div className="songs-box">
            <h3>Songs</h3>
            <select
              className="song-select"
              value={songId}
              onChange={(e) => setSongId(e.target.value)}
            >
              {SONGS.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            <p className="hint">Wähle einen Song und starte im Spiel.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App
