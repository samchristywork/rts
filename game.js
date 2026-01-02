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
        } else {
          entity.position.x += (dx / distance) * entity.speed;
          entity.position.y += (dy / distance) * entity.speed;
        }
      }
    });
  }
}

module.exports = Game;
