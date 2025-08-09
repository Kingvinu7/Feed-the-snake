// snake.js - Farcaster Miniapp compatible version

let sdk = null;
let isInFrame = false;
let frameContext = null;

// Initialize Farcaster Miniapp SDK
async function initializeFarcaster() {
  try {
    // Wait for miniapp to be available
    if (typeof window.miniapp !== 'undefined') {
      await window.miniapp.init();
      sdk = window.miniapp;
      isInFrame = true;
      frameContext = sdk.context;
      console.log('✅ Farcaster Miniapp SDK initialized');
      console.log('Frame context:', frameContext);
      setupMiniappFeatures();
    } else {
      console.log('Miniapp SDK not available, running in standalone mode');
      isInFrame = false;
    }
  } catch (error) {
    console.log('Not running inside a Farcaster miniapp or SDK unavailable:', error);
    isInFrame = false;
  }
}

// Setup miniapp-specific features
function setupMiniappFeatures() {
  if (!isInFrame || !sdk) return;
  console.log('Setting up miniapp features');
  
  // Add miniapp-specific functionality here
  // For example: analytics, user data access, etc.
}

// Show loading screen
function showLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.remove('hidden');
  }
}

// Hide loading screen
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
  }
}

// Wait for DOM and then initialize
document.addEventListener('DOMContentLoaded', function() {
  
  // Game variables
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found. Aborting initialization.');
    return;
  }
  
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
  const playAgainBtn = document.getElementById('playAgainBtn');

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

  let bestScore = 0;
  let highScores = [];

  // Load saved data
  try {
    bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
  } catch {
    bestScore = 0;
  }

  try {
    highScores = JSON.parse(localStorage.getItem('highScores')) || [];
  } catch {
    highScores = [];
  }

  let gameRunning = false;
  let gameStarted = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let lastMoveTime = 0;
  let gameSpeed = 250;

  // Game boundaries (with walls on left and right)
  const WALL_LEFT = 1;
  const WALL_RIGHT = tileCount - 2;
  const WALL_TOP = 0;
  const WALL_BOTTOM = tileCount - 1;

  // Update best score display
  if (bestScoreEl) {
    bestScoreEl.textContent = `Best: ${bestScore}`;
  }

  // Enhanced food generation (inside walls)
  function generateFood() {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * (WALL_RIGHT - WALL_LEFT + 1)) + WALL_LEFT,
        y: Math.floor(Math.random() * (WALL_BOTTOM - WALL_TOP + 1)) + WALL_TOP
      };
    } while (
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
      (bigApple && bigApple.x === newFood.x && bigApple.y === newFood.y)
    );
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
    } while (
      snake.some(segment => segment.x === newBigApple.x && segment.y === newBigApple.y) ||
      (food.x === newBigApple.x && food.y === newBigApple.y)
    );
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
        x + gridSize / 2,
        y + gridSize / 2,
        0,
        x + gridSize / 2,
        y + gridSize / 2,
        gridSize / 2
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
      foodX + gridSize / 2,
      foodY + gridSize / 2,
      0,
      foodX + gridSize / 2,
      foodY + gridSize / 2,
      gridSize / 2
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
        bigAppleX + gridSize / 2,
        bigAppleY + gridSize / 2,
        0,
        bigAppleX + gridSize / 2,
        bigAppleY + gridSize / 2,
        size / 2
      );
      bigAppleGradient.addColorStop(0, '#ffd700');
      bigAppleGradient.addColorStop(0.7, '#ffaa00');
      bigAppleGradient.addColorStop(1, '#ff8800');

      ctx.fillStyle = bigAppleGradient;
      ctx.fillRect(bigAppleX + offset, bigAppleY + offset, size, size);

      // Draw countdown and score
      const currentScore = Math.max(
        10,
        bigAppleMaxScore - Math.floor((Date.now() - bigApple.spawnTime) / 100)
      );

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(currentScore.toString(), bigAppleX + gridSize / 2, bigAppleY + gridSize / 2 + 3);

      // Countdown bar
      const timeLeft = Math.max(0, bigAppleCountdown - (Date.now() - bigApple.spawnTime));
      const barWidth = gridSize - 4;
      const barHeight = 2;
      const barX = bigAppleX + 2;
      const barY = bigAppleY - 6;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const progress = timeLeft / bigAppleCountdown;
      ctx.fillStyle =
        progress > 0.5 ? '#00ff00' : progress > 0.25 ? '#ffff00' : '#ff0000';
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
      if (scoreEl) {
        scoreEl.textContent = `Score: ${score}`;
      }
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
      if (scoreEl) {
        scoreEl.textContent = `Score: ${score}`;
      }

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
        x: x + gridSize / 2,
        y: y + gridSize / 2,
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
      try {
        localStorage.setItem('bestScore', bestScore);
      } catch (e) {
        console.log('Could not save best score');
      }
      if (bestScoreEl) {
        bestScoreEl.textContent = `Best: ${bestScore}`;
      }
    }

    // Add to high scores
    const gameDate = new Date().toLocaleDateString();
    highScores.push({ score: score, date: gameDate });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10); // Keep top 10
    try {
      localStorage.setItem('highScores', JSON.stringify(highScores));
    } catch (e) {
      console.log('Could not save high scores');
    }

    if (finalScoreEl) {
      finalScoreEl.textContent = `Final Score: ${score}`;
    }
    
    if (gameOverScreen) {
      gameOverScreen.style.display = 'block';
    }

    // Add celebratory effect for new high score
    if (score === bestScore && score > 0) {
      document.body.style.animation = 'celebration 2s ease-in-out';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 2000);
    }

    // Send score to Farcaster if in miniapp
    if (isInFrame && sdk) {
      try {
        // Miniapp-specific score reporting
        sdk.actions.ready();
      } catch (e) {
        console.log('Could not report to miniapp');
      }
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
    if (scoreEl) {
      scoreEl.textContent = `Score: ${score}`;
    }
    if (gameOverScreen) {
      gameOverScreen.style.display = 'none';
    }
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

  // Show high scores
  function showHighScores() {
    if (highScoresList) {
      highScoresList.innerHTML = '';
      if (highScores.length === 0) {
        highScoresList.innerHTML = '<p style="color: #aaa; padding: 20px;">No high scores yet! Play to set your first record.</p>';
      } else {
        highScores.forEach((scoreData, index) => {
          const scoreItem = document.createElement('div');
          scoreItem.className = 'high-score-item';
          scoreItem.innerHTML = `
            <span class="high-score-rank">#${index + 1}</span>
            <span class="high-score-value">${scoreData.score} pts</span>
            <span class="high-score-date">${scoreData.date}</span>
          `;
          highScoresList.appendChild(scoreItem);
        });
      }
    }
    if (highScoresContainer) {
      highScoresContainer.style.display = 'flex';
    }
  }

  // Clear high scores
  function clearHighScores() {
    if (confirm('Are you sure you want to clear all high scores?')) {
      highScores = [];
      try {
        localStorage.removeItem('highScores');
      } catch (e) {
        console.log('Could not clear high scores');
      }
      showHighScores();
    }
  }

  // Enhanced share function for Miniapp
  function shareGame() {
    const shareText = `🐍 I just scored ${score} points in Feed The Snake!`;
    const shareUrl = window.location.href;
    
    if (isInFrame && sdk) {
      try {
        // Farcaster Miniapp specific sharing
        sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`);
      } catch (e) {
        console.log('Miniapp share failed, using fallback');
        fallbackShare(shareText, shareUrl);
      }
    } else if (navigator.share) {
      navigator.share({
        title: 'Feed The Snake',
        text: shareText,
        url: shareUrl
      }).catch(() => fallbackShare(shareText, shareUrl));
    } else {
      fallbackShare(shareText, shareUrl);
    }
  }

  // Fallback share function
  function fallbackShare(shareText, shareUrl) {
    const textToCopy = `${shareText} ${shareUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        alert('🎉 Score copied to clipboard!');
      }).catch(() => {
        fallbackCopyToClipboard(textToCopy);
      });
    } else {
      fallbackCopyToClipboard(textToCopy);
    }
  }

  // Fallback copy function
  function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert('🎉 Score copied to clipboard!');
    } catch (err) {
      console.error('Fallback copy failed');
      alert(`Your score: ${score} points! Share it with your friends!`);
    }
    document.body.removeChild(textArea);
  }

  // Event listeners
  if (restartBtn) {
    restartBtn.addEventListener('click', restartGame);
  }
  
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', restartGame);
  }
  
  if (shareBtn) {
    shareBtn.addEventListener('click', shareGame);
  }
  
  if (highScoresBtn) {
    highScoresBtn.addEventListener('click', showHighScores);
  }
  
  if (clearHighScoresBtn) {
    clearHighScoresBtn.addEventListener('click', clearHighScores);
  }
  
  if (closeHighScoresBtn) {
    closeHighScoresBtn.addEventListener('click', () => {
      if (highScoresContainer) {
        highScoresContainer.style.display = 'none';
      }
    });
  }

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    // Prevent arrow keys from scrolling the page
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

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

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Minimum swipe distance
    const minSwipeDistance = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > minSwipeDistance) {
        if (diffX > 0) {
          changeDirection(1, 0); // Right
        } else {
          changeDirection(-1, 0); // Left
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > minSwipeDistance) {
        if (diffY > 0) {
          changeDirection(0, 1); // Down
        } else {
          changeDirection(0, -1); // Up
        }
      }
    }

    touchStartX = 0;
    touchStartY = 0;
  }, { passive: false });

  // Game loop
  function gameLoop() {
    updateGame();
    requestAnimationFrame(gameLoop);
  }

  // Initialize game
  function initGame() {
    // Show loading screen
    showLoadingScreen();
    
    // Initialize food position
    food = generateFood();
    drawGame();
    
    // Initialize Farcaster
    initializeFarcaster().then(() => {
      // Hide loading screen after initialization
      hideLoadingScreen();
    }).catch(() => {
      // Hide loading screen even if Farcaster init fails
      hideLoadingScreen();
    });
    
    // Start game loop
    gameLoop();
  }

  // Start the game
  initGame();

}); // End of DOMContentLoaded
