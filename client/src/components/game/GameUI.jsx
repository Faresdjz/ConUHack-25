import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import './GameUI.css';

export function HealthBar() {
    return (
        <div className="health-container">
            <div className="health-bar-bg">
                <div id="health-bar" className="health-bar"></div>
            </div>
        </div>
    );
}

export function MoneyCounter({ money }) {
    return (
        <div className="money-container">
            <span className="money-symbol">$</span>
            <span id="money-count">{money}</span>
        </div>
    );
}

MoneyCounter.propTypes = {
    money: PropTypes.number.isRequired
};

export function Controls() {
    return (
        <div className="controls">
            <div className="player-controls">
                <p>Controls:</p>
                <p>Arrow keys to move and aim</p>
                <p>Enter to shoot</p>
            </div>
        </div>
    );
}

function Inventory({ items }) {
    const [activeItemIndex, setActiveItemIndex] = useState(null);

    const handleItemClick = (index, stats) => {
        setActiveItemIndex(index);
        window.player.updateBulletStats(stats);
    };

    return (
        <div className="inventory">
            <h3>Inventory</h3>
            <div className="inventory-grid">
                {items.map((item, index) => (
                    <div 
                        key={index} 
                        className={`inventory-item ${activeItemIndex === index ? 'active' : ''}`}
                        onClick={() => handleItemClick(index, item.stats)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="item-name">{item.name}</div>
                        <div className="item-stats">
                            <div>Damage: {item.stats.damage}</div>
                            <div>Fire Rate: {item.stats.firerate}/s</div>
                        </div>
                        <div className="item-price">${item.price}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

Inventory.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        price: PropTypes.number,
        stats: PropTypes.shape({
            firerate: PropTypes.number,
            damage: PropTypes.number
        })
    })).isRequired
};

export function GameOver({ score, onRestart, show }) {
    if (!show) return null;

    return (
        <div className="game-over-overlay">
            <div className="game-over-popup">
                <h2>Game Over!</h2>
                <p>Your Score: ${score}</p>
                <button className="restart-button" onClick={onRestart}>
                    Play Again
                </button>
            </div>
        </div>
    );
}

GameOver.propTypes = {
    score: PropTypes.number.isRequired,
    onRestart: PropTypes.func.isRequired,
    show: PropTypes.bool.isRequired
};

export function GameUI({ money }) {
    const [showGameOver, setShowGameOver] = useState(false);
    const [finalScore, setFinalScore] = useState(0);

    useEffect(() => {
        window.gameOver = (score) => {
            setFinalScore(score);
            setShowGameOver(true);
        };
    }, []);

    const handleRestart = () => {
        setShowGameOver(false);
        if (window.player) {
            window.player.health = 100;
            window.player.money = 100;
        }
    };

    return (
        <div className="game-ui">
            <HealthBar />
            <MoneyCounter money={money} />
            <GameOver 
                score={finalScore}
                onRestart={handleRestart}
                show={showGameOver}
            />
        </div>
    );
}

GameUI.propTypes = {
    money: PropTypes.number.isRequired
};

export function InventoryUI({ inventory = [] }) {
    return (
        <div className="inventory-container">
            <Inventory items={inventory} />
        </div>
    );
}

InventoryUI.propTypes = {
    inventory: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        price: PropTypes.number,
        stats: PropTypes.shape({
            firerate: PropTypes.number,
            damage: PropTypes.number
        })
    }))
};
