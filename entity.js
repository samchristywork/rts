class Entity {
  constructor(id, type, ownerId, x, y) {
    this.id = id;
    this.type = type;
    this.ownerId = ownerId;
    this.position = { x, y };
    this.target = null;
    this.speed = 2;
    this.health = 100;
    this.maxHealth = 100;
    this.value = type === 'resource' ? 500 : 0;
    this.carrying = 0;
    this.carryingCapacity = type === 'worker' ? 1 : 0;
    this.storedResources = type === 'base' ? 0 : null;
    this.resourceCapacity = type === 'base' ? 100 : null;
    this.harvestState = null;
    this.createdAt = Date.now();
  }
}

module.exports = Entity;
