import { Enemy, MoneyDrop, Player } from './entities';
import { SPAWN_INTERVAL, MONEY_SPAWN_INTERVAL, MAX_HEALTH, COLLISION_DAMAGE, INVINCIBILITY_FRAMES, HEALTH_REGEN_DELAY, HEALTH_REGEN_RATE } from './constants';

export function setupGame(canvas, ctx) {
    window.currentGun = 0;
    const enemies = [];
    const moneyDrops = [];

    window.player = new Player(
        canvas.width/2, 
        canvas.height/2, 
        '#4CAF50',
        {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false
        },
        ctx,
        canvas
    );

    // Enemy spawn interval
    setInterval(() => {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // top
                x = Math.random() * (canvas.width - 25) + 12.5;
                y = 0;
                break;
            case 1: // right
                x = canvas.width;
                y = Math.random() * (canvas.height - 25) + 12.5;
                break;
            case 2: // bottom
                x = Math.random() * (canvas.width - 25) + 12.5;
                y = canvas.height;
                break;
            case 3: // left
                x = 0;
                y = Math.random() * (canvas.height - 25) + 12.5;
                break;
        }
        
        enemies.push(new Enemy(x, y, ctx, canvas));
    }, SPAWN_INTERVAL);

    // Money spawn interval
    setInterval(() => {
        const x = Math.random() * (canvas.width - 100) + 50;
        const y = Math.random() * (canvas.height - 100) + 50;
        moneyDrops.push(new MoneyDrop(x, y, Math.floor(Math.random() * 50) + 10, ctx));
    }, MONEY_SPAWN_INTERVAL);

    return { enemies, moneyDrops };
}

export function updateGame(ctx, canvas, enemies, moneyDrops) {
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
        const combinedRadius = 22.5; // (PLAYER_SIZE/2 + enemy.hitboxSize/2)

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

            if (newX >= 15 && newX <= canvas.width - 15) {
                window.player.x = newX;
            }
            if (newY >= 15 && newY <= canvas.height - 15) {
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

        if (distance < 22.5) { // (PLAYER_SIZE/2 + MONEY_SIZE/2)
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
        enemies.length = 0;
        moneyDrops.length = 0;
        window.currentGun = 0;
    }
}

export function handleKeyDown(e) {
    if (!window.player) return;
    
    switch(e.key) {
        case 'ArrowUp': window.player.controls.up = true; break;
        case 'ArrowDown': window.player.controls.down = true; break;
        case 'ArrowLeft': window.player.controls.left = true; break;
        case 'ArrowRight': window.player.controls.right = true; break;
        case 'Enter': window.player.controls.shoot = true; break;
    }
}

export function handleKeyUp(e) {
    if (!window.player) return;
    
    switch(e.key) {
        case 'ArrowUp': window.player.controls.up = false; break;
        case 'ArrowDown': window.player.controls.down = false; break;
        case 'ArrowLeft': window.player.controls.left = false; break;
        case 'ArrowRight': window.player.controls.right = false; break;
        case 'Enter': window.player.controls.shoot = false; break;
    }
}
