const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let score;
let scoreText;
let highscore;
let highscoreText;
let player;
let gravity;
let obstacles = [];
let gameSpeed;
let keys = {};
let isGameOver = false; // Track game over state

document.addEventListener('keydown', function (evt) {
    keys[evt.code] = true;

    // Restart game on Enter after game over
    if (isGameOver && evt.code === 'Enter') {
        ResetGame();
    }
});

document.addEventListener('keyup', function (evt) {
    keys[evt.code] = false;
});

// Add touch event listener for jump
canvas.addEventListener('touchstart', function () {
    if (!isGameOver) {
        keys['Enter'] = true; // Simulate jump key
    }
});

canvas.addEventListener('touchend', function () {
    keys['Enter'] = false; // Stop jump
});

class Player {
    constructor(x, y, r, c) { // Changed width/height to radius
        this.x = x;
        this.y = y;
        this.r = r; // Radius
        this.c = c;

        this.dy = 0;
        this.jumpForce = 15;
        this.originalRadius = r; // Store original radius
        this.grounded = false;
        this.jumpTimer = 0;
    }

    Animate() {
        // Jump
        if (keys['Space'] || keys['KeyW'] || keys['Enter']) { // Added 'Enter'
            this.Jump();
        } else {
            this.jumpTimer = 0;
        }

        // Reduce size
        if (keys['ShiftLeft'] || keys['KeyS']) {
            this.r = this.originalRadius / 2; // Reduce radius
        } else {
            this.r = this.originalRadius; // Reset radius
        }

        this.y += this.dy;

        // Gravity
        if (this.y + this.r < canvas.height) {
            this.dy += gravity;
            this.grounded = false;
        } else {
            this.dy = 0;
            this.grounded = true;
            this.y = canvas.height - this.r; // Adjust for circle
        }

        this.Draw();
    }

    Jump() {
        if (this.grounded && this.jumpTimer == 0) {
            this.jumpTimer = 1;
            this.dy = -this.jumpForce;
        } else if (this.jumpTimer > 0 && this.jumpTimer < 15) {
            this.jumpTimer++;
            this.dy = -this.jumpForce - (this.jumpTimer / 50);
        }
    }

    Draw() {
        ctx.beginPath();
        ctx.fillStyle = this.c;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); // Draw circle
        ctx.fill();
        ctx.closePath();
    }
}

class Obstacle {
    constructor(x, y, size, shape, c) {
        this.x = x;
        this.y = y;
        this.size = size; // Size for both width/height or radius
        this.shape = shape; // "rectangle" or "circle"
        this.c = c;

        this.dx = -gameSpeed;
    }

    Update() {
        this.x += this.dx;
        this.Draw();
        this.dx = -gameSpeed;
    }

    Draw() {
        ctx.beginPath();
        ctx.fillStyle = this.c;
        if (this.shape === "rectangle") {
            ctx.fillRect(this.x, this.y, this.size, this.size);
        } else if (this.shape === "circle") {
            ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.closePath();
    }
}

class Text{
    constructor(t, x, y, a, c, s){
        this.t = t;
        this.x = x;
        this.y = y;
        this.a = a;
        this.c = c;
        this.s = s;
    }

    Draw(){
        ctx.beginPath();
        ctx.fillStyle = this.c;
        ctx.font = this.s + "px sans-serif";
        ctx.textAlign = this.a;
        ctx.fillText(this.t, this.x, this.y);
        ctx.closePath();
    }
}

function SpawnObstacle() {
    let size = RandomInt(20, 70);
    let type = RandomInt(0, 1);
    let shape = RandomInt(0, 1) === 0 ? "rectangle" : "circle"; // Randomize shape
    let yPosition = canvas.height - size;

    if (type === 1) {
        yPosition -= player.originalRadius - 10; // Ground obstacle
    } else {
        yPosition = RandomInt(50, canvas.height - size - 50); // Flying obstacle
    }

    let obstacle = new Obstacle(canvas.width + size, yPosition, size, shape, '#2484E4');
    obstacles.push(obstacle);
}

function RandomInt(min, max){
    return Math.round(Math.random() * (max - min) + min);
}

function Start(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.font = "20px sans-serif";

    gameSpeed = 3;
    gravity = 1;

    score = 0;
    highscore = 0;
    if(localStorage.getItem('highscore')){
        highscore = localStorage.getItem('highscore');
    }

    player = new Player(50, 0, 25, '#FFA500'); // Changed to yellow-orange circle

    scoreText = new Text("Score: " + score, 25, 25, "left", "#212121", "20");
    highscoreText = new Text("Highscore: " + highscore, canvas.width - 25, 25, "right", "#212121", "20");

    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    requestAnimationFrame(Update);
}

let initialSpawnTimer = 200;
let spawnTimer = initialSpawnTimer;

function DisplayGameOver() {
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.font = "50px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    ctx.font = "20px sans-serif";
    ctx.fillText("Press Enter to Restart", canvas.width / 2, canvas.height / 2 + 50);
    ctx.closePath();
    isGameOver = true; // Set game over state
}

function ResetGame() {
    // Reset game variables but keep the high score
    obstacles = [];
    score = 0;
    obstacles = [];
    spawnTimer = initialSpawnTimer;
    gameSpeed = 3;
    isGameOver = false;
    player.y = 0; // Reset player position
    player.dy = 0; // Reset player velocity
    requestAnimationFrame(Update); // Restart the game loop
}

function DrawBackground() {
    let gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#87CEEB"); // Sky blue
    gradient.addColorStop(1, "#FFFFFF"); // White
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function Update() {
    if (isGameOver) return; // Stop updating if the game is over

    DrawBackground(); // Draw the gradient background

    spawnTimer--;
    if (spawnTimer <= 0) {
        SpawnObstacle();
        spawnTimer = initialSpawnTimer - gameSpeed * 8;

        if (spawnTimer < 60) {
            spawnTimer = 60;
        }
    }

    // Spawn Enemies
    for (let i = 0; i < obstacles.length; i++) {
        let o = obstacles[i];

        if (o.x + o.size < 0) {
            obstacles.splice(i, 1);
        }

        // Collision detection for rectangle
        if (o.shape === "rectangle") {
            let distX = Math.abs(player.x - (o.x + o.size / 2));
            let distY = Math.abs(player.y - (o.y + o.size / 2));

            if (distX <= player.r + o.size / 2 && distY <= player.r + o.size / 2) {
                DisplayGameOver();
                return; // Stop the game
            }
        }

        // Collision detection for circle
        else if (o.shape === "circle") {
            let distX = player.x - (o.x + o.size / 2);
            let distY = player.y - (o.y + o.size / 2);
            let distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < player.r + o.size / 2) {
                DisplayGameOver();
                return; // Stop the game
            }
        }

        o.Update();
    }

    player.Animate();

    score++;
    scoreText.t = "Score: " + score;
    scoreText.Draw();
    if (score > highscore) {
        highscore = score;
        highscoreText.t = "Highscore: " + highscore;
    }

    highscoreText.Draw();
    gameSpeed += 0.003; // Gradually increase game speed

    requestAnimationFrame(Update); // Continue the game loop
}

Start();