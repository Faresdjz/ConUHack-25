export const PLAYER_SIZE = 30;
export const MAX_HEALTH = 100;
export const PLAYER_SPEED = 5;
export const ENEMY_SIZE = 25;
export const ENEMY_HITBOX_SIZE = 15;
export const ENEMY_SPEED = 2;
export const COLLISION_DAMAGE = 10;
export const INVINCIBILITY_FRAMES = 1000;
export const HEALTH_REGEN_RATE = 0.05;
export const HEALTH_REGEN_DELAY = 3000;
export const MONEY_SIZE = 15;
export const SPAWN_INTERVAL = 2000;
export const MONEY_SPAWN_INTERVAL = 3000;

export const GUNS = [
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
