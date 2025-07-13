document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const message = document.getElementById('message');
  const restartBtn = document.getElementById('restart');

  const grid = 20;
  let count = 0;
  let frameSpeed = 15; // slower snake
  let running = false;
  let animationId;
  let snake, apple, bigApple, score = 0;
  let bigAppleTimeout = null;
  let bigAppleSpawnTime = 0;
  const BIG_APPLE_LIFETIME = 7000; // ms
  const BIG_APPLE_MAX_SCORE = 5;

  function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    canvas.width = Math.floor(size / grid) * grid;
    canvas.height = Math.floor(size / grid) * grid;
  }

  function getRandomCell(limit) {
    return Math.floor(Math.random() * (limit / grid)) * grid;
  }

  function placeApple(type = 'normal') {
    return {
      x: getRandomCell(canvas.width),
      y: getRandomCell(canvas.height),
      scale: 1,
      type,
      size: type === 'big' ? grid * 1.5 : grid
    };
  }

  function initGame() {
    resizeCanvas();
    snake = {
      x: grid * 5,
      y: grid * 5,
      dx: grid,
      dy: 0,
      cells: [],
      maxCells: 4,
      direction: 'right'
    };

    apple = placeApple();
    bigApple = null;
    clearTimeout(bigAppleTimeout);
    bigAppleTimeout = null;
    score = 0;
    scoreEl.textContent = score;
    message.style.display = 'none';
    restartBtn.style.display = 'none';
    running = true;
    loop();
  }

  function loop() {
    animationId = requestAnimationFrame(loop);
    if (!running) return;

    if (++count < frameSpeed) return;
    count = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0) snake.x = canvas.width - grid;
    else if (snake.x >= canvas.width) snake.x = 0;
    if (snake.y < 0) snake.y = canvas.height - grid;
    else if (snake.y >= canvas.height) snake.y = 0;

    snake.cells.unshift({ x: snake.x, y: snake.y });
    if (snake.cells.length > snake.maxCells) {
      snake.cells.pop();
    }

    if (apple) {
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
    }

    if (bigApple) {
      bigApple.scale = 1 + Math.sin(Date.now() / 150) * 0.15;
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(
        bigApple.x + grid / 2,
        bigApple.y + grid / 2,
        (grid * 0.75) * bigApple.scale,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    snake.cells.forEach((cell, index) => {
      if (index === 0) {
        ctx.fillStyle = '#004d00';
        ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

        const [eye1, eye2, tongue] = getHeadDetails(cell, snake.direction);
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(...eye1, 2, 0, Math.PI * 2);
        ctx.arc(...eye2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(...eye1, 1, 0, Math.PI * 2);
        ctx.arc(...eye2, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(...tongue.start);
        ctx.lineTo(...tongue.end);
        ctx.stroke();
      } else {
        const alpha = 1 - index / snake.cells.length;
        ctx.fillStyle = `rgba(0, 128, 0, ${alpha})`;
        ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);
      }

      if (apple && cell.x === apple.x && cell.y === apple.y) {
        snake.maxCells++;
        score++;
        scoreEl.textContent = score;
        apple = placeApple();
        if (score % 5 === 0 && !bigApple) {
          bigApple = placeApple('big');
          bigAppleSpawnTime = Date.now();
          bigAppleTimeout = setTimeout(() => {
            bigApple = null;
          }, BIG_APPLE_LIFETIME);
        }
      }

      if (bigApple && cell.x === bigApple.x && cell.y === bigApple.y) {
        const timeAlive = Date.now() - bigAppleSpawnTime;
        const decay = timeAlive / BIG_APPLE_LIFETIME;
        const gainedScore = Math.max(1, Math.floor(BIG_APPLE_MAX_SCORE * (1 - decay)));

        snake.maxCells += gainedScore;
        score += gainedScore;
        scoreEl.textContent = score;

        clearTimeout(bigAppleTimeout);
        bigApple = null;
      }

      for (let i = index + 1; i < snake.cells.length; i++) {
        if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
          running = false;
          cancelAnimationFrame(animationId);
          message.textContent = '💀 Game Over';
          message.style.display = 'block';
          restartBtn.style.display = 'inline-block';
        }
      }
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && snake.dx === 0) {
      snake.dx = -grid; snake.dy = 0; snake.direction = 'left';
    } else if (e.key === 'ArrowUp' && snake.dy === 0) {
      snake.dy = -grid; snake.dx = 0; snake.direction = 'up';
    } else if (e.key === 'ArrowRight' && snake.dx === 0) {
      snake.dx = grid; snake.dy = 0; snake.direction = 'right';
    } else if (e.key === 'ArrowDown' && snake.dy === 0) {
      snake.dy = grid; snake.dx = 0; snake.direction = 'down';
    }
  });

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
        snake.dx = grid; snake.dy = 0; snake.direction = 'right';
      } else if (dx < -30 && snake.dx === 0) {
        snake.dx = -grid; snake.dy = 0; snake.direction = 'left';
      }
    } else {
      if (dy > 30 && snake.dy === 0) {
        snake.dy = grid; snake.dx = 0; snake.direction = 'down';
      } else if (dy < -30 && snake.dy === 0) {
        snake.dy = -grid; snake.dx = 0; snake.direction = 'up';
      }
    }
  });

  restartBtn.addEventListener('click', initGame);

  function getHeadDetails(cell, direction) {
    const cx = cell.x + grid / 2;
    const cy = cell.y + grid / 2;
    const offset = grid * 0.2;

    let eye1, eye2, tongue;
    switch (direction) {
      case 'up':
        eye1 = [cx - offset, cy - offset];
        eye2 = [cx + offset, cy - offset];
        tongue = { start: [cx, cy - grid / 2], end: [cx, cy - grid] };
        break;
      case 'down':
        eye1 = [cx - offset, cy + offset];
        eye2 = [cx + offset, cy + offset];
        tongue = { start: [cx, cy + grid / 2], end: [cx, cy + grid] };
        break;
      case 'left':
        eye1 = [cx - offset, cy - offset];
        eye2 = [cx - offset, cy + offset];
        tongue = { start: [cx - grid / 2, cy], end: [cx - grid, cy] };
        break;
      case 'right':
      default:
        eye1 = [cx + offset, cy - offset];
        eye2 = [cx + offset, cy + offset];
        tongue = { start: [cx + grid / 2, cy], end: [cx + grid, cy] };
        break;
    }

    return [eye1, eye2, tongue];
  }

  initGame();
});
