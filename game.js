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

  start() {
    this.status = 'running';
    this.startTime = Date.now();
    this.initializePlayerEntities();
    this.initializeResources();
    console.log(`Game started: ${this.id}`);
  }

  initializePlayerEntities() {
    this.playerIds.forEach((playerId, index) => {
      const baseX = 100 + (index * 500);
      const baseY = 100 + (index * 500);

      this.addEntity('base', playerId, baseX, baseY);

      for (let i = 0; i < 3; i++) {
        this.addEntity('worker', playerId, baseX + 50 + (i * 30), baseY + 50);
      }
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
      }
    }

    this.entities.forEach(entity => {
      if (entity.target) {
        const dx = entity.target.x - entity.position.x;
        const dy = entity.target.y - entity.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < entity.speed) {
          entity.position.x = entity.target.x;
          entity.position.y = entity.target.y;
          entity.target = null;

          if (entity.harvestState) {
            if (entity.harvestState.phase === 'moving_to_resource') {
              const resource = this.getEntity(entity.harvestState.resourceId);
              if (resource && resource.value > 0 && entity.carrying < entity.carryingCapacity) {
                const amount = Math.min(1, resource.value);
                resource.value -= amount;
                entity.carrying += amount;
                entity.harvestState.phase = 'moving_to_dropoff';
                const dropoff = this.getEntity(entity.harvestState.dropoffId);
                if (dropoff) {
                  entity.target = { x: dropoff.position.x, y: dropoff.position.y };
                }
              } else {
                entity.harvestState = null;
              }
            } else if (entity.harvestState.phase === 'moving_to_dropoff') {
              const dropoff = this.getEntity(entity.harvestState.dropoffId);
              if (dropoff && entity.carrying > 0) {
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
                    }
                  }
                }
              } else {
                entity.harvestState = null;
              }
            }
          }
        } else {
          entity.position.x += (dx / distance) * entity.speed;
          entity.position.y += (dy / distance) * entity.speed;
        }
      }
    });
  }
}

module.exports = Game;
