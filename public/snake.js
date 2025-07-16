// Farcaster Frame SDK integration
let sdk = null;
let isInFrame = false;

// Initialize Farcaster Frame SDK
async function initializeFarcaster() {
  try {
    // Check if Frame SDK is available
    if (typeof window.FrameSDK !== 'undefined') {
      sdk = window.FrameSDK;
      isInFrame = true;
      
      console.log('Farcaster Frame SDK initialized');
      
      // Get context if available
      if (sdk.context) {
        try {
          const context = await sdk.context;
          console.log('Farcaster frame context:', context);
        } catch (contextError) {
          console.warn('Could not get frame context:', contextError);
        }
      }
    } else {
      console.log('Not running inside a Farcaster frame');
    }
  } catch (err) {
    console.error('Error initializing Farcaster Frame SDK:', err);
  }
}

// Hide loading screen function
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
  }
}

// Game variables
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

// Game constants
const gridSize = 20;
let tileCount = Math.floor(canvas.width / gridSize);

// Game state
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let bigApple = null;
let bigAppleCountdown = 0;
let bigAppleMaxScore = 200;
let dx = 0;
let dy = 0;
let score = 0;
let applesEaten = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let gameRunning = false;
let gameStarted = false;
let touchStartX = 0;
let touchStartY = 0;
let lastMoveTime = 0;
let gameSpeed = 250;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

// Game boundaries (with walls on left and right)
const WALL_LEFT = 1;
const WALL_RIGHT = tileCount - 2;
const WALL_TOP = 0;
const WALL_BOTTOM = tileCount - 1;

// Update best score display
bestScoreEl.textContent = `Best: ${bestScore}`;

// Enhanced food generation (inside walls)
function generateFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * (WALL_RIGHT - WALL_LEFT + 1)) + WALL_LEFT,
      y: Math.floor(Math.random() * (WALL_BOTTOM - WALL_TOP + 1)) + WALL_TOP
    };
  } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
           (bigApple && bigApple.x === newFood.x && bigApple.y === newFood.y));
  return newFood;
}

// Generate big apple
function generateBigApple() {
  let newBigApple;
  do {
    newBigApple = {
      x: Math.floor(Math.random() * (WALL_RIGHT - WALL_LEFT + 1)) + WALL_LEFT,
      y: Math.floor(Math.random() * (WALL_BOTTOM - WALL_TOP + 1)) + WALL_TOP
    };
  } while (snake.some(segment => segment.x === newBigApple.x && segment.y === newBigApple.y) ||
           (food.x === newBigApple.x && food.y === newBigApple.y));
  return newBigApple;
}

// Enhanced drawing with better visuals
function drawGame() {
  // Clear canvas with gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#000');
  gradient.addColorStop(1, '#111');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw walls
  ctx.fillStyle = '#444';
  ctx.shadowColor = '#666';
  ctx.shadowBlur = 5;
  
  // Left wall
  for (let y = 0; y < tileCount; y++) {
    ctx.fillRect(0, y * gridSize, gridSize, gridSize);
  }
  
  // Right wall
  for (let y = 0; y < tileCount; y++) {
    ctx.fillRect((tileCount - 1) * gridSize, y * gridSize, gridSize, gridSize);
  }
  
  ctx.shadowBlur = 0;

  // Draw grid lines (only in playable area)
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  for (let i = WALL_LEFT; i <= WALL_RIGHT + 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, canvas.height);
    ctx.stroke();
  }
  for (let i = WALL_TOP; i <= WALL_BOTTOM + 1; i++) {
    ctx.beginPath();
    ctx.moveTo(WALL_LEFT * gridSize, i * gridSize);
    ctx.lineTo((WALL_RIGHT + 1) * gridSize, i * gridSize);
    ctx.stroke();
  }

  // Draw snake with gradient and glow effect
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    const x = segment.x * gridSize;
    const y = segment.y * gridSize;
    
    // Glow effect
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = isHead ? 15 : 8;
    
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

  // Draw regular food
  const foodX = food.x * gridSize;
  const foodY = food.y * gridSize;
  
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur = 10;
  
  const foodGradient = ctx.createRadialGradient(
    foodX + gridSize/2, foodY + gridSize/2, 0,
    foodX + gridSize/2, foodY + gridSize/2, gridSize/2
  );
  foodGradient.addColorStop(0, '#ff6666');
  foodGradient.addColorStop(1, '#ff4444');
  
  ctx.fillStyle = foodGradient;
  ctx.fillRect(foodX + 2, foodY + 2, gridSize - 4, gridSize - 4);

  // Draw big apple with countdown
  if (bigApple) {
    const bigAppleX = bigApple.x * gridSize;
    const bigAppleY = bigApple.y * gridSize;
    
    // Pulsing effect
    const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.1;
    const size = gridSize * pulseScale;
    const offset = (gridSize - size) / 2;
    
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    
    const bigAppleGradient = ctx.createRadialGradient(
      bigAppleX + gridSize/2, bigAppleY + gridSize/2, 0,
      bigAppleX + gridSize/2, bigAppleY + gridSize/2, size/2
    );
    bigAppleGradient.addColorStop(0, '#ffd700');
    bigAppleGradient.addColorStop(0.7, '#ffaa00');
    bigAppleGradient.addColorStop(1, '#ff8800');
    
    ctx.fillStyle = bigAppleGradient;
    ctx.fillRect(bigAppleX + offset, bigAppleY + offset, size, size);
    
    // Draw countdown and score
    const currentScore = Math.max(10, bigAppleMaxScore - Math.floor((Date.now() - bigApple.spawnTime) / 100));
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(currentScore.toString(), bigAppleX + gridSize/2, bigAppleY + gridSize/2 + 3);
    
    // Countdown bar
    const timeLeft = Math.max(0, bigAppleCountdown - (Date.now() - bigApple.spawnTime));
    const barWidth = gridSize - 4;
    const barHeight = 2;
    const barX = bigAppleX + 2;
    const barY = bigAppleY - 6;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const progress = timeLeft / bigAppleCountdown;
    ctx.fillStyle = progress > 0.5 ? '#00ff00' : progress > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
  }
  
  // Reset shadow
  ctx.shadowBlur = 0;
}

// Enhanced game logic
function updateGame() {
  if (!gameRunning) return;

  const now = Date.now();
  if (now - lastMoveTime < gameSpeed) return;
  lastMoveTime = now;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Check wall collisions
  if (head.x <= 0 || head.x >= tileCount - 1 || head.y < 0 || head.y >= tileCount) {
    gameOver();
    return;
  }

  // Check collision with body
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Check if regular food is eaten
  if (head.x === food.x && head.y === food.y) {
    score += 5;
    applesEaten++;
    scoreEl.textContent = `Score: ${score}`;
    food = generateFood();
    
    // Check if big apple should spawn
    if (applesEaten % 5 === 0 && !bigApple) {
      bigApple = generateBigApple();
      bigApple.spawnTime = now;
      bigAppleCountdown = 10000; // 10 seconds
    }
    
    // Visual feedback
    createParticleEffect(head.x * gridSize, head.y * gridSize, '#ff4444');
  }
  // Check if big apple is eaten
  else if (bigApple && head.x === bigApple.x && head.y === bigApple.y) {
    const timeElapsed = now - bigApple.spawnTime;
    const bigAppleScore = Math.max(10, bigAppleMaxScore - Math.floor(timeElapsed / 100));
    score += bigAppleScore;
    scoreEl.textContent = `Score: ${score}`;
    
    // Visual feedback
    createParticleEffect(head.x * gridSize, head.y * gridSize, '#ffd700');
    
    bigApple = null;
  }
  // Check if big apple expired
  else if (bigApple && now - bigApple.spawnTime > bigAppleCountdown) {
    bigApple = null;
  }
  else {
    snake.pop();
  }

  drawGame();
}

// Enhanced particle effect
function createParticleEffect(x, y, color) {
  const particles = [];
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x + gridSize/2,
      y: y + gridSize/2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 15,
      color: color
    });
  }
  
  const animateParticles = () => {
    ctx.save();
    particles.forEach((particle, index) => {
      if (particle.life <= 0) {
        particles.splice(index, 1);
        return;
      }
      
      ctx.globalAlpha = particle.life / 15;
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      particle.life--;
    });
    ctx.restore();
    
    if (particles.length > 0) {
      requestAnimationFrame(animateParticles);
    }
  };
  
  animateParticles();
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
  bigApple = null;
  dx = 0;
  dy = 0;
  score = 0;
  applesEaten = 0;
  gameSpeed = 250;
  scoreEl.textContent = `Score: ${score}`;
  gameOverScreen.style.display = 'none';
  gameRunning = false;
  gameStarted = false;
  drawGame();
}

// Enhanced controls
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
  const rect = canvas.getBoundingClientRect();
  touchStartX = touch.clientX - rect.left;
  touchStartY = touch.clientY - rect.top;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  
  if (!touchStartX || !touchStartY) return;
  
  const touch = e.changedTouches[0];
  const rect = canvas.getBoundingClientRect();
  const touchEndX = touch.clientX - rect.left;
  const touchEndY = touch.clientY - rect.top;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  const minSwipeDistance = 20;
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        changeDirection(1, 0);
      } else {
        changeDirection(-1, 0);
      }
    }
  } else {
    if (Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        changeDirection(0, 1);
      } else {
        changeDirection(0, -1);
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

// Enhanced share functionality with Farcaster composeCast
async function shareScore() {
  const shareText = `🐍 Just scored ${score} points in Feed The Snake! Can you beat my high score? 🎮`;
  const shareUrl = window.location.href;
  
  // Try Farcaster composeCast first if in frame
  if (isInFrame && sdk) {
    try {
      await sdk.actions.composeCast({
        text: shareText,
        embeds: [shareUrl]
      });
      return;
    } catch (error) {
      console.error('Farcaster composeCast failed:', error);
    }
  }
  
  // Fallback to native sharing
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Feed The Snake - High Score!',
        text: shareText,
        url: shareUrl
      });
    } catch (error) {
      console.error('Native share failed:', error);
      fallbackShare(shareText, shareUrl);
    }
  } else {
    fallbackShare(shareText, shareUrl);
  }
}

// Fallback share function
function fallbackShare(shareText, shareUrl) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
      shareBtn.textContent = '✅ Copied!';
      setTimeout(() => {
        shareBtn.textContent = '📤 Share';
      }, 2000);
    }).catch(() => {
      prompt('Copy this text to share your score:', `${shareText} ${shareUrl}`);
    });
  } else {
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

// Optimized game loop
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

// Canvas resize handler
function resizeCanvas() {
  const container = document.getElementById('gameContainer');
  const maxSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.6, 400);
  const size = Math.max(250, maxSize);
  
  canvas.width = size;
  canvas.height = size;
  
  // Recalculate grid
  tileCount = Math.floor(canvas.width / gridSize);
  
  // Adjust snake and food positions if needed
  snake.forEach(segment => {
    segment.x = Math.min(segment.x, tileCount - 2);
    segment.y = Math.min(segment.y, tileCount - 1);
  });
  
  food.x = Math.min(food.x, tileCount - 2);
  food.y = Math.min(food.y, tileCount - 1);
  
  if (bigApple) {
    bigApple.x = Math.min(bigApple.x, tileCount - 2);
    bigApple.y = Math.min(bigApple.y, tileCount - 1);
  }
  
  drawGame();
}

// Initialize game
async function initGame() {
  try {
    // Initialize Farcaster SDK first
    await initializeFarcaster();
    
    // Set up canvas
    resizeCanvas();
    
    // Initialize game state
    food = generateFood();
    drawGame();
    
    // Start game loop
    gameLoop();
    
    // Hide loading screen after everything is ready
    setTimeout(hideLoadingScreen, 500);
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
    hideLoadingScreen();
  }
}

// Event listeners
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
  setTimeout(resizeCanvas, 100);
});

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

// Initialize everything when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
