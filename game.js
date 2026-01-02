const Entity = require('./entity');

class Game {
  constructor(mapId, playerIds) {
    this.id = this.generateGameId();
    this.startTime = Date.now();
    this.playerIds = playerIds;
    this.mapId = mapId;
    this.entities = [];
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

  end() {
    this.status = 'finished';
  }
}

module.exports = Game;
