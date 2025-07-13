const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let tileSize = 20;
let cols = 20;
let rows = 35;

canvas.width = tileSize * cols;
canvas.height = tileSize * rows;

let snake, direction, apple, bigApple, score, gameOver, frameCount;
let bigAppleTimer = 0;
const BIG_APPLE_LIFETIME = 300;
const BIG_APPLE_INITIAL_SCORE = 200;

function restartGame() {
  snake = [{ x: 10, y: 17 }];
  direction = { x: 1, y: 0 };
  apple = spawnApple();
  bigApple = null;
  score = 0;
  gameOver = false;
  frameCount = 0;
  bigAppleTimer = 0;
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("restartBtn").style.display = "none";
  requestAnimationFrame(gameLoop);
}

function spawnApple() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
  } while (snake.some(segment => segment.x === pos.x && segment.y === pos.y));
  return pos;
}

function drawRect(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

function drawSnake() {
  snake.forEach((segment, index) => {
    drawRect(segment.x, segment.y, index === 0 ? "green" : "#004d00");
  });

  // Add eyes and tongue on head
  const head = snake[0];
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(head.x * tileSize + 5, head.y * tileSize + 5, 2, 0, 2 * Math.PI);
  ctx.arc(head.x * tileSize + 15, head.y * tileSize + 5, 2, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = "red";
  if (direction.x !== 0) {
    ctx.fillRect(
      head.x * tileSize + (direction.x === 1 ? tileSize : -4),
      head.y * tileSize + 8,
      4,
      4
    );
  } else {
    ctx.fillRect(
      head.x * tileSize + 8,
      head.y * tileSize + (direction.y === 1 ? tileSize : -4),
      4,
      4
    );
  }
}

function gameLoop() {
  if (gameOver) return;

  frameCount++;
  if (frameCount % 12 !== 0) {
    requestAnimationFrame(gameLoop);
    return;
  }

  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  // wall or self collision
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= cols ||
    head.y >= rows ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    gameOver = true;
    document.getElementById("restartBtn").style.display = "block";
    return;
  }

  snake.unshift(head);

  let ateApple = head.x === apple.x && head.y === apple.y;
  let ateBigApple = bigApple && head.x === bigApple.x && head.y === bigApple.y;

  if (ateApple) {
    score += 5;
    apple = spawnApple();
    bigAppleTimer++;
    if (bigAppleTimer === 5) {
      bigApple = { ...spawnApple(), life: BIG_APPLE_LIFETIME };
      bigAppleTimer = 0;
    }
  } else if (ateBigApple) {
    let bonus = Math.max(1, Math.floor((bigApple.life / BIG_APPLE_LIFETIME) * BIG_APPLE_INITIAL_SCORE));
    score += bonus;
    bigApple = null;
  } else {
    snake.pop();
  }

  if (bigApple) {
    bigApple.life--;
    if (bigApple.life <= 0) {
      bigApple = null;
    }
  }

  document.getElementById("score").textContent = `Score: ${score}`;

  // Draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRect(apple.x, apple.y, "red");
  if (bigApple) drawRect(bigApple.x, bigApple.y, "orange");
  drawSnake();

  requestAnimationFrame(gameLoop);
}

// Control
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp" && direction.y === 0) direction = { x: 0, y: -1 };
  if (e.key === "ArrowDown" && direction.y === 0) direction = { x: 0, y: 1 };
  if (e.key === "ArrowLeft" && direction.x === 0) direction = { x: -1, y: 0 };
  if (e.key === "ArrowRight" && direction.x === 0) direction = { x: 1, y: 0 };
});

// Swipe support
let touchStartX = null;
let touchStartY = null;
canvas.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
canvas.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && direction.x === 0) direction = { x: 1, y: 0 };
    else if (dx < 0 && direction.x === 0) direction = { x: -1, y: 0 };
  } else {
    if (dy > 0 && direction.y === 0) direction = { x: 0, y: 1 };
    else if (dy < 0 && direction.y === 0) direction = { x: 0, y: -1 };
  }
});

restartGame();
