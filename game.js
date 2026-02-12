const game = {
    lives: 3,
    score: 0,
    difficulty: 1,
    isRunning: false,

    startGame: function () {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lives = 3;
        this.score = 0;
        this.difficulty = 1;
        this.updateHUD();
        console.log("Juego Iniciado");
        alert("¡Juego Iniciado! (Lógica pendiente de implementar)");
    },

    stopGame: function () {
        this.isRunning = false;
        console.log("Juego Detenido");
    },

    addScore: function (points) {
        this.score += points;
        this.checkDifficulty();
        this.updateHUD();
    },

    loseLife: function () {
        if (this.lives > 0) {
            this.lives--;
            this.updateHUD();
        }

        if (this.lives <= 0) {
            this.gameOver();
        }
    },

    checkDifficulty: function () {
        if (this.score >= 20) {
            this.difficulty = 3;
        } else if (this.score >= 10) {
            this.difficulty = 2;
        }
    },

    updateHUD: function () {
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('score').textContent = this.score;
        document.getElementById('difficulty').textContent = this.difficulty;
    },

    gameOver: function () {
        this.stopGame();
        alert(`¡Juego Terminado! Puntuación final: ${this.score}`);
        // Reset for next game or show Game Over screen
    }
};

// Make game object available globally for now for testing
window.game = game;
