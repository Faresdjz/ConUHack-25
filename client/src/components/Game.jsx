import { useEffect, useRef } from 'react';
import './Game.css';

const PLAYER_SIZE = 30;
const MAX_HEALTH = 100;
const PLAYER_SPEED = 5;
const ENEMY_SIZE = 25; // Visual size
const ENEMY_HITBOX_SIZE = 15; // Collision detection size
const ENEMY_SPEED = 2;
const COLLISION_DAMAGE = 10;
const INVINCIBILITY_FRAMES = 1000; // ms
const HEALTH_REGEN_RATE = 0.05; // health per frame
const HEALTH_REGEN_DELAY = 3000; // ms before health starts regenerating
const MONEY_SIZE = 15;
const SPAWN_INTERVAL = 2000;
const MONEY_SPAWN_INTERVAL = 3000;

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
    constructor(x, y, ctx, canvas) {
        this.x = x;
        this.y = y;
        this.health = 50;
        this.ctx = ctx;
        this.canvas = canvas;
        this.size = ENEMY_SIZE; // Visual size
        this.hitboxSize = ENEMY_HITBOX_SIZE; // Collision size
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
        this.lastDamageTime = 0;
        this.lastHitTime = 0;
        this.isFlashing = false;
    }

    getCurrentGun() {
        return GUNS[window.currentGun];
    }

    draw() {
        // Draw player body with damage flash effect
        this.ctx.fillStyle = this.isFlashing ? '#ff0000' : this.color;
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

                if (distance < (enemy.hitboxSize/2 + this.getCurrentGun().bulletSize)) {
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

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 600;

        let enemies = [];
        let moneyDrops = [];

        const setupGame = () => {
            window.currentGun = 0;

            window.player = new Player(canvas.width/2, canvas.height/2, '#4CAF50', {
                up: false,
                down: false,
                left: false,
                right: false,
                shoot: false
            }, ctx, canvas);

            setInterval(() => {
                const side = Math.floor(Math.random() * 4);
                let x, y;
                
                switch(side) {
                    case 0: // top
                        x = Math.random() * (canvas.width - ENEMY_SIZE) + ENEMY_SIZE/2;
                        y = 0;
                        break;
                    case 1: // right
                        x = canvas.width;
                        y = Math.random() * (canvas.height - ENEMY_SIZE) + ENEMY_SIZE/2;
                        break;
                    case 2: // bottom
                        x = Math.random() * (canvas.width - ENEMY_SIZE) + ENEMY_SIZE/2;
                        y = canvas.height;
                        break;
                    case 3: // left
                        x = 0;
                        y = Math.random() * (canvas.height - ENEMY_SIZE) + ENEMY_SIZE/2;
                        break;
                }
                
                enemies.push(new Enemy(x, y, ctx, canvas));
            }, SPAWN_INTERVAL);

            setInterval(() => {
                const x = Math.random() * (canvas.width - 100) + 50;
                const y = Math.random() * (canvas.height - 100) + 50;
                moneyDrops.push(new MoneyDrop(x, y, Math.floor(Math.random() * 50) + 10, ctx));
            }, MONEY_SPAWN_INTERVAL);
        };

        const gameLoop = () => {
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
                const combinedRadius = (PLAYER_SIZE/2 + enemy.hitboxSize/2);

                const currentTime = Date.now();
                if (distance < combinedRadius && 
                    currentTime - window.player.lastDamageTime > INVINCIBILITY_FRAMES) {
                    window.player.health -= COLLISION_DAMAGE;
                    window.player.lastDamageTime = currentTime;
                    window.player.lastHitTime = currentTime;
                    window.player.isFlashing = true;
                    setTimeout(() => {
                        window.player.isFlashing = false;
                    }, 200);

                    // Simple knockback
                    const knockbackForce = 20;
                    const angle = Math.atan2(dy, dx);
                    const knockbackX = Math.cos(angle) * knockbackForce;
                    const knockbackY = Math.sin(angle) * knockbackForce;

                    // Apply knockback with boundary check
                    const newX = window.player.x + knockbackX;
                    const newY = window.player.y + knockbackY;

                    if (newX >= PLAYER_SIZE/2 && newX <= canvas.width - PLAYER_SIZE/2) {
                        window.player.x = newX;
                    }
                    if (newY >= PLAYER_SIZE/2 && newY <= canvas.height - PLAYER_SIZE/2) {
                        window.player.y = newY;
                    }
                }

                // Health regeneration
                if (currentTime - window.player.lastHitTime > HEALTH_REGEN_DELAY && window.player.health < MAX_HEALTH) {
                    window.player.health = Math.min(MAX_HEALTH, window.player.health + HEALTH_REGEN_RATE);
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
                alert('Game Over! Your score: $' + window.player.money);
                window.player.health = MAX_HEALTH;
                window.player.money = 100;
                enemies = [];
                moneyDrops = [];
                window.currentGun = 0;
            }

            requestAnimationFrame(gameLoop);
        };

        const handleKeyDown = (e) => {
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
        };
    }, []);

    return (
        <div className="game-container">
            <div className="game-ui">
                <div className="health-container">
                    <div className="health-bar-bg">
                        <div id="health-bar" className="health-bar"></div>
                    </div>
                </div>
                <div className="money-container">
                    <span className="money-symbol">$</span>
                    <span id="money-count"></span>
                </div>
            </div>
            <canvas ref={canvasRef} id="gameCanvas"></canvas>
            <div className="controls">
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
