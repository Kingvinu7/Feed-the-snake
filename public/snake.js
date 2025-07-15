const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');
const shareBtn = document.getElementById('shareBtn');
const highScoresBtn = document.getElementById('highScoresBtn');
const highScoresContainer = document.getElementById('highScoresContainer');
const highScoresList = document.getElementById('highScoresList');
const clearHighScoresBtn = document.getElementById('clearHighScoresBtn');
const closeHighScoresBtn = document.getElementById('closeHighScoresBtn');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let dx = 0;
let dy = 0;
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let gameRunning = false;
let gameStarted = false;
let touchStartX = 0;
let touchStartY = 0;
let lastMoveTime = 0;
let gameSpeed = 150;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

// Update best score display
bestScoreEl.textContent = `Best: ${bestScore}`;

// Enhanced food generation
function generateFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
  return newFood;
}

// Enhanced drawing with better visuals
function drawGame() {
  // Clear canvas with gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#000');
  gradient.addColorStop(1, '#111');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid lines
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(canvas.width, i * gridSize);
    ctx.stroke();
  }

  // Draw snake with gradient and glow effect
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    const x = segment.x * gridSize;
    const y = segment.y * gridSize;
    
    // Glow effect
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = isHead ? 20 : 10;
    
    // Snake body gradient
    const snakeGradient = ctx.createRadialGradient(
      x + gridSize/2, y + gridSize/2, 0,
      x + gridSize/2, y + gridSize/2, gridSize/2
    );
    
    if (isHead) {
      snakeGradient.addColorStop(0, '#00ff88');
      snakeGradient.addColorStop(1, '#00cc66');
    } else {
      const intensity = 1 - (index / snake.length) * 0.5;
      snakeGradient.addColorStop(0, `rgba(0, 255, 136, ${intensity})`);
      snakeGradient.addColorStop(1, `rgba(0, 204, 102, ${intensity})`);
    }
    
    ctx.fillStyle = snakeGradient;
    ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
    
    // Add border to head
    if (isHead) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
    }
  });

  // Draw food with pulsing glow effect
  const foodX = food.x * gridSize;
  const foodY = food.y * gridSize;
  
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur = 15;
  
  const foodGradient = ctx.createRadialGradient(
    foodX + gridSize/2, foodY + gridSize/2, 0,
    foodX + gridSize/2, foodY + gridSize/2, gridSize/2
  );
  foodGradient.addColorStop(0, '#ff6666');
  foodGradient.addColorStop(1, '#ff4444');
  
  ctx.fillStyle = foodGradient;
  ctx.fillRect(foodX + 2, foodY + 2, gridSize - 4, gridSize - 4);
  
  // Reset shadow
  ctx.shadowBlur = 0;
}

// Enhanced game logic with wrap-around
function updateGame() {
  if (!gameRunning) return;

  const now = Date.now();
  if (now - lastMoveTime < gameSpeed) return;
  lastMoveTime = now;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Wrap around borders instead of collision
  if (head.x < 0) head.x = tileCount - 1;
  if (head.x >= tileCount) head.x = 0;
  if (head.y < 0) head.y = tileCount - 1;
  if (head.y >= tileCount) head.y = 0;

  // Check collision with body
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Check if food is eaten
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = `Score: ${score}`;
    food = generateFood();
    
    // Increase speed slightly
    gameSpeed = Math.max(80, gameSpeed - 1);
    
    // Add particle effect (visual feedback)
    createParticleEffect(head.x * gridSize, head.y * gridSize);
  } else {
    snake.pop();
  }

  drawGame();
}

// Particle effect for food consumption
function createParticleEffect(x, y) {
  // Visual feedback could be added here
  // For now, just a simple flash effect
  setTimeout(() => {
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(x, y, gridSize, gridSize);
    setTimeout(() => drawGame(), 100);
  }, 50);
}

// Enhanced game over with high scores
function gameOver() {
  gameRunning = false;
  gameStarted = false;
  
  // Update best score
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('bestScore', bestScore);
    bestScoreEl.textContent = `Best: ${bestScore}`;
  }
  
  // Add to high scores
  const gameDate = new Date().toLocaleDateString();
  highScores.push({ score: score, date: gameDate });
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 10); // Keep top 10
  localStorage.setItem('highScores', JSON.stringify(highScores));
  
  finalScoreEl.textContent = `Final Score: ${score}`;
  gameOverScreen.style.display = 'block';
  
  // Add celebratory effect for new high score
  if (score === bestScore && score > 0) {
    document.body.style.animation = 'celebration 2s ease-in-out';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 2000);
  }
}

// Enhanced restart function
function restartGame() {
  snake = [{ x: 10, y: 10 }];
  food = generateFood();
  dx = 0;
  dy = 0;
  score = 0;
  gameSpeed = 150;
  scoreEl.textContent = `Score: ${score}`;
  gameOverScreen.style.display = 'none';
  gameRunning = false;
  gameStarted = false;
  drawGame();
}

// Enhanced controls with better touch support
function changeDirection(newDx, newDy) {
  // Prevent reverse direction
  if (newDx === -dx && newDy === -dy) return;
  
  dx = newDx;
  dy = newDy;
  
  if (!gameStarted) {
    gameStarted = true;
    gameRunning = true;
    lastMoveTime = Date.now();
  }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!gameRunning && !gameStarted) {
    // Start game with any arrow key
    switch (e.key) {
      case 'ArrowUp':
        changeDirection(0, -1);
        break;
      case 'ArrowDown':
        changeDirection(0, 1);
        break;
      case 'ArrowLeft':
        changeDirection(-1, 0);
        break;
      case 'ArrowRight':
        changeDirection(1, 0);
        break;
    }
  } else if (gameRunning) {
    switch (e.key) {
      case 'ArrowUp':
        changeDirection(0, -1);
        break;
      case 'ArrowDown':
        changeDirection(0, 1);
        break;
      case 'ArrowLeft':
        changeDirection(-1, 0);
        break;
      case 'ArrowRight':
        changeDirection(1, 0);
        break;
    }
  }
});

// Enhanced touch controls
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  
  if (!touchStartX || !touchStartY) return;
  
  const touch = e.changedTouches[0];
  const touchEndX = touch.clientX;
  const touchEndY = touch.clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  const minSwipeDistance = 30;
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        changeDirection(1, 0); // Right
      } else {
        changeDirection(-1, 0); // Left
      }
    }
  } else {
    // Vertical swipe
    if (Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        changeDirection(0, 1); // Down
      } else {
        changeDirection(0, -1); // Up
      }
    }
  }
}, { passive: false });

// High scores functionality
function displayHighScores() {
  const scoresList = document.getElementById('highScoresList');
  
  if (highScores.length === 0) {
    scoresList.innerHTML = '<div class="loading">No high scores yet! Start playing to set your first record!</div>';
    return;
  }
  
  scoresList.innerHTML = highScores.map((scoreData, index) => `
    <div class="high-score-item">
      <div class="high-score-rank">#${index + 1}</div>
      <div class="high-score-value">${scoreData.score}</div>
      <div class="high-score-date">${scoreData.date}</div>
    </div>
  `).join('');
}

// Enhanced share functionality
function shareScore() {
  const shareText = `🐍 I just scored ${score} points in Feed The Snake! Can you beat my score?`;
  const shareUrl = window.location.href;
  
  if (navigator.share) {
    navigator.share({
      title: 'Feed The Snake - High Score!',
      text: shareText,
      url: shareUrl
    }).catch(console.error);
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
      // Visual feedback
      shareBtn.textContent = '✅ Copied!';
      setTimeout(() => {
        shareBtn.textContent = '📤 Share Score';
      }, 2000);
    }).catch(() => {
      // Fallback
      prompt('Copy this text to share your score:', `${shareText} ${shareUrl}`);
    });
  } else {
    // Fallback for older browsers
    prompt('Copy this text to share your score:', `${shareText} ${shareUrl}`);
  }
}

// Event listeners
restartBtn.addEventListener('click', restartGame);
shareBtn.addEventListener('click', shareScore);

highScoresBtn.addEventListener('click', () => {
  displayHighScores();
  highScoresContainer.style.display = 'flex';
});

closeHighScoresBtn.addEventListener('click', () => {
  highScoresContainer.style.display = 'none';
});

clearHighScoresBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all high scores?')) {
    highScores = [];
    localStorage.removeItem('highScores');
    displayHighScores();
  }
});

// Close modal when clicking outside
highScoresContainer.addEventListener('click', (e) => {
  if (e.target === highScoresContainer) {
    highScoresContainer.style.display = 'none';
  }
});

// Game loop
function gameLoop() {
  updateGame();
  requestAnimationFrame(gameLoop);
}

// Add celebration animation CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes celebration {
    0%, 100% { transform: scale(1); }
    25% { transform: scale(1.05); }
    50% { transform: scale(1.1); }
    75% { transform: scale(1.05); }
  }
`;
document.head.appendChild(style);

// Initialize game
food = generateFood();
drawGame();
gameLoop();

// Add resize handler for responsive canvas
function resizeCanvas() {
  const container = document.getElementById('gameContainer');
  const containerWidth = container.clientWidth - 32; // Account for padding
  const size = Math.min(containerWidth, 400);
  
  canvas.width = size;
  canvas.height = size;
  
  // Redraw after resize
  drawGame();
}

// Initial resize and add event listener
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Prevent context menu on long press
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Add visual feedback for button presses
document.querySelectorAll('button').forEach(button => {
  button.addEventListener('touchstart', () => {
    button.style.transform = 'scale(0.95)';
  });
  
  button.addEventListener('touchend', () => {
    button.style.transform = '';
  });
});