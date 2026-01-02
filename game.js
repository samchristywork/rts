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
  }

  end() {
    this.status = 'finished';
  }
}

module.exports = Game;
