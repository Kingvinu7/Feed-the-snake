const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');
const shareBtn = document.getElementById('shareBtn');
const highScoresBtn = document.getElementById('highScoresBtn');
const highScoresContainer = document.getElementById('highScoresContainer');
const highScoresList = document.getElementById('highScoresList');
const clearHighScoresBtn = document.getElementById('clearHighScoresBtn');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');

let tileSize = 20;
let cols, rows;

function resizeCanvas() {
  const maxWidth = window.innerWidth * 0.9;
  const maxHeight = window.innerHeight * 0.5;
  const aspectRatio = 3 / 4;

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  canvas.width = width;
  canvas.height = height;

  // Increased tile size for bigger snake and apple
  tileSize = Math.floor(width / 25); // Changed from 30 to 25 for bigger elements
  cols = Math.floor(width / tileSize);
  rows = Math.floor(height / tileSize);
}

resizeCanvas();
window.addEventListener("resize", () => location.reload());

let snake, direction, apple, bigApple, score, gameInterval, bigAppleTimer;
let gameStarted = false;
let highScoresVisible = false;

// High Scores Management
function getHighScores() {
  const scores = localStorage.getItem('snakeHighScores');
  return scores ? JSON.parse(scores) : [];
}

function saveHighScore(score) {
  const highScores = getHighScores();
  const now = new Date();
  const scoreEntry = {
    score: score,
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString()
  };
  
  highScores.push(scoreEntry);
  highScores.sort((a, b) => b.score - a.score);
  
  // Keep only top 10 scores
  if (highScores.length > 10) {
    highScores.splice(10);
  }
  
  localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
  return highScores;
}

function displayHighScores() {
  const highScores = getHighScores();
  
  if (highScores.length === 0) {
    highScoresList.innerHTML = '<div class="high-score-item">No high scores yet!</div>';
    return;
  }
  
  let html = '';
  highScores.forEach((entry, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    html += `<div class="high-score-item">${medal} ${entry.score} points - ${entry.date}</div>`;
  });
  
  highScoresList.innerHTML = html;
}

function toggleHighScores() {
  highScoresVisible = !highScoresVisible;
  if (highScoresVisible) {
    displayHighScores();
    highScoresContainer.style.display = 'block';
    highScoresBtn.textContent = '🔽 Hide Scores';
  } else {
    highScoresContainer.style.display = 'none';
    highScoresBtn.textContent = '🏆 High Scores';
  }
}


function resetGame() {
  snake = [{ x: 5, y: 5 }];
  direction = { x: 1, y: 0 };
  apple = randomPosition();
  bigApple = null;
  score = 0;
  gameStarted = true;
  updateScore();
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 180);
  restartBtn.style.display = "none";
  shareBtn.style.display = "none";
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
    showGameOver();
    return;
  }

  snake.unshift(head);

  if (head.x === apple.x && head.y === apple.y) {
  score += 5;
  applesEaten++; // Track actual apples eaten
  apple = randomPosition();

  // Spawn big apple every 5 small apples eaten (i.e. after 5, 10, 15, etc.)
  if (applesEaten % 5 === 0 && !bigApple) {
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

function showGameOver() {
  finalScoreEl.textContent = `Final Score: ${score}`;
  gameOverEl.style.display = "block";
  
  // Save high score
  if (score > 0) {
    saveHighScore(score);
  }
  
  // Show buttons immediately - no delay
  restartBtn.style.display = "block";
  shareBtn.style.display = "block";
}

function shareScore() {
  const message = `🐍 I just scored ${score} points in Feed The Snake! Can you beat my score? Play now: ${window.location.href}`;
  
  // Check if Web Share API is supported
  if (navigator.share) {
    navigator.share({
      title: '🐍 Feed The Snake',
      text: message,
      url: window.location.href
    }).catch(err => {
      console.log('Error sharing:', err);
      fallbackShare(message);
    });
  } else {
    fallbackShare(message);
  }
}

function fallbackShare(message) {
  // Fallback: copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(message).then(() => {
      // Visual feedback
      shareBtn.textContent = '✅ Copied!';
      shareBtn.style.background = 'linear-gradient(45deg, #4CAF50, #66BB6A)';
      
      setTimeout(() => {
        shareBtn.textContent = '📤 Share Score';
        shareBtn.style.background = 'linear-gradient(45deg, #4CAF50, #66BB6A)';
      }, 2000);
    }).catch(() => {
      // If clipboard fails, show manual copy option
      prompt('Copy this message to share your score:', message);
    });
  } else {
    // Final fallback: show prompt
    prompt('Copy this message to share your score:', message);
  }
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

  // Draw apple with neon glow (increased size)
  ctx.shadowColor = '#ff4444';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(
    apple.x * tileSize + tileSize / 2,
    apple.y * tileSize + tileSize / 2,
    tileSize / 2.2, // Increased from 2.5 to 2.2 for bigger apple
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
    tileSize / 5, // Increased from 6 to 5 for bigger highlight
    0, Math.PI * 2
  );
  ctx.fill();

  // Draw big apple with orange glow (increased size)
  if (bigApple) {
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.arc(
      bigApple.x * tileSize + tileSize / 2,
      bigApple.y * tileSize + tileSize / 2,
      tileSize / 1.6, // Increased from 1.8 to 1.6 for bigger big apple
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
      tileSize / 3.5, // Increased from 4 to 3.5 for bigger highlight
      0, Math.PI * 2
    );
    ctx.fill();

    // Draw countdown circle below big apple (scales with value)
    const countdownScale = Math.max(0.1, bigApple.value / 200); // Scale from 0.1 to 1.0
    const countdownRadius = (tileSize / 4) * countdownScale;
    const countdownY = bigApple.y * tileSize + tileSize + countdownRadius + 5;
    
    // Only draw if the countdown circle would be within canvas bounds
    if (countdownY + countdownRadius < canvas.height) {
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.arc(
        bigApple.x * tileSize + tileSize / 2,
        countdownY,
        countdownRadius,
        0, Math.PI * 2
      );
      ctx.fill();

      // Inner highlight for countdown circle
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffcc44';
      ctx.beginPath();
      ctx.arc(
        bigApple.x * tileSize + tileSize / 2 - 1,
        countdownY - 1,
        countdownRadius * 0.6,
        0, Math.PI * 2
      );
      ctx.fill();

      // Value text in countdown circle
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1a1a3a';
      ctx.font = `bold ${Math.max(8, countdownRadius)}px Orbitron`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        bigApple.value.toString(),
        bigApple.x * tileSize + tileSize / 2,
        countdownY
      );
    }
  }

  // Draw snake with neon glow (increased size)
  snake.forEach((segment, i) => {
    const alpha = 1 - (i / snake.length) * 0.7;
    
    // Main body with glow - increased padding for bigger snake
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fillStyle = i === 0 ? '#00ff88' : `rgba(0, 255, 136, ${alpha})`;
    ctx.fillRect(
      segment.x * tileSize + 0.5, // Reduced padding from 1 to 0.5
      segment.y * tileSize + 0.5, 
      tileSize - 1, // Reduced from 2 to 1
      tileSize - 1
    );

    // Inner highlight - increased size
    ctx.shadowBlur = 0;
    ctx.fillStyle = i === 0 ? '#44ffaa' : `rgba(68, 255, 170, ${alpha * 0.8})`;
    ctx.fillRect(
      segment.x * tileSize + 2, // Reduced padding from 3 to 2
      segment.y * tileSize + 2, 
      tileSize - 4, // Reduced from 6 to 4
      tileSize - 4
    );

    if (i === 0) {
      // Eyes with glow - increased size
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(segment.x * tileSize + tileSize * 0.3, segment.y * tileSize + tileSize * 0.3, 4, 0, 2 * Math.PI); // Increased from 3 to 4
      ctx.arc(segment.x * tileSize + tileSize * 0.7, segment.y * tileSize + tileSize * 0.3, 4, 0, 2 * Math.PI); // Increased from 3 to 4
      ctx.fill();

      // Eye pupils - increased size
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(segment.x * tileSize + tileSize * 0.3, segment.y * tileSize + tileSize * 0.3, 2, 0, 2 * Math.PI); // Increased from 1.5 to 2
      ctx.arc(segment.x * tileSize + tileSize * 0.7, segment.y * tileSize + tileSize * 0.3, 2, 0, 2 * Math.PI); // Increased from 1.5 to 2
      ctx.fill();

      // Glowing tongue - increased size
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 4; // Increased from 3 to 4
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

// Event listeners
restartBtn.addEventListener('click', resetGame);
shareBtn.addEventListener('click', shareScore);
highScoresBtn.addEventListener('click', toggleHighScores);
clearHighScoresBtn.addEventListener('click', clearHighScores);

// Start the game
resetGame();
drawGame();
