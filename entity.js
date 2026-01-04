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
    this.value = type === 'resource' ? 10 : 0;
    this.carrying = 0;
    this.carryingCapacity = type === 'worker' ? 1 : 0;
    this.storedResources = type === 'base' ? 0 : null;
    this.resourceCapacity = type === 'base' ? 50 : null;
    this.buildQueue = type === 'base' ? [] : null;
    this.currentBuild = type === 'base' ? null : null;
    this.buildProgress = type === 'base' ? 0 : null;
    this.harvestState = null;
    this.attack = type === 'melee' ? 10 : (type === 'ranged' ? 5 : 0);
    this.attackRange = type === 'melee' ? 15 : (type === 'ranged' ? 100 : 0);
    this.attackCooldown = 0;
    this.attackCooldownMax = 30;
    this.attackTarget = null;
    this.createdAt = Date.now();
  }
}

module.exports = Entity;
