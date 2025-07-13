const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');
const gameOverEl = document.getElementById('gameOver');

let tileSize = 20;
let cols, rows;

function resizeCanvas() {
  const maxWidth = window.innerWidth * 0.9;
  const maxHeight = window.innerHeight * 0.6;
  const aspectRatio = 3 / 4;

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  canvas.width = width;
  canvas.height = height;

  tileSize = Math.floor(width / 30);
  cols = Math.floor(width / tileSize);
  rows = Math.floor(height / tileSize);
}

resizeCanvas();
window.addEventListener("resize", () => location.reload());

let snake, direction, apple, bigApple, score, gameInterval, bigAppleTimer;
let gameStarted = false;

function resetGame() {
  snake = [{ x: 5, y: 5 }];
  direction = { x: 1, y: 0 };
  apple = randomPosition();
  bigApple = null;
  score = 0;
  gameStarted = true;
  updateScore();
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 180); // Slightly faster
  restartBtn.style.display = "none";
  gameOverEl.style.display = "none";
}

function randomPosition() {
  return {
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows)
  };
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
}

function gameLoop() {
  if (!gameStarted) return;
  
  const head = { ...snake[0] };
  head.x += direction.x;
  head.y += direction.y;

  // Wrap around borders instead of dying
  if (head.x < 0) head.x = cols - 1;
  if (head.x >= cols) head.x = 0;
  if (head.y < 0) head.y = rows - 1;
  if (head.y >= rows) head.y = 0;

  // Only die when hitting itself
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    clearInterval(gameInterval);
    gameStarted = false;
    gameOverEl.style.display = "block";
    setTimeout(() => {
      restartBtn.style.display = "block";
    }, 1000);
    return;
  }

  snake.unshift(head);

  if (head.x === apple.x && head.y === apple.y) {
    score += 5;
    apple = randomPosition();
    if (score >= 25 && !bigApple) {
      spawnBigApple();
    }
  } else if (bigApple && head.x === bigApple.x && head.y === bigApple.y) {
    score += Math.max(5, bigApple.value);
    bigApple = null;
    clearTimeout(bigAppleTimer);
  } else {
    snake.pop();
  }

  updateScore();
  drawGame();
}

function spawnBigApple() {
  bigApple = randomPosition();
  bigApple.value = 200;
  const decayRate = 5;

  bigAppleTimer = setInterval(() => {
    bigApple.value -= decayRate;
    if (bigApple.value <= 0) {
      clearInterval(bigAppleTimer);
      bigApple = null;
    }
  }, 500);
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw apple with neon glow
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(
    apple.x * tileSize + tileSize / 2,
    apple.y * tileSize + tileSize / 2,
    tileSize / 2.5,
    0, Math.PI * 2
  );
  ctx.fill();

  // Draw apple highlight
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffaaaa';
  ctx.beginPath();
  ctx.arc(
    apple.x * tileSize + tileSize / 2 - 3,
    apple.y * tileSize + tileSize / 2 - 3,
    tileSize / 6,
    0, Math.PI * 2
  );
  ctx.fill();

  // Draw big apple with orange glow
  if (bigApple) {
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.arc(
      bigApple.x * tileSize + tileSize / 2,
      bigApple.y * tileSize + tileSize / 2,
      tileSize / 1.8,
      0, Math.PI * 2
    );
    ctx.fill();

    // Draw big apple highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath();
    ctx.arc(
      bigApple.x * tileSize + tileSize / 2 - 4,
      bigApple.y * tileSize + tileSize / 2 - 4,
      tileSize / 4,
      0, Math.PI * 2
    );
    ctx.fill();
  }

  // Draw snake with neon glow
  snake.forEach((segment, i) => {
    const alpha = 1 - (i / snake.length) * 0.7;
    const headAlpha = i === 0 ? 1 : alpha;
    
    // Main body with glow
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fillStyle = i === 0 ? '#00ff88' : `rgba(0, 255, 136, ${alpha})`;
    ctx.fillRect(
      segment.x * tileSize + 1, 
      segment.y * tileSize + 1, 
      tileSize - 2, 
      tileSize - 2
    );

    // Inner highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = i === 0 ? '#44ffaa' : `rgba(68, 255, 170, ${alpha * 0.8})`;
    ctx.fillRect(
      segment.x * tileSize + 3, 
      segment.y * tileSize + 3, 
      tileSize - 6, 
      tileSize - 6
    );

    if (i === 0) {
      // Eyes with glow
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(segment.x * tileSize + tileSize * 0.3, segment.y * tileSize + tileSize * 0.3, 3, 0, 2 * Math.PI);
      ctx.arc(segment.x * tileSize + tileSize * 0.7, segment.y * tileSize + tileSize * 0.3, 3, 0, 2 * Math.PI);
      ctx.fill();

      // Eye pupils
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(segment.x * tileSize + tileSize * 0.3, segment.y * tileSize + tileSize * 0.3, 1.5, 0, 2 * Math.PI);
      ctx.arc(segment.x * tileSize + tileSize * 0.7, segment.y * tileSize + tileSize * 0.3, 1.5, 0, 2 * Math.PI);
      ctx.fill();

      // Glowing tongue
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const tx = segment.x * tileSize + tileSize / 2 + direction.x * tileSize / 2;
      const ty = segment.y * tileSize + tileSize / 2 + direction.y * tileSize / 2;
      ctx.moveTo(segment.x * tileSize + tileSize / 2, segment.y * tileSize + tileSize / 2);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  });

  // Reset shadow
  ctx.shadowBlur = 0;
}

// Keyboard controls
document.addEventListener('keydown', e => {
  if (!gameStarted) return;
  if (e.key === 'ArrowUp' && direction.y !== 1) direction = { x: 0, y: -1 };
  if (e.key === 'ArrowDown' && direction.y !== -1) direction = { x: 0, y: 1 };
  if (e.key === 'ArrowLeft' && direction.x !== 1) direction = { x: -1, y: 0 };
  if (e.key === 'ArrowRight' && direction.x !== -1) direction = { x: 1, y: 0 };
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (!gameStarted) return;
  
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  const minSwipeDistance = 30;
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && direction.x !== -1) {
        direction = { x: 1, y: 0 }; // Right
      } else if (deltaX < 0 && direction.x !== 1) {
        direction = { x: -1, y: 0 }; // Left
      }
    }
  } else {
    // Vertical swipe
    if (Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0 && direction.y !== -1) {
        direction = { x: 0, y: 1 }; // Down
      } else if (deltaY < 0 && direction.y !== 1) {
        direction = { x: 0, y: -1 }; // Up
      }
    }
  }
});

// Prevent scrolling on touch
document.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

restartBtn.addEventListener('click', resetGame);

// Start the game
resetGame();
drawGame();
