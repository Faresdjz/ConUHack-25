import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { GameUI, Controls, InventoryUI } from './game/GameUI';
import { setupGame, updateGame, handleKeyDown, handleKeyUp } from './game/gameLogic';
import './Game.css';

function Game({ inventory }) {
    const canvasRef = useRef(null);
    const gameStateRef = useRef({ enemies: [], moneyDrops: [] });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 600;

        const { enemies, moneyDrops } = setupGame(canvas, ctx);
        gameStateRef.current = { enemies, moneyDrops };

        const gameLoop = () => {
            updateGame(ctx, canvas, gameStateRef.current.enemies, gameStateRef.current.moneyDrops);
            requestAnimationFrame(gameLoop);
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        gameLoop();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <div className="game-container">
            <GameUI />
            <canvas ref={canvasRef} id="gameCanvas"></canvas>
            <Controls />
            <InventoryUI inventory={inventory} />
        </div>
    );
}

Game.propTypes = {
    inventory: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        price: PropTypes.number,
        stats: PropTypes.shape({
            firerate: PropTypes.number,
            damage: PropTypes.number
        })
    })).isRequired
};

export default Game;
