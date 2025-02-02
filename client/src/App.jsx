import { useState, useEffect } from 'react'
import './App.css'
import ChatBot from './components/ChatBot'
import Game from './components/Game'
import './components/ChatBot.css'
import './components/Game.css'

function App() {
  const [gameState, setGameState] = useState({
    money: window.player?.money || 1000,
    inventory: []
  });

  // Sync money with player
  useEffect(() => {
    const moneyInterval = setInterval(() => {
      if (window.player) {
        setGameState(prev => ({
          ...prev,
          money: window.player.money
        }));
      }
    }, 100);

    return () => clearInterval(moneyInterval);
  }, []);

  const handleItemGenerated = (item) => {
    if (item.price <= window.player.money) {
      window.player.money -= item.price;
      setGameState(prev => ({
        ...prev,
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
        <Game inventory={gameState.inventory} money={gameState.money} />
        <ChatBot onItemGenerated={handleItemGenerated} />
      </main>
    </div>
  )
}

export default App
