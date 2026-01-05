const Entity = require('./entity');

class Game {
  constructor(mapId, playerIds) {
    this.id = this.generateGameId();
    this.startTime = Date.now();
    this.playerIds = playerIds;
    this.mapId = mapId;
    this.entities = [];
    this.actions = [];
    this.status = 'waiting';
    this.nextEntityId = 1;
  }

  generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addEntity(type, ownerId, x, y) {
    const entity = new Entity(this.nextEntityId++, type, ownerId, x, y);
    this.entities.push(entity);
    return entity;
  }

  removeEntity(entityId) {
    this.entities = this.entities.filter(e => e.id !== entityId);
  }

  getEntity(entityId) {
    return this.entities.find(e => e.id === entityId);
  }

  applySeparation() {
    for (let i = 0; i < this.entities.length - 1; i++) {
      for (let j = i + 1; j < this.entities.length; j++) {
        const e1 = this.entities[i];
        const e2 = this.entities[j];

        const dx = e2.position.x - e1.position.x;
        const dy = e2.position.y - e1.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = e1.radius + e2.radius;

        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          const nx = dx / distance;
          const ny = dy / distance;

          if (e1.movable) {
            e1.position.x -= nx * overlap * 0.5;
            e1.position.y -= ny * overlap * 0.5;
          }

          if (e2.movable) {
            e2.position.x += nx * overlap * 0.5;
            e2.position.y += ny * overlap * 0.5;
          }
        }
      }
    }
  }

  start() {
    this.status = 'running';
    this.startTime = Date.now();
    this.initializePlayerEntities();
    this.initializeResources();
    console.log(`Game started: ${this.id}`);
  }

  initializePlayerEntities() {
    this.playerIds.forEach((playerId, index) => {
      const baseX = 100 + (index * 550);
      const baseY = 100 + (index * 350);

      this.addEntity('base', playerId, baseX, baseY);

      for (let i = 0; i < 3; i++) {
        this.addEntity('worker', playerId, baseX + 50 + (i * 30), baseY + 50);
      }

      this.addEntity('melee', playerId, baseX + 70, baseY + 100);
      this.addEntity('ranged', playerId, baseX + 100, baseY + 100);
    });
  }

  initializeResources() {
    this.addEntity('resource', null, 300, 200);
    this.addEntity('resource', null, 500, 300);
    this.addEntity('resource', null, 200, 400);
    this.addEntity('resource', null, 600, 150);
    this.addEntity('resource', null, 400, 450);
  }

  end() {
    this.status = 'finished';
  }

  addAction(action) {
    this.actions.push(action);
  }

  simulate() {
    while (this.actions.length > 0) {
      const action = this.actions.shift();
      if (action.type === 'move') {
        const entity = this.getEntity(action.entityId);
        if (entity) {
          entity.target = { x: action.x, y: action.y };
          entity.harvestState = null;
        }
      } else if (action.type === 'harvest') {
        const worker = this.getEntity(action.entityId);
        const resource = this.getEntity(action.resourceId);
        const dropoff = this.getEntity(action.dropoffId);
        if (worker && resource && dropoff) {
          worker.harvestState = {
            phase: 'moving_to_resource',
            resourceId: action.resourceId,
            dropoffId: action.dropoffId
          };
          worker.target = { x: resource.position.x, y: resource.position.y };
        }
      } else if (action.type === 'build') {
        const base = this.getEntity(action.entityId);
        if (base && base.type === 'base') {
          base.buildQueue.push({ unitType: action.unitType, cost: 5, buildTime: 90 });
        }
      } else if (action.type === 'attack') {
        const attacker = this.getEntity(action.entityId);
        const target = this.getEntity(action.targetId);
        if (attacker && target && attacker.attack > 0) {
          attacker.attackTarget = action.targetId;
        }
      }
    }

    this.entities.forEach(entity => {
      if (entity.harvestState) {
        if (entity.harvestState.phase === 'moving_to_resource') {
          const resource = this.getEntity(entity.harvestState.resourceId);
          if (resource) {
            const dx = resource.position.x - entity.position.x;
            const dy = resource.position.y - entity.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= entity.harvestRange && resource.value > 0 && entity.carrying < entity.carryingCapacity) {
              const amount = Math.min(1, resource.value);
              resource.value -= amount;
              entity.carrying += amount;
              entity.harvestState.phase = 'moving_to_dropoff';
              const dropoff = this.getEntity(entity.harvestState.dropoffId);
              if (dropoff) {
                entity.target = { x: dropoff.position.x, y: dropoff.position.y };
              }
            }
          } else {
            entity.harvestState = null;
            entity.target = null;
          }
        } else if (entity.harvestState.phase === 'moving_to_dropoff') {
          const dropoff = this.getEntity(entity.harvestState.dropoffId);
          if (dropoff) {
            const dx = dropoff.position.x - entity.position.x;
            const dy = dropoff.position.y - entity.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= entity.harvestRange && entity.carrying > 0) {
              const spaceAvailable = dropoff.resourceCapacity - dropoff.storedResources;
              if (spaceAvailable > 0) {
                const amount = Math.min(entity.carrying, spaceAvailable);
                dropoff.storedResources += amount;
                entity.carrying -= amount;

                if (entity.carrying === 0) {
                  const resource = this.getEntity(entity.harvestState.resourceId);
                  if (resource && resource.value > 0) {
                    entity.harvestState.phase = 'moving_to_resource';
                    entity.target = { x: resource.position.x, y: resource.position.y };
                  } else {
                    entity.harvestState = null;
                    entity.target = null;
                  }
                }
              }
            }
          } else {
            entity.harvestState = null;
            entity.target = null;
          }
        }
      }

      if (entity.target) {
        const dx = entity.target.x - entity.position.x;
        const dy = entity.target.y - entity.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < entity.speed) {
          entity.position.x = entity.target.x;
          entity.position.y = entity.target.y;
          entity.target = null;
        } else {
          entity.position.x += (dx / distance) * entity.speed;
          entity.position.y += (dy / distance) * entity.speed;
        }
      }

      if (entity.type === 'base') {
        if (!entity.currentBuild && entity.buildQueue.length > 0) {
          const nextBuild = entity.buildQueue[0];
          if (entity.storedResources >= nextBuild.cost) {
            entity.storedResources -= nextBuild.cost;
            entity.currentBuild = entity.buildQueue.shift();
            entity.buildProgress = 0;
          }
        }

        if (entity.currentBuild) {
          entity.buildProgress++;
          if (entity.buildProgress >= entity.currentBuild.buildTime) {
            this.addEntity(entity.currentBuild.unitType, entity.ownerId, entity.position.x + 50, entity.position.y + 50);
            entity.currentBuild = null;
            entity.buildProgress = 0;
          }
        }
      }

      if (entity.attackCooldown > 0) {
        entity.attackCooldown--;
      }

      if (entity.attackTarget !== null && entity.attack > 0) {
        const target = this.getEntity(entity.attackTarget);
        if (!target || target.health <= 0) {
          entity.attackTarget = null;
        } else {
          const dx = target.position.x - entity.position.x;
          const dy = target.position.y - entity.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= entity.attackRange) {
            if (entity.attackCooldown === 0) {
              target.health -= entity.attack;
              entity.attackCooldown = entity.attackCooldownMax;
            }
          } else {
            entity.target = { x: target.position.x, y: target.position.y };
          }
        }
      }
    });

    this.applySeparation();

    this.entities = this.entities.filter(e => e.health > 0);
  }
}

module.exports = Game;
