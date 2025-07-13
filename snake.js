// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');

// Game settings
const GRID_SIZE = 20;
const CANVAS_SIZE = 360;
const GRID_COUNT = CANVAS_SIZE / GRID_SIZE;

// Game state
let snake = [{ x: 10, y: 10 }];
let direction = { x: 0, y: 0 };
let food = { x: 15, y: 15 };
let score = 0;
let gameRunning = false;
let gameLoop;

// Touch controls
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// Initialize game
function init() {
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    resetGame();
    setupControls();
}

// Reset game to initial state
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 0, y: 0 };
    food = generateFood();
    score = 0;
    gameRunning = true;
    
    updateScore();
    gameOverElement.style.display = 'none';
    
    clearInterval(gameLoop);
    gameLoop = setInterval(update, 150);
}

// Generate random food position
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_COUNT),
            y: Math.floor(Math.random() * GRID_COUNT)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    return newFood;
}

// Update game state
function update() {
    if (!gameRunning) return;
    
    // Don't move if no direction is set
    if (direction.x === 0 && direction.y === 0) return;
    
    // Calculate new head position
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    
    // Check wall collision
    if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
        gameOver();
        return;
    }
    
    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        food = generateFood();
    } else {
        snake.pop();
    }
    
    draw();
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw food
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    
    // Draw snake
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#2ed573' : '#1dd1a1';
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    });
}

// Update score display
function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
}

// Game over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    gameOverElement.style.display = 'block';
}

// Setup controls
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (direction.y !== 1) {
                    direction = { x: 0, y: -1 };
                }
                break;
            case 'ArrowDown':
                if (direction.y !== -1) {
                    direction = { x: 0, y: 1 };
                }
                break;
            case 'ArrowLeft':
                if (direction.x !== 1) {
                    direction = { x: -1, y: 0 };
                }
                break;
            case 'ArrowRight':
                if (direction.x !== -1) {
                    direction = { x: 1, y: 0 };
                }
                break;
        }
    });
    
    // Touch controls
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        handleSwipe();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // Prevent context menu
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Restart button
    restartBtn.addEventListener('click', resetGame);
}

// Handle swipe gestures
function handleSwipe() {
    if (!gameRunning) return;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return;
    }
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && direction.x !== -1) {
            direction = { x: 1, y: 0 }; // Right
        } else if (deltaX < 0 && direction.x !== 1) {
            direction = { x: -1, y: 0 }; // Left
        }
    } else {
        // Vertical swipe
        if (deltaY > 0 && direction.y !== -1) {
            direction = { x: 0, y: 1 }; // Down
        } else if (deltaY < 0 && direction.y !== 1) {
            direction = { x: 0, y: -1 }; // Up
        }
    }
}

// Auto-start game when page loads
document.addEventListener('DOMContentLoaded', init);

// Handle window resize
window.addEventListener('resize', () => {
    // Maintain game state on resize
    draw();
});
