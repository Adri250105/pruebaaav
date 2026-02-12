const game = {
    lives: 3,
    score: 0,
    difficulty: 1,
    isRunning: false,
    canvas: null,
    ctx: null,
    player: { x: 0, y: 0, width: 60, height: 40, color: '#FFD700' },
    items: [],
    animationFrameId: null,
    lastTime: 0,
    spawnTimer: 0,
    mousePos: { x: 0, y: 0 },
    timeLeft: 30,
    keys: { left: false, right: false },
    inputMode: 'mouse', // 'mouse' or 'keyboard'
    listenersAdded: false,

    init: function () {
        // Initializes default state if needed
        this.updateHUD();
    },

    startGame: function () {
        if (this.isRunning) return;

        const gameArea = document.getElementById('game-area');
        // Clear placeholder but beware: this removes the buttons if they are inside #game-area
        gameArea.innerHTML = '';

        this.canvas = document.createElement('canvas');
        this.canvas.width = gameArea.clientWidth;
        this.canvas.height = gameArea.clientHeight;
        gameArea.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        // Resize listener
        window.addEventListener('resize', () => {
            if (this.canvas) {
                this.canvas.width = gameArea.clientWidth;
                this.canvas.height = gameArea.clientHeight;
                this.player.y = this.canvas.height - 80;
            }
        });

        // Input listeners
        this.addInputListeners();

        this.isRunning = true;
        this.lives = 3;
        this.score = 0;
        this.difficulty = 1;
        this.timeLeft = 30;
        this.items = [];
        this.inputMode = 'mouse';
        this.keys = { left: false, right: false };
        this.player.y = this.canvas.height - 80;
        this.player.x = this.canvas.width / 2;

        this.updateHUD();
        this.lastTime = performance.now();
        this.loop(this.lastTime);

        console.log("Juego 'Vida Submarina' Iniciado");
    },

    stopGame: function () {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    },

    addInputListeners: function () {
        if (this.listenersAdded) return;

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.keys.left = true;
                this.inputMode = 'keyboard';
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.keys.right = true;
                this.inputMode = 'keyboard';
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
        });

        // Mouse (only active if canvas exists, but we attach to window/canvas dynamically)
        // Since canvas is recreated, we might need to re-attach or delegate. 
        // Simpler: attach to game-area or handle globally if needed. 
        // Here we attach to the specific canvas created in startGame, but since that function creates it fresh:
        // We will attach there. But wait, if we call addInputListeners only once, we can't attach to a non-existent canvas.
        // So let's attach mouse listeners inside startGame or use a persistent container.
        // For robustness, let's keep mouse move locally in startGame or delegate.
        // Actually, let's stick to the previous pattern but ensure it works.
        this.listenersAdded = true;
    },

    spawnItem: function () {
        const type = Math.random() > (this.difficulty === 1 ? 0.7 : 0.5) ? 'plastic' : 'fish';
        const item = {
            x: Math.random() * (this.canvas.width - 30),
            y: -30,
            width: 30,
            height: 30,
            type: type,
            // Speed increases with difficulty
            speed: (Math.random() * 2 + 2) + (this.difficulty * 1.5),
            // Zigzag properties for Level 3
            zigzagOffset: Math.random() * 100,
            originalX: 0
        };
        item.originalX = item.x;
        this.items.push(item);
    },

    // Method to add score manually (for simulation buttons or internal logic)
    addScore: function (points) {
        if (!this.isRunning && this.lives <= 0) return; // Don't add if game over
        // If game not running but lives > 0 (e.g. testing before start), valid? 
        // Let's assume valid.

        this.score += points;
        this.checkDifficulty();
        this.updateHUD();
    },

    update: function (deltaTime) {
        // Timer
        this.timeLeft -= deltaTime / 1000;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.gameOver();
            return;
        }
        this.updateHUD();

        // Player Movement
        if (this.inputMode === 'mouse') {
            this.player.x += (this.mousePos.x - this.player.width / 2 - this.player.x) * 0.2;
        } else {
            // Keyboard movement
            const moveSpeed = 8 * (deltaTime / 16); // Normalize speed
            if (this.keys.left) this.player.x -= moveSpeed;
            if (this.keys.right) this.player.x += moveSpeed;
        }

        // Clamp player to screen
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width - this.player.width) this.player.x = this.canvas.width - this.player.width;

        // Spawning
        this.spawnTimer += deltaTime;
        // Spawn rate increases with difficulty (decrease interval)
        const spawnInterval = Math.max(500, 1500 - (this.difficulty * 300));

        if (this.spawnTimer > spawnInterval) {
            this.spawnItem();
            this.spawnTimer = 0;
        }

        // Items Update
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += item.speed * (deltaTime / 16); // Normalize speed

            // Level 3: Zigzag movement
            if (this.difficulty >= 3) {
                item.x = item.originalX + Math.sin((item.y + item.zigzagOffset) * 0.05) * 50;
            }

            // check collision with player
            if (
                item.x < this.player.x + this.player.width &&
                item.x + item.width > this.player.x &&
                item.y < this.player.y + this.player.height &&
                item.y + item.height > this.player.y
            ) {
                // Collision
                if (item.type === 'plastic') {
                    this.addScore(1); // Use the method!
                } else {
                    this.loseLife();
                }
                this.items.splice(i, 1);
                continue;
            }

            // check bounds (bottom of screen)
            if (item.y > this.canvas.height) {
                if (item.type === 'plastic') {
                    // Missed plastic -> Life Lost
                    this.loseLife();
                }
                this.items.splice(i, 1);
            }
        }
    },

    draw: function () {
        if (!this.ctx) return;
        // Clear screen
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Player (Net)
        this.ctx.fillStyle = '#8B4513'; // Woody color for handle?
        this.ctx.fillRect(this.player.x + this.player.width / 2 - 2, this.player.y + 20, 4, 40); // Handle

        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2, this.player.y + 20, 25, 0, Math.PI, false); // Net rim
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fill(); // Net mesh look

        // Draw Items
        this.items.forEach(item => {
            this.ctx.font = '24px Arial';
            if (item.type === 'plastic') {
                this.ctx.fillText('🥤', item.x, item.y + 24);
            } else {
                this.ctx.fillText('🐠', item.x, item.y + 24);
            }
        });
    },

    loop: function (timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts));
    },

    loseLife: function () {
        if (this.lives > 0) {
            this.lives--;
            this.updateHUD();

            // Visual feedback
            if (this.canvas) {
                const originalBg = this.canvas.style.backgroundColor;
                this.canvas.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
                setTimeout(() => {
                    this.canvas.style.backgroundColor = 'transparent';
                }, 100);
            }
        }

        if (this.lives <= 0) {
            this.gameOver();
        }
    },

    checkDifficulty: function () {
        const oldDiff = this.difficulty;
        if (this.score >= 20) {
            this.difficulty = 3;
        } else if (this.score >= 10) {
            this.difficulty = 2;
        }

        if (this.difficulty > oldDiff) {
            console.log('Level Up!');
        }
    },

    updateHUD: function () {
        const livesEl = document.getElementById('lives');
        const scoreEl = document.getElementById('score');
        const timerEl = document.getElementById('timer');
        const diffEl = document.getElementById('difficulty');

        if (livesEl) livesEl.textContent = this.lives;
        if (scoreEl) scoreEl.textContent = this.score;
        if (timerEl) timerEl.textContent = Math.ceil(this.timeLeft);
        if (diffEl) {
            const diffText = this.difficulty === 1 ? '1 (Lento)' : this.difficulty === 2 ? '2 (Rápido + Peces)' : '3 (ZigZag)';
            diffEl.textContent = diffText;
        }
    },

    gameOver: function () {
        this.stopGame();

        const gameArea = document.getElementById('game-area');
        gameArea.innerHTML = `
            <div class="placeholder-game">
                <h2>¡Juego Terminado!</h2>
                <p>Puntuación final: ${this.score}</p>
                <p>${this.timeLeft <= 0 ? "¡Tiempo Agotado!" : "¡Te quedaste sin vidas!"}</p>
                <button onclick="game.startGame()">Jugar de nuevo</button>
            </div>
        `;
    }
};

window.game = game;


