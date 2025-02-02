import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { GUNS } from './game/constants';
import { GameUI, Controls, InventoryUI } from './game/GameUI';
import { setupGame, updateGame, handleKeyDown, handleKeyUp } from './game/gameLogic';
import './Game.css';

function Game({ onItemGenerated, inventory }) {
    const canvasRef = useRef(null);
    const gameStateRef = useRef({ enemies: [], moneyDrops: [] });

    const handleItemGenerated = useCallback((item) => {
        if (item && item.stats && item.stats.firerate) {
            // Convert firerate (shots per second) to cooldown (milliseconds)
            const cooldown = 1000 / item.stats.firerate;
            
            // Create a new gun with the AI-generated stats
            const newGun = {
                name: item.name || 'Custom Weapon',
                bulletSize: 5,
                bulletSpeed: 8,
                damage: item.stats.damage || 10,
                cooldown: cooldown,
                color: '#' + Math.floor(Math.random()*16777215).toString(16),
                cost: item.price || 0
            };

            // Add the new gun to GUNS array
            GUNS.push(newGun);
            // Switch to the new gun
            window.currentGun = GUNS.length - 1;
        }
    }, []);

    // Process new items from inventory
    useEffect(() => {
        inventory.forEach(item => {
            if (item.stats && item.stats.firerate) {
                const cooldown = 1000 / item.stats.firerate;
                
                const newGun = {
                    name: item.name || 'Custom Weapon',
                    bulletSize: 5,
                    bulletSpeed: 8,
                    damage: item.stats.damage || 10,
                    cooldown: cooldown,
                    color: '#' + Math.floor(Math.random()*16777215).toString(16),
                    cost: item.price || 0
                };

                if (!GUNS.some(gun => gun.name === newGun.name)) {
                    GUNS.push(newGun);
                }
            }
        });
    }, [inventory]);

    useEffect(() => {
        if (onItemGenerated) {
            onItemGenerated(handleItemGenerated);
        }

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
    }, [onItemGenerated, handleItemGenerated]);

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
    onItemGenerated: PropTypes.func,
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
