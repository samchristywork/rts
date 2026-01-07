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
