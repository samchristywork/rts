const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');
const socket = io();

function renderGame(game) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  game.entities.forEach(entity => {
    if (entity.target) {
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(entity.position.x, entity.position.y);
      ctx.lineTo(entity.target.x, entity.target.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  game.entities.forEach(entity => {
    if (entity.type === 'base') {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(entity.position.x, entity.position.y, 40, 40);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(entity.position.x, entity.position.y, 40, 40);
    } else if (entity.type === 'worker') {
      ctx.fillStyle = '#4169E1';
      ctx.beginPath();
      ctx.arc(entity.position.x, entity.position.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (entity.type === 'resource') {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(entity.position.x, entity.position.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.stroke();
    } else if (entity.type === 'melee') {
      ctx.fillStyle = '#DC143C';
      ctx.beginPath();
      ctx.arc(entity.position.x, entity.position.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.stroke();
    } else if (entity.type === 'ranged') {
      ctx.fillStyle = '#32CD32';
      ctx.fillRect(entity.position.x - 8, entity.position.y - 8, 16, 16);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(entity.position.x - 8, entity.position.y - 8, 16, 16);
    }

    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText(`${entity.id}`, entity.position.x - 5, entity.position.y - 10);

    if (entity.type === 'resource') {
      ctx.fillText(`${entity.value}`, entity.position.x - 10, entity.position.y + 20);
    } else if (entity.type === 'base') {
      ctx.fillText(`${entity.storedResources}/${entity.resourceCapacity}`, entity.position.x - 5, entity.position.y + 50);

      if (entity.currentBuild) {
        const percent = Math.floor((entity.buildProgress / entity.currentBuild.buildTime) * 100);
        ctx.fillText(`Building: ${entity.currentBuild.unitType} ${percent}%`, entity.position.x - 5, entity.position.y + 60);
      }

      if (entity.buildQueue.length > 0) {
        ctx.fillText(`Queue: ${entity.buildQueue.length}`, entity.position.x - 5, entity.position.y + 70);
      }
    } else if (entity.type === 'worker') {
      ctx.fillText(`${entity.carrying}`, entity.position.x - 5, entity.position.y + 15);
    }

    if (entity.type !== 'resource') {
      const healthPercent = entity.health / entity.maxHealth;
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(entity.position.x - 15, entity.position.y - 20, 30, 4);
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(entity.position.x - 15, entity.position.y - 20, 30 * healthPercent, 4);
    }
  });
}

async function loadGame() {
  const response = await fetch(`/api/games/${encodeURIComponent(gameId)}`);
  const game = await response.json();
  renderGame(game);
  runAI(game);
}

socket.on(`game:${gameId}`, (game) => {
  renderGame(game);
  runAI(game);
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const action = {
    type: 'move',
    entityId: 4,
    x: x,
    y: y
  };

  socket.emit('action', { gameId, action });
});

loadGame();
