import GameCanvas from './components/GameCanvas'
import './App.css'

function App() {
  return (
    <div className="app">
      <header style={{ 
        textAlign: 'center', 
        padding: '20px', 
        backgroundColor: '#34495e', 
        color: 'white',
        marginBottom: '20px'
      }}>
        <h1>Piano Game - Canvas Demo</h1>
        <p>Ein einfaches Canvas-Spiel als Ausgangspunkt für Ihr Piano-Spiel</p>
      </header>
      
      <main style={{ 
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 120px)'
      }}>
        <GameCanvas width={800} height={600} />
      </main>
    </div>
  )
}

export default App
