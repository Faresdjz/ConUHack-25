import PropTypes from 'prop-types';
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
    return (
        <div className="inventory">
            <h3>Inventory</h3>
            <div className="inventory-grid">
                {items.map((item, index) => (
                    <div 
                        key={index} 
                        className="inventory-item" 
                        onClick={() => window.player.updateBulletStats(item.stats)}
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

export function GameUI({ money }) {
    return (
        <div className="game-ui">
            <HealthBar />
            <MoneyCounter money={money} />
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
