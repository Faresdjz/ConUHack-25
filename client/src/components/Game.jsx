import { useEffect, useRef } from 'react';
import './Game.css';

const PLAYER_SIZE = 30;
const MAX_HEALTH = 100;
const PLAYER_SPEED = 5;
const WIN_SCORE = 10;

const GUNS = [
    {
        name: 'Pistol',
        bulletSize: 5,
        bulletSpeed: 7,
        damage: 10,
        cooldown: 500,
        color: '#FFD700'
    },
    {
        name: 'Shotgun',
        bulletSize: 4,
        bulletSpeed: 9,
        damage: 15,
        cooldown: 800,
        color: '#FF4500',
        spread: 3
    },
    {
        name: 'Machine Gun',
        bulletSize: 3,
        bulletSpeed: 10,
        damage: 5,
        cooldown: 150,
        color: '#00FF00'
    },
    {
        name: 'Sniper',
        bulletSize: 6,
        bulletSpeed: 15,
        damage: 40,
        cooldown: 1000,
        color: '#1E90FF'
    }
];

class Player {
    constructor(x, y, color, controls, playerImage, ctx, canvas) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.controls = controls;
        this.image = playerImage;
        this.health = MAX_HEALTH;
        this.score = 0;
        this.bullets = [];
        this.lastShot = 0;
        this.ctx = ctx;
        this.canvas = canvas;
    }

    getCurrentGun() {
        return GUNS[window.currentGun];
    }

    draw() {
        this.ctx.drawImage(this.image, this.x - PLAYER_SIZE/2, this.y - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.x - 25, this.y - 40, 50, 5);
        this.ctx.fillStyle = this.health > 30 ? 'green' : 'red';
        this.ctx.fillRect(this.x - 25, this.y - 40, (this.health / MAX_HEALTH) * 50, 5);

        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = this.getCurrentGun().color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, this.getCurrentGun().bulletSize, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.fillStyle = this.color;
        this.ctx.font = '12px Arial';
        this.ctx.fillText(this.getCurrentGun().name, this.x - 20, this.y + 40);
    }

    move() {
        if (this.controls.up && this.y > PLAYER_SIZE/2) this.y -= PLAYER_SPEED;
        if (this.controls.down && this.y < this.canvas.height - PLAYER_SIZE/2) this.y += PLAYER_SPEED;
        if (this.controls.left && this.x > PLAYER_SIZE/2) this.x -= PLAYER_SPEED;
        if (this.controls.right && this.x < this.canvas.width - PLAYER_SIZE/2) this.x += PLAYER_SPEED;
    }

    shoot() {
        const currentTime = Date.now();
        const gun = this.getCurrentGun();
        if (this.controls.shoot && currentTime - this.lastShot > gun.cooldown) {
            const direction = this === window.player1 ? 1 : -1;
            
            if (gun.name === 'Shotgun') {
                for (let i = -1; i <= 1; i++) {
                    this.bullets.push({
                        x: this.x + (direction * PLAYER_SIZE),
                        y: this.y,
                        direction: direction,
                        spread: i * 0.2
                    });
                }
            } else {
                this.bullets.push({
                    x: this.x + (direction * PLAYER_SIZE),
                    y: this.y,
                    direction: direction,
                    spread: 0
                });
            }
            
            this.lastShot = currentTime;
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.direction * this.getCurrentGun().bulletSpeed;
            bullet.y += bullet.spread * this.getCurrentGun().bulletSpeed;
            
            if (bullet.x < 0 || bullet.x > this.canvas.width) {
                this.bullets.splice(i, 1);
                continue;
            }

            const opponent = this === window.player1 ? window.player2 : window.player1;
            if (Math.abs(bullet.x - opponent.x) < PLAYER_SIZE/2 &&
                Math.abs(bullet.y - opponent.y) < PLAYER_SIZE/2) {
                opponent.health -= this.getCurrentGun().damage;
                this.bullets.splice(i, 1);

                if (opponent.health <= 0) {
                    this.score++;
                    document.getElementById(this === window.player1 ? 'p1-score' : 'p2-score').textContent = this.score;
                    
                    if (this.score >= WIN_SCORE) {
                        alert(`${this === window.player1 ? 'Player 1' : 'Player 2'} wins the game!`);
                        window.resetGame();
                    } else {
                        window.currentGun = (window.currentGun + 1) % GUNS.length;
                        window.resetRound();
                    }
                }
            }
        }
    }
}

function Game() {
    const canvasRef = useRef(null);
    const player1ImageRef = useRef(null);
    const player2ImageRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = 800;
        canvas.height = 600;

        const player1Image = new Image();
        const player2Image = new Image();
        player1Image.src = '/player1.svg';
        player2Image.src = '/player2.svg';

        player1ImageRef.current = player1Image;
        player2ImageRef.current = player2Image;

        const setupGame = () => {
            window.currentGun = 0;

            window.player1 = new Player(200, canvas.height/2, '#4CAF50', {
                up: false,
                down: false,
                left: false,
                right: false,
                shoot: false
            }, player1Image, ctx, canvas);

            window.player2 = new Player(600, canvas.height/2, '#f44336', {
                up: false,
                down: false,
                left: false,
                right: false,
                shoot: false
            }, player2Image, ctx, canvas);

            window.resetGame = () => {
                window.player1.score = 0;
                window.player2.score = 0;
                document.getElementById('p1-score').textContent = '0';
                document.getElementById('p2-score').textContent = '0';
                window.currentGun = 0;
                window.resetRound();
            };

            window.resetRound = () => {
                window.player1.x = 200;
                window.player1.y = canvas.height/2;
                window.player1.health = MAX_HEALTH;
                window.player1.bullets = [];

                window.player2.x = 600;
                window.player2.y = canvas.height/2;
                window.player2.health = MAX_HEALTH;
                window.player2.bullets = [];
            };

            const gameLoop = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                window.player1.move();
                window.player2.move();
                window.player1.shoot();
                window.player2.shoot();
                window.player1.updateBullets();
                window.player2.updateBullets();

                window.player1.draw();
                window.player2.draw();

                requestAnimationFrame(gameLoop);
            };

            gameLoop();
        };

        const handleKeyDown = (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': window.player1.controls.up = true; break;
                case 's': window.player1.controls.down = true; break;
                case 'a': window.player1.controls.left = true; break;
                case 'd': window.player1.controls.right = true; break;
                case ' ': window.player1.controls.shoot = true; break;
                
                case 'arrowup': window.player2.controls.up = true; break;
                case 'arrowdown': window.player2.controls.down = true; break;
                case 'arrowleft': window.player2.controls.left = true; break;
                case 'arrowright': window.player2.controls.right = true; break;
                case 'enter': window.player2.controls.shoot = true; break;
            }
        };

        const handleKeyUp = (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': window.player1.controls.up = false; break;
                case 's': window.player1.controls.down = false; break;
                case 'a': window.player1.controls.left = false; break;
                case 'd': window.player1.controls.right = false; break;
                case ' ': window.player1.controls.shoot = false; break;
                
                case 'arrowup': window.player2.controls.up = false; break;
                case 'arrowdown': window.player2.controls.down = false; break;
                case 'arrowleft': window.player2.controls.left = false; break;
                case 'arrowright': window.player2.controls.right = false; break;
                case 'enter': window.player2.controls.shoot = false; break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        const imagesLoaded = () => {
            return player1Image.complete && player2Image.complete;
        };

        if (imagesLoaded()) {
            setupGame();
        } else {
            Promise.all([
                new Promise(resolve => player1Image.onload = resolve),
                new Promise(resolve => player2Image.onload = resolve)
            ]).then(setupGame);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <div className="game-container">
            <div className="score-board">
                <div className="player1-score">Player 1: <span id="p1-score">0</span></div>
                <div className="player2-score">Player 2: <span id="p2-score">0</span></div>
            </div>
            <canvas ref={canvasRef} id="gameCanvas"></canvas>
            <div className="controls">
                <div className="player1-controls">
                    <p>Player 1 Controls:</p>
                    <p>WASD to move</p>
                    <p>SPACE to shoot</p>
                </div>
                <div className="player2-controls">
                    <p>Player 2 Controls:</p>
                    <p>Arrow Keys to move</p>
                    <p>ENTER to shoot</p>
                </div>
            </div>
        </div>
    );
}

export default Game;
