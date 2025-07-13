const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

let tileSize = 20;
let cols, rows;

// Touch/swipe variables
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const minSwipeDistance = 50;

function resizeCanvas() {
  const maxWidth = window.innerWidth * 0.9;
  const maxHeight = window.innerHeight * 0.75;
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
window.addEventListener("resize", () => {
  resizeCanvas();
  if (snake && snake.length > 0) {
    // Don't reload, just resize
    drawGame();
  }
});

let snake, direction, apple, bigApple, score, gameInterval, bigAppleTimer;

function resetGame() {
  snake = [{ x: 5, y: 5 }];
  direction = { x: 1, y: 0 };
  apple = randomPosition();
  bigApple = null;
  score = 0;
  updateScore();
  clearInterval(gameInterval);
  clearTimeout(bigAppleTimer);
  gameInterval = setInterval(gameLoop, 200); // Slow speed
  restartBtn.style.display = "none";
}

function randomPosition() {
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows)
    };
  } while (snake && snake.some(segment => segment.x === position.x && segment.y === position.y));
  return position;
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
}

function gameLoop() {
  const head = { ...snake[0] };
  head.x += direction.x;
  head.y += direction.y;

  if (
    head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    clearInterval(gameInterval);
    clearTimeout(bigAppleTimer);
    restartBtn.style.display = "block";
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

  // Draw apple
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(
    apple.x * tileSize + tileSize / 2,
    apple.y * tileSize + tileSize / 2,
    tileSize / 2.5,
    0, Math.PI * 2
  );
  ctx.fill();

  // Draw big apple
  if (bigApple) {
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.arc(
      bigApple.x * tileSize + tileSize / 2,
      bigApple.y * tileSize + tileSize / 2,
      tileSize / 1.8,
      0, Math.PI * 2
    );
    ctx.fill();
    
    // Draw big apple value
    ctx.fillStyle = 'white';
    ctx.font = `${tileSize / 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(
      bigApple.value.toString(),
      bigApple.x * tileSize + tileSize / 2,
      bigApple.y * tileSize + tileSize / 2 + tileSize / 6
    );
  }

  // Draw snake
  snake.forEach((segment, i) => {
    ctx.fillStyle = i === 0 ? '#006400' : `rgba(0, 100, 0, ${1 - i / snake.length})`;
    ctx.fillRect(segment.x * tileSize, segment.y * tileSize, tileSize, tileSize);

    if (i === 0) {
      // Eyes
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(segment.x * tileSize + tileSize * 0.3, segment.y * tileSize + tileSize * 0.3, 2, 0, 2 * Math.PI);
      ctx.arc(segment.x * tileSize + tileSize * 0.7, segment.y * tileSize + tileSize * 0.3, 2, 0, 2 * Math.PI);
      ctx.fill();

      // Tongue
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const tx = segment.x * tileSize + tileSize / 2 + direction.x * tileSize / 2;
      const ty = segment.y * tileSize + tileSize / 2 + direction.y * tileSize / 2;
      ctx.moveTo(segment.x * tileSize + tileSize / 2, segment.y * tileSize + tileSize / 2);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  });
}

// Keyboard controls
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' && direction.y !== 1) direction = { x: 0, y: -1 };
  if (e.key === 'ArrowDown' && direction.y !== -1) direction = { x: 0, y: 1 };
  if (e.key === 'ArrowLeft' && direction.x !== 1) direction = { x: -1, y: 0 };
  if (e.key === 'ArrowRight' && direction.x !== -1) direction = { x: 1, y: 0 };
});

// Touch/swipe controls
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  touchEndX = e.changedTouches[0].clientX;
  touchEndY = e.changedTouches[0].clientY;
  handleSwipe();
}, { passive: false });

function handleSwipe() {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);

  // Check if swipe is long enough
  if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) {
    return;
  }

  // Determine swipe direction
  if (absDeltaX > absDeltaY) {
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

restartBtn.addEventListener('click', resetGame);

// Prevent context menu on long press
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
});

resetGame();
