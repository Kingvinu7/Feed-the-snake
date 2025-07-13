document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const message = document.getElementById('message');

  const grid = 20;
  let count = 0;
  let running = false;
  let animationId;
  let snake, apple;

  function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    canvas.width = Math.floor(size / grid) * grid;
    canvas.height = Math.floor(size / grid) * grid;
  }

  function getRandomCell(limit) {
    return Math.floor(Math.random() * (limit / grid)) * grid;
  }

  function placeApple() {
    apple.x = getRandomCell(canvas.width);
    apple.y = getRandomCell(canvas.height);
  }

  function initGame() {
    resizeCanvas();

    snake = {
      x: grid * 5,
      y: grid * 5,
      dx: grid,
      dy: 0,
      cells: [],
      maxCells: 4
    };

    apple = { x: 0, y: 0 };
    placeApple();

    count = 0;
    message.textContent = '';
    message.style.display = 'none';
    running = true;
    loop();
  }

  function loop() {
    animationId = requestAnimationFrame(loop);
    if (!running) return;

    if (++count < 15) return; // slower speed
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

    // draw apple
    ctx.fillStyle = 'red';
    ctx.fillRect(apple.x, apple.y, grid - 1, grid - 1);

    // draw snake
    ctx.fillStyle = 'green';
    snake.cells.forEach((cell, index) => {
      ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

      // eat apple
      if (cell.x === apple.x && cell.y === apple.y) {
        snake.maxCells++;
        placeApple();
      }

      // collision
      for (let i = index + 1; i < snake.cells.length; i++) {
        if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
          running = false;
          cancelAnimationFrame(animationId);
          message.textContent = '💀 Game Over';
          message.style.display = 'block';
        }
      }
    });
  }

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && snake.dx === 0) {
      snake.dx = -grid; snake.dy = 0;
    } else if (e.key === 'ArrowUp' && snake.dy === 0) {
      snake.dy = -grid; snake.dx = 0;
    } else if (e.key === 'ArrowRight' && snake.dx === 0) {
      snake.dx = grid; snake.dy = 0;
    } else if (e.key === 'ArrowDown' && snake.dy === 0) {
      snake.dy = grid; snake.dx = 0;
    } else if (e.key === ' ' && !running) {
      initGame();
    }
  });

  // Touch gestures
  let startX = 0, startY = 0;

  canvas.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
  });

  canvas.addEventListener('touchend', e => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30 && snake.dx === 0) {
        snake.dx = grid; snake.dy = 0;
      } else if (dx < -30 && snake.dx === 0) {
        snake.dx = -grid; snake.dy = 0;
      }
    } else {
      if (dy > 30 && snake.dy === 0) {
        snake.dy = grid; snake.dx = 0;
      } else if (dy < -30 && snake.dy === 0) {
        snake.dy = -grid; snake.dx = 0;
      }
    }
  });

  // Auto-start
  initGame();
});
