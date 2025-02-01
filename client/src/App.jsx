import './App.css'
import ChatBot from './components/ChatBot'
import Game from './components/Game'
import './components/ChatBot.css'
import './components/Game.css'

function App() {
  return (
    <div className="app">
      <header>
        <h1>AI Chat Assistant & Game</h1>
      </header>
      <main className="main-content">
        <Game />
        <ChatBot />
      </main>
    </div>
  )
}

export default App
