class AIController {
  static runAI(game, player) {
    if (player.cpuType === 'Normal') {
      this.runNormalAI(game, player);
    } else if (player.cpuType === 'Aggressive') {
      this.runAggressiveAI(game, player);
    }
  }

  static assignWorkers(game, player, base) {
    const resources = game.entities.filter(e => e.type === 'resource' && e.value > 0);
    if (resources.length === 0) return;

    const workers = game.entities.filter(e => e.type === 'worker' && e.ownerId === player.id);
    const resourcesByDistance = resources.map(r => {
      const dx = r.position.x - base.position.x;
      const dy = r.position.y - base.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { resource: r, distance };
    }).sort((a, b) => a.distance - b.distance);

    const closestResource = resourcesByDistance[0].resource;

    workers.forEach(worker => {
      if (!worker.harvestState) {
        if (!player.aiState.workerAssignments[worker.id] || !resources.find(r => r.id === player.aiState.workerAssignments[worker.id])) {
          player.aiState.workerAssignments[worker.id] = closestResource.id;

          const action = {
            type: 'harvest',
            entityId: worker.id,
            resourceId: closestResource.id,
            dropoffId: base.id
          };

          game.addAction(action);
        }
      }
    });
  }

  static manageCombat(game, player) {
    const combatUnits = game.entities.filter(e => (e.type === 'melee' || e.type === 'ranged') && e.ownerId === player.id);
    const enemies = game.entities.filter(e => e.ownerId && e.ownerId !== player.id);

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

          game.addAction(action);
        }
      }
    });
  }

  static runNormalAI(game, player) {
    const bases = game.entities.filter(e => e.type === 'base' && e.ownerId === player.id);

    bases.forEach(base => {
      this.assignWorkers(game, player, base);

      if (base.storedResources >= 5 && base.buildQueue.length === 0 && !base.currentBuild) {
        const action = {
          type: 'build',
          entityId: base.id,
          unitType: 'worker'
        };

        game.addAction(action);
      }
    });

    this.manageCombat(game, player);
  }

  static runAggressiveAI(game, player) {
    const bases = game.entities.filter(e => e.type === 'base' && e.ownerId === player.id);

    bases.forEach(base => {
      this.assignWorkers(game, player, base);

      if (base.storedResources >= 5 && base.buildQueue.length === 0 && !base.currentBuild) {
        const meleeCount = game.entities.filter(e => e.type === 'melee' && e.ownerId === player.id).length;
        const rangedCount = game.entities.filter(e => e.type === 'ranged' && e.ownerId === player.id).length;

        const unitType = meleeCount <= rangedCount ? 'melee' : 'ranged';

        const action = {
          type: 'build',
          entityId: base.id,
          unitType: unitType
        };

        game.addAction(action);
      }
    });

    this.manageCombat(game, player);
  }
}

module.exports = AIController;
