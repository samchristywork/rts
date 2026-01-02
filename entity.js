class Entity {
  constructor(id, type, ownerId, x, y) {
    this.id = id;
    this.type = type;
    this.ownerId = ownerId;
    this.position = { x, y };
    this.health = 100;
    this.maxHealth = 100;
    this.createdAt = Date.now();
  }
}

module.exports = Entity;
