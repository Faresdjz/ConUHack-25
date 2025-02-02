import { useEffect, useRef, useState } from 'react';
import './Game.css';

const PLAYER_SIZE = 30;
const MAX_HEALTH = 100;
const PLAYER_SPEED = 5;
const ENEMY_SIZE = 25;
const ENEMY_SPEED = 2;
const MONEY_SIZE = 15;
const SPAWN_INTERVAL = 2000;
const MONEY_SPAWN_INTERVAL = 3000;
const INITIAL_COUNTDOWN = 10;
const LEVEL_COUNTDOWN = 120;

const GUNS = [
    {
        name: 'Pistol',
        bulletSize: 5,
        bulletSpeed: 7,
        damage: 10,
        cooldown: 500,
        color: '#FFD700',
        cost: 0
    },
    {
        name: 'Shotgun',
        bulletSize: 4,
        bulletSpeed: 9,
        damage: 15,
        cooldown: 800,
        color: '#FF4500',
        spread: 3,
        cost: 500
    },
    {
        name: 'Machine Gun',
        bulletSize: 3,
        bulletSpeed: 10,
        damage: 5,
        cooldown: 150,
        color: '#00FF00',
        cost: 750
    },
    {
        name: 'Sniper',
        bulletSize: 6,
        bulletSpeed: 15,
        damage: 40,
        cooldown: 1000,
        color: '#1E90FF',
        cost: 1000
    }
];

class Enemy {
    constructor(x, y, ctx, canvas, level) {
        this.x = x;
        this.y = y;
        this.health = 50 + (level * 25); // Health scales with level
        this.ctx = ctx;
        this.canvas = canvas;
        this.size = ENEMY_SIZE;
    }

    draw() {
        this.ctx.fillStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
        this.ctx.fill();

        // Health bar
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.x - 20, this.y - 30, 40, 4);
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.x - 20, this.y - 30, (this.health / 50) * 40, 4);
    }

    moveTowards(targetX, targetY) {
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        this.x += Math.cos(angle) * ENEMY_SPEED;
        this.y += Math.sin(angle) * ENEMY_SPEED;
    }
}

class MoneyDrop {
    constructor(x, y, amount, ctx) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.ctx = ctx;
    }

    draw() {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, MONEY_SIZE/2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('$' + this.amount, this.x, this.y + 4);
    }
}

class Player {
    constructor(x, y, color, controls, ctx, canvas) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.controls = controls;
        this.health = MAX_HEALTH;
        this.money = 100;
        this.bullets = [];
        this.lastShot = 0;
        this.ctx = ctx;
        this.canvas = canvas;
        this.direction = 'down';
    }

    getCurrentGun() {
        return GUNS[window.currentGun];
    }

    draw() {
        // Draw player body
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, PLAYER_SIZE/2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw direction indicator
        this.ctx.fillStyle = '#fff';
        let indicatorX = this.x;
        let indicatorY = this.y;
        const offset = PLAYER_SIZE/2 - 5;
        
        switch(this.direction) {
            case 'right': indicatorX += offset; break;
            case 'left': indicatorX -= offset; break;
            case 'up': indicatorY -= offset; break;
            case 'down': indicatorY += offset; break;
        }
        
        this.ctx.beginPath();
        this.ctx.arc(indicatorX, indicatorY, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw bullets
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = this.getCurrentGun().color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, this.getCurrentGun().bulletSize, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw current gun name
        this.ctx.fillStyle = this.color;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.getCurrentGun().name, this.x, this.y + 40);
    }

    move() {
        if (this.controls.up && this.y > PLAYER_SIZE/2) {
            this.y -= PLAYER_SPEED;
            this.direction = 'up';
        }
        if (this.controls.down && this.y < this.canvas.height - PLAYER_SIZE/2) {
            this.y += PLAYER_SPEED;
            this.direction = 'down';
        }
        if (this.controls.left && this.x > PLAYER_SIZE/2) {
            this.x -= PLAYER_SPEED;
            this.direction = 'left';
        }
        if (this.controls.right && this.x < this.canvas.width - PLAYER_SIZE/2) {
            this.x += PLAYER_SPEED;
            this.direction = 'right';
        }
    }

    shoot() {
        const currentTime = Date.now();
        const gun = this.getCurrentGun();
        if (this.controls.shoot && currentTime - this.lastShot > gun.cooldown) {
            let dx = 0, dy = 0;
            switch(this.direction) {
                case 'right': dx = 1; dy = 0; break;
                case 'left': dx = -1; dy = 0; break;
                case 'up': dx = 0; dy = -1; break;
                case 'down': dx = 0; dy = 1; break;
            }
            
            if (gun.name === 'Shotgun') {
                for (let i = -1; i <= 1; i++) {
                    const spread = i * 0.2;
                    this.bullets.push({
                        x: this.x,
                        y: this.y,
                        dx: dx + (dy * spread),
                        dy: dy + (dx * spread)
                    });
                }
            } else {
                this.bullets.push({
                    x: this.x,
                    y: this.y,
                    dx: dx,
                    dy: dy
                });
            }
            
            this.lastShot = currentTime;
        }
    }

    updateBullets(enemies) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.dx * this.getCurrentGun().bulletSpeed;
            bullet.y += bullet.dy * this.getCurrentGun().bulletSpeed;
            
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.bullets.splice(i, 1);
                continue;
            }

            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < (enemy.size/2 + this.getCurrentGun().bulletSize)) {
                    enemy.health -= this.getCurrentGun().damage;
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
    }
}

function Game() {
    const canvasRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const [level, setLevel] = useState(0);
    const [countdown, setCountdown] = useState(INITIAL_COUNTDOWN);
    const [isLevelCountdown, setIsLevelCountdown] = useState(false);
    const gameLoopRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 600;

        let enemies = [];
        let moneyDrops = [];
        let maxEnemies = 5; // Initial max enemies

        const setupGame = () => {
            window.currentGun = 0;

            window.player = new Player(canvas.width/2, canvas.height/2, '#4CAF50', {
                up: false,
                down: false,
                left: false,
                right: false,
                shoot: false
            }, ctx, canvas);

            // Start initial countdown
            const countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        setLevel(1);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            const spawnEnemy = () => {
                if (isPaused || enemies.length >= maxEnemies || countdown > 0) return;
                const side = Math.floor(Math.random() * 4);
                let x, y;
                
                switch(side) {
                    case 0: // top
                        x = Math.random() * canvas.width;
                        y = -ENEMY_SIZE;
                        break;
                    case 1: // right
                        x = canvas.width + ENEMY_SIZE;
                        y = Math.random() * canvas.height;
                        break;
                    case 2: // bottom
                        x = Math.random() * canvas.width;
                        y = canvas.height + ENEMY_SIZE;
                        break;
                    case 3: // left
                        x = -ENEMY_SIZE;
                        y = Math.random() * canvas.height;
                        break;
                }
                
                enemies.push(new Enemy(x, y, ctx, canvas, level));
            };

            const enemySpawnInterval = setInterval(spawnEnemy, SPAWN_INTERVAL);

            const spawnMoney = () => {
                if (isPaused || countdown > 0) return;
                const x = Math.random() * (canvas.width - 100) + 50;
                const y = Math.random() * (canvas.height - 100) + 50;
                moneyDrops.push(new MoneyDrop(x, y, Math.floor(Math.random() * 50) + 10, ctx));
            };

            const moneySpawnInterval = setInterval(spawnMoney, MONEY_SPAWN_INTERVAL);

            return () => {
                clearInterval(enemySpawnInterval);
                clearInterval(moneySpawnInterval);
                clearInterval(countdownInterval);
            };
        };

        const checkLevelComplete = () => {
            if (enemies.length === 0 && level > 0 && !isLevelCountdown) {
                setIsLevelCountdown(true);
                setCountdown(LEVEL_COUNTDOWN);
                const levelCountdownInterval = setInterval(() => {
                    setCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(levelCountdownInterval);
                            setIsLevelCountdown(false);
                            setLevel(prevLevel => prevLevel + 1);
                            maxEnemies += 2; // Increase max enemies each level
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        };

        const gameLoop = () => {
            if (isPaused) {
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            window.player.move();
            window.player.shoot();
            window.player.updateBullets(enemies);
            window.player.draw();

            // Update and draw enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                enemy.moveTowards(window.player.x, window.player.y);
                enemy.draw();

                // Check collision with player
                const dx = enemy.x - window.player.x;
                const dy = enemy.y - window.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < (PLAYER_SIZE/2 + enemy.size/2)) {
                    window.player.health -= 1;
                }

                if (enemy.health <= 0) {
                    const moneyAmount = Math.floor(Math.random() * 30) + 20;
                    moneyDrops.push(new MoneyDrop(enemy.x, enemy.y, moneyAmount, ctx));
                    enemies.splice(i, 1);
                }
            }

            // Update and draw money drops
            for (let i = moneyDrops.length - 1; i >= 0; i--) {
                const money = moneyDrops[i];
                money.draw();

                const dx = money.x - window.player.x;
                const dy = money.y - window.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < (PLAYER_SIZE/2 + MONEY_SIZE/2)) {
                    window.player.money += money.amount;
                    moneyDrops.splice(i, 1);
                    document.getElementById('money-count').textContent = window.player.money;
                }
            }

            // Update UI
            document.getElementById('health-bar').style.width = `${window.player.health}%`;
            document.getElementById('money-count').textContent = window.player.money;

            if (window.player.health <= 0) {
                alert('Game Over! Your score: $' + window.player.money + '\nLevel reached: ' + level);
                window.player.health = MAX_HEALTH;
                window.player.money = 100;
                enemies = [];
                moneyDrops = [];
                window.currentGun = 0;
                setLevel(0);
                setCountdown(INITIAL_COUNTDOWN);
                maxEnemies = 5;
            }

            checkLevelComplete();

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsPaused(!isPaused);
                return;
            }
            switch(e.key) {
                case 'ArrowUp': window.player.controls.up = true; break;
                case 'ArrowDown': window.player.controls.down = true; break;
                case 'ArrowLeft': window.player.controls.left = true; break;
                case 'ArrowRight': window.player.controls.right = true; break;
                case 'Enter': window.player.controls.shoot = true; break;
            }
        };

        const handleKeyUp = (e) => {
            switch(e.key) {
                case 'ArrowUp': window.player.controls.up = false; break;
                case 'ArrowDown': window.player.controls.down = false; break;
                case 'ArrowLeft': window.player.controls.left = false; break;
                case 'ArrowRight': window.player.controls.right = false; break;
                case 'Enter': window.player.controls.shoot = false; break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        setupGame();
        gameLoop();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, []);

    return (
        <div className="game-container">
            <div className="game-ui">
                <button className="pause-button" onClick={() => setIsPaused(!isPaused)}>
                    {isPaused ? 'Resume' : 'Pause'}
                </button>
                <div className="health-container">
                    <div className="health-bar-bg">
                        <div id="health-bar" className="health-bar"></div>
                    </div>
                </div>
                <div className="money-container">
                    <span className="money-symbol">$</span>
                    <span id="money-count">100</span>
                </div>
            </div>
            <canvas ref={canvasRef} id="gameCanvas"></canvas>
            {isPaused && (
                <div className="pause-overlay">
                    <div className="pause-menu">
                        <h2>Game Paused</h2>
                        <button onClick={() => setIsPaused(false)}>Resume</button>
                    </div>
                </div>
            )}
            {countdown > 0 && (
                <div className="countdown-overlay">
                    <div className="countdown">
                        {isLevelCountdown ? (
                            <h2>Next Level in: {Math.ceil(countdown)}s</h2>
                        ) : (
                            <h2>Game starts in: {countdown}s</h2>
                        )}
                    </div>
                </div>
            )}
            <div className="controls">
                <div className="level-counter">
                    <h3>Level: {level}</h3>
                </div>
                <div className="player-controls">
                    <p>Controls:</p>
                    <p>Arrow keys to move and aim</p>
                    <p>Enter to shoot</p>
                </div>
            </div>
        </div>
    );
}

export default Game;
