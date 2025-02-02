import { useState } from 'react'
import './App.css'
import ChatBot from './components/ChatBot'
import Game from './components/Game'
import './components/ChatBot.css'
import './components/Game.css'

function App() {
  const [gameState, setGameState] = useState({
    money: 1000,
    inventory: []
  });

  const handleItemGenerated = (item) => {
    if (item.price <= gameState.money) {
      setGameState(prev => ({
        ...prev,
        money: prev.money - item.price,
        inventory: [...prev.inventory, item]
      }));
      console.log("Purchased item:", item);
    } else {
      alert("Not enough money to purchase this item!");
    }
  };

  return (
    <div className="app">
      <header>
        <h1>AI Chat Assistant & Game</h1>
      </header>
      <main className="main-content">
        <Game inventory={gameState.inventory} />
        <ChatBot onItemGenerated={handleItemGenerated} />
      </main>
    </div>
  )
}

export default App
