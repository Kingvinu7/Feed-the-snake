document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const message = document.getElementById('message');

  const grid = 20;
  let count = 0;
  let running = false;
  let animationId;
  let snake, apple, score = 0;

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
    apple.scale = 1;
    apple.bounce = 1;
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

    apple = { x: 0, y: 0, scale: 1, bounce: 1 };
    placeApple();

    score = 0;
    scoreEl.textContent = score;
    message.textContent = '';
    message.style.display = 'none';
    running = true;
    loop();
  }

  function loop() {
    animationId = requestAnimationFrame(loop);
    if (!running) return;

    if (++count < 10) return;
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

    // draw apple w/ bounce
    apple.scale = 1 + Math.sin(Date.now() / 200) * 0.1;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(
      apple.x + grid / 2,
      apple.y + grid / 2,
      (grid / 2 - 2) * apple.scale,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // draw snake
    snake.cells.forEach((cell, index) => {
      const alpha = 1 - index / snake.cells.length;
      ctx.fillStyle = `rgba(0, 128, 0, ${alpha})`;
      ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

      // eat apple
      if (cell.x === apple.x && cell.y === apple.y) {
        snake.maxCells++;
        placeApple();
        score++;
        scoreEl.textContent = score;
      }

      // self-collision
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

  // Controls - keyboard
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

  // Swipe controls
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

  // Start game
  initGame();
});
