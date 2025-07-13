document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const message = document.getElementById('message');
  const btns = {
    up: document.getElementById('up'),
    down: document.getElementById('down'),
    left: document.getElementById('left'),
    right: document.getElementById('right'),
  };

  // Responsive canvas
  function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    canvas.width = Math.floor(size / grid) * grid;
    canvas.height = Math.floor(size / grid) * grid;
  }

  const grid = 20;
  let count = 0;
  let running = false;
  let animationId;
  let snake, apple;

  function initGame() {
    resizeCanvas(); // Reset canvas each time
    snake = {
      x: 160,
      y: 160,
      dx: grid,
      dy: 0,
      cells: [],
      maxCells: 4
    };
    apple = {
      x: getRandomCell(canvas.width),
      y: getRandomCell(canvas.height)
    };
    count = 0;
    message.textContent = '';
    message.style.display = 'none';
  }

  function getRandomCell(limit) {
    return Math.floor(limit / grid) * grid * Math.random() / grid | 0 * grid;
  }

  function placeApple() {
    apple.x = getRandomCell(canvas.width);
    apple.y = getRandomCell(canvas.height);
  }

  function loop() {
    animationId = requestAnimationFrame(loop);
    if (!running) return;

    if (++count < 15) return; // slower snake
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
    ctx.fillStyle = 'red';
    ctx.fillRect(apple.x, apple.y, grid - 1, grid - 1);

    // Draw snake
    ctx.fillStyle = 'green';
    snake.cells.forEach((cell, index) => {
      ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

      // Eat apple
      if (cell.x === apple.x && cell.y === apple.y) {
        snake.maxCells++;
        placeApple();
      }

      // Collision
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

    const { dx, dy } = snake;
    if (dir === 'left' && dx === 0) {
      snake.dx = -grid; snake.dy = 0;
    } else if (dir === 'right' && dx === 0) {
      snake.dx = grid; snake.dy = 0;
    } else if (dir === 'up' && dy === 0) {
      snake.dy = -grid; snake.dx = 0;
    } else if (dir === 'down' && dy === 0) {
      snake.dy = grid; snake.dx = 0;
    }
  }

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') changeDirection('left');
    if (e.key === 'ArrowUp') changeDirection('up');
    if (e.key === 'ArrowRight') changeDirection('right');
    if (e.key === 'ArrowDown') changeDirection('down');
  });

  // Touch gestures
  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  });

  canvas.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) changeDirection('right');
      else if (dx < -30) changeDirection('left');
    } else {
      if (dy > 30) changeDirection('down');
      else if (dy < -30) changeDirection('up');
    }
  });

  // On-screen buttons
  btns.left.onclick = () => changeDirection('left');
  btns.right.onclick = () => changeDirection('right');
  btns.up.onclick = () => changeDirection('up');
  btns.down.onclick = () => changeDirection('down');

  // Start game
  startBtn.addEventListener('click', () => {
    initGame();
    running = true;
    startBtn.textContent = '▶ Running...';
    loop();
  });
});
