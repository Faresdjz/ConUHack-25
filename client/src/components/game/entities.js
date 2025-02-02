import { ENEMY_SIZE, ENEMY_HITBOX_SIZE, ENEMY_SPEED, MONEY_SIZE, PLAYER_SIZE, MAX_HEALTH, PLAYER_SPEED } from './constants';

export class Enemy {
    constructor(x, y, ctx, canvas) {
        this.x = x;
        this.y = y;
        this.health = 50;
        this.ctx = ctx;
        this.canvas = canvas;
        this.size = ENEMY_SIZE;
        this.hitboxSize = ENEMY_HITBOX_SIZE;
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

export class MoneyDrop {
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

export class Player {
    constructor(x, y, color, controls, ctx, canvas) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.controls = controls;
        this.health = MAX_HEALTH;
        this.money = 0;
        this.bullets = [];
        this.lastShot = 0;
        this.ctx = ctx;
        this.canvas = canvas;
        this.direction = 'down';
        this.lastDamageTime = 0;
        this.lastHitTime = 0;
        this.isFlashing = false;
        
        // Default bullet properties
        this.bulletProps = {
            size: 5,
            speed: 7,
            damage: 10,
            cooldown: 500,
            color: '#FFD700'
        };
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
            this.ctx.fillStyle = this.bulletProps.color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, this.bulletProps.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
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
        if (this.controls.shoot && currentTime - this.lastShot > this.bulletProps.cooldown) {
            let dx = 0, dy = 0;
            switch(this.direction) {
                case 'right': dx = 1; dy = 0; break;
                case 'left': dx = -1; dy = 0; break;
                case 'up': dx = 0; dy = -1; break;
                case 'down': dx = 0; dy = 1; break;
            }
            
            this.bullets.push({
                x: this.x,
                y: this.y,
                dx: dx,
                dy: dy
            });
            
            this.lastShot = currentTime;
        }
    }

    updateBulletStats(stats) {
        // Update each property if provided in stats
        if (stats.size !== undefined) this.bulletProps.size = stats.size;
        if (stats.speed !== undefined) this.bulletProps.speed = stats.speed;
        if (stats.damage !== undefined) this.bulletProps.damage = stats.damage;
        if (stats.cooldown !== undefined) this.bulletProps.cooldown = stats.cooldown;
        if (stats.color !== undefined) this.bulletProps.color = stats.color;
    }

    updateBullets(enemies) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.dx * this.bulletProps.speed;
            bullet.y += bullet.dy * this.bulletProps.speed;
            
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

                if (distance < (enemy.hitboxSize/2 + this.bulletProps.size)) {
                    enemy.health -= this.bulletProps.damage;
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }
    }
}
