const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const message = document.getElementById('message');
const btns = {
  up: document.getElementById('up'),
  down: document.getElementById('down'),
  left: document.getElementById('left'),
  right: document.getElementById('right')
};

// Responsive canvas setup
function resizeCanvas() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
  canvas.width = size;
  canvas.height = size;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game variables
const grid = 20;
let count = 0;
let running = false;
let animationId;

let snake, apple;

function initGame() {
  snake = {
    x: 160,
    y: 160,
    dx: grid,
    dy: 0,
    cells: [],
    maxCells: 4
  };
  apple = {
    x: 320,
    y: 320
  };
  count = 0;
  message.textContent = '';
  message.style.display = 'none';
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function drawApple() {
  ctx.fillStyle = 'red';
  ctx.fillRect(apple.x, apple.y, grid - 1, grid - 1);
}

function loop() {
  animationId = requestAnimationFrame(loop);
  if (!running) return;

  if (++count < 10) return; // Slowed snake
  count = 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  snake.x += snake.dx;
  snake.y += snake.dy;

  // wrap screen
  if (snake.x < 0) snake.x = canvas.width - grid;
  else if (snake.x >= canvas.width) snake.x = 0;

  if (snake.y < 0) snake.y = canvas.height - grid;
  else if (snake.y >= canvas.height) snake.y = 0;

  snake.cells.unshift({ x: snake.x, y: snake.y });
  if (snake.cells.length > snake.maxCells) {
    snake.cells.pop();
  }

  // Draw apple
  drawApple();

  // Draw snake
  ctx.fillStyle = 'green';
  snake.cells.forEach((cell, index) => {
    ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

    // Eat apple
    if (cell.x === apple.x && cell.y === apple.y) {
      snake.maxCells++;
      apple.x = getRandomInt(0, canvas.width / grid) * grid;
      apple.y = getRandomInt(0, canvas.height / grid) * grid;
    }

    // Self collision
    for (let i = index + 1; i < snake.cells.length; i++) {
      if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
        running = false;
        cancelAnimationFrame(animationId);
        message.textContent = '💀 Game Over';
        message.style.display = 'block';
        startBtn.textContent = '🔁 Restart';
        return;
      }
    }
  });
}

function changeDirection(dir) {
  if (!running) return;

  if (dir === 'left' && snake.dx === 0) {
    snake.dx = -grid;
    snake.dy = 0;
  } else if (dir === 'up' && snake.dy === 0) {
    snake.dy = -grid;
    snake.dx = 0;
  } else if (dir === 'right' && snake.dx === 0) {
    snake.dx = grid;
    snake.dy = 0;
  } else if (dir === 'down' && snake.dy === 0) {
    snake.dy = grid;
    snake.dx = 0;
  }
}

// Start game
startBtn.addEventListener('click', () => {
  initGame();
  running = true;
  startBtn.textContent = '▶ Running...';
  loop();
});

// Keyboard controls
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') changeDirection('left');
  if (e.key === 'ArrowUp') changeDirection('up');
  if (e.key === 'ArrowRight') changeDirection('right');
  if (e.key === 'ArrowDown') changeDirection('down');
});

// On-screen button controls
btns.left.onclick = () => changeDirection('left');
btns.right.onclick = () => changeDirection('right');
btns.up.onclick = () => changeDirection('up');
btns.down.onclick = () => changeDirection('down');
