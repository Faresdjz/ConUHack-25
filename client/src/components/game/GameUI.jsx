import React from 'react';
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

export function MoneyCounter() {
    return (
        <div className="money-container">
            <span className="money-symbol">$</span>
            <span id="money-count"></span>
        </div>
    );
}

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

export function GameUI() {
    return (
        <div className="game-ui">
            <HealthBar />
            <MoneyCounter />
        </div>
    );
}

GameUI.propTypes = {
    onItemGenerated: PropTypes.func,
    inventory: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        price: PropTypes.number,
        stats: PropTypes.shape({
            firerate: PropTypes.number,
            damage: PropTypes.number
        })
    }))
};
