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

const workerAssignments = {};

function runAI(game) {
  const resources = game.entities.filter(e => e.type === 'resource' && e.value > 0);
  const bases = game.entities.filter(e => e.type === 'base');

  if (resources.length === 0) return;

  bases.forEach(base => {
    const workers = game.entities.filter(e => e.type === 'worker' && e.ownerId === base.ownerId);

    const resourcesByDistance = resources.map(r => {
      const dx = r.position.x - base.position.x;
      const dy = r.position.y - base.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { resource: r, distance };
    }).sort((a, b) => a.distance - b.distance);

    const closestResource = resourcesByDistance[0].resource;

    workers.forEach(worker => {
      if (!worker.harvestState) {
        if (!workerAssignments[worker.id] || !resources.find(r => r.id === workerAssignments[worker.id])) {
          workerAssignments[worker.id] = closestResource.id;

          const action = {
            type: 'harvest',
            entityId: worker.id,
            resourceId: closestResource.id,
            dropoffId: base.id
          };

          socket.emit('action', { gameId, action });
        }
      }
    });

    if (base.storedResources >= 5 && base.buildQueue.length === 0 && !base.currentBuild) {
      const action = {
        type: 'build',
        entityId: base.id,
        unitType: 'worker'
      };

      socket.emit('action', { gameId, action });
    }

    const combatUnits = game.entities.filter(e => (e.type === 'melee' || e.type === 'ranged') && e.ownerId === base.ownerId);
    const enemies = game.entities.filter(e => e.ownerId && e.ownerId !== base.ownerId);

    combatUnits.forEach(unit => {
      if (!unit.attackTarget && enemies.length > 0) {
        const closestEnemy = enemies.reduce((closest, enemy) => {
          const dx = enemy.position.x - unit.position.x;
          const dy = enemy.position.y - unit.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (!closest) return { enemy, distance };

          const closestDx = closest.enemy.position.x - unit.position.x;
          const closestDy = closest.enemy.position.y - unit.position.y;
          const closestDistance = Math.sqrt(closestDx * closestDx + closestDy * closestDy);

          return distance < closestDistance ? { enemy, distance } : closest;
        }, null);

        if (closestEnemy) {
          const action = {
            type: 'attack',
            entityId: unit.id,
            targetId: closestEnemy.enemy.id
          };

          socket.emit('action', { gameId, action });
        }
      }
    });
  });
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
