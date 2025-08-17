# No_Gas_Slaps™ Physics-Based Slap Engine Implementation Guide

## Overview

The physics-based slap engine is the core gameplay mechanic of the No_Gas_Slaps™ Telegram mini-app. This document provides a detailed implementation guide for developers to build the slap engine, including physics calculations, collision detection, scoring systems, and visual effects.

## Core Physics System

### 1. Physics Engine Architecture

The slap engine is built on a custom 2D physics system optimized for mobile performance and responsive gameplay. While we could use an existing physics library like Matter.js, implementing a custom solution gives us more control over the specific gameplay feel we want to achieve.

#### 1.1 Core Components

```typescript
// Main physics engine class
class SlapPhysicsEngine {
  private world: SlapWorld;
  private lastUpdateTime: number;
  private accumulatedTime: number;
  private timeStep: number = 1/60; // 60 FPS physics simulation
  
  constructor(worldConfig: WorldConfig) {
    this.world = new SlapWorld(worldConfig);
    this.lastUpdateTime = performance.now() / 1000;
    this.accumulatedTime = 0;
  }
  
  // Main update loop - called from game loop
  update(currentTime: number): void {
    const deltaTime = (currentTime / 1000) - this.lastUpdateTime;
    this.lastUpdateTime = currentTime / 1000;
    
    // Cap delta time to prevent spiral of death on slow devices
    const cappedDeltaTime = Math.min(deltaTime, 0.25);
    this.accumulatedTime += cappedDeltaTime;
    
    // Fixed timestep physics update
    while (this.accumulatedTime >= this.timeStep) {
      this.fixedUpdate(this.timeStep);
      this.accumulatedTime -= this.timeStep;
    }
    
    // Interpolation for smooth rendering
    const alpha = this.accumulatedTime / this.timeStep;
    this.interpolateState(alpha);
  }
  
  // Fixed timestep update for physics
  private fixedUpdate(dt: number): void {
    this.world.update(dt);
  }
  
  // Interpolate between physics states for smooth rendering
  private interpolateState(alpha: number): void {
    this.world.interpolate(alpha);
  }
  
  // Apply a slap with the given parameters
  applySlap(params: SlapParams): void {
    this.world.createSlap(params);
  }
  
  // Get the current world state for rendering
  getWorldState(): WorldState {
    return this.world.getState();
  }
}
```

#### 1.2 World Representation

```typescript
// World class that contains all physics objects
class SlapWorld {
  private gravity: Vector2;
  private bounds: Rect;
  private slaps: Slap[] = [];
  private targets: Target[] = [];
  private obstacles: Obstacle[] = [];
  private effects: SpecialEffect[] = [];
  private windForce: Vector2;
  
  constructor(config: WorldConfig) {
    this.gravity = config.gravity || new Vector2(0, 9.8);
    this.bounds = config.bounds;
    this.targets = config.targets.map(t => new Target(t));
    this.obstacles = config.obstacles.map(o => new Obstacle(o));
    this.windForce = config.windForce || new Vector2(0, 0);
  }
  
  // Update all physics objects
  update(dt: number): void {
    // Update slaps
    this.slaps.forEach(slap => {
      // Apply forces
      slap.applyForce(this.gravity.scale(slap.mass));
      slap.applyForce(this.windForce.scale(slap.dragCoefficient));
      
      // Update position and velocity
      slap.update(dt);
      
      // Check for collisions with bounds
      this.checkBoundaryCollisions(slap);
      
      // Check for collisions with targets
      this.checkTargetCollisions(slap);
      
      // Check for collisions with obstacles
      this.checkObstacleCollisions(slap);
    });
    
    // Update targets
    this.targets.forEach(target => target.update(dt));
    
    // Update obstacles
    this.obstacles.forEach(obstacle => obstacle.update(dt));
    
    // Update effects
    this.effects = this.effects.filter(effect => {
      effect.update(dt);
      return !effect.isFinished;
    });
    
    // Remove dead slaps
    this.slaps = this.slaps.filter(slap => !slap.isDead);
  }
  
  // Create a new slap with the given parameters
  createSlap(params: SlapParams): Slap {
    const slap = new Slap(params);
    this.slaps.push(slap);
    return slap;
  }
  
  // Check and resolve collisions with world boundaries
  private checkBoundaryCollisions(slap: Slap): void {
    const position = slap.position;
    const radius = slap.radius;
    
    // Check horizontal bounds
    if (position.x - radius < this.bounds.x) {
      slap.position.x = this.bounds.x + radius;
      slap.velocity.x *= -slap.restitution;
    } else if (position.x + radius > this.bounds.x + this.bounds.width) {
      slap.position.x = this.bounds.x + this.bounds.width - radius;
      slap.velocity.x *= -slap.restitution;
    }
    
    // Check vertical bounds
    if (position.y - radius < this.bounds.y) {
      slap.position.y = this.bounds.y + radius;
      slap.velocity.y *= -slap.restitution;
    } else if (position.y + radius > this.bounds.y + this.bounds.height) {
      slap.position.y = this.bounds.y + this.bounds.height - radius;
      slap.velocity.y *= -slap.restitution;
      
      // Apply friction when hitting the ground
      slap.velocity.x *= 0.9;
      
      // Check if slap should die (low energy)
      if (slap.velocity.magnitude() < 1.0) {
        slap.isDead = true;
      }
    }
  }
  
  // Check and resolve collisions with targets
  private checkTargetCollisions(slap: Slap): void {
    for (const target of this.targets) {
      if (target.isHit) continue;
      
      if (this.checkCollision(slap, target)) {
        // Handle collision
        this.resolveCollision(slap, target);
        
        // Mark target as hit
        target.hit(slap.velocity.magnitude());
        
        // Create hit effect
        this.createHitEffect(target.position);
        
        // Calculate score based on hit
        const score = this.calculateScore(slap, target);
        
        // Trigger score event
        this.triggerScoreEvent(score, target);
      }
    }
  }
  
  // Check and resolve collisions with obstacles
  private checkObstacleCollisions(slap: Slap): void {
    for (const obstacle of this.obstacles) {
      if (this.checkCollision(slap, obstacle)) {
        // Handle collision
        this.resolveCollision(slap, obstacle);
        
        // Create hit effect
        this.createHitEffect(slap.position);
      }
    }
  }
  
  // Generic collision detection between a slap and another object
  private checkCollision(slap: Slap, object: PhysicsObject): boolean {
    // Simple circle collision for now
    const distance = slap.position.distanceTo(object.position);
    return distance < (slap.radius + object.radius);
  }
  
  // Resolve collision between a slap and another object
  private resolveCollision(slap: Slap, object: PhysicsObject): void {
    // Calculate collision normal
    const normal = slap.position.subtract(object.position).normalize();
    
    // Calculate relative velocity
    const relativeVelocity = slap.velocity.subtract(object.velocity);
    
    // Calculate impulse scalar
    const velocityAlongNormal = relativeVelocity.dot(normal);
    
    // Do not resolve if objects are moving away from each other
    if (velocityAlongNormal > 0) return;
    
    // Calculate restitution (bounciness)
    const restitution = Math.min(slap.restitution, object.restitution);
    
    // Calculate impulse scalar
    let j = -(1 + restitution) * velocityAlongNormal;
    j /= (1 / slap.mass) + (1 / object.mass);
    
    // Apply impulse
    const impulse = normal.scale(j);
    slap.velocity = slap.velocity.add(impulse.scale(1 / slap.mass));
    
    if (object instanceof Target || object instanceof Obstacle) {
      object.velocity = object.velocity.subtract(impulse.scale(1 / object.mass));
    }
  }
  
  // Create a visual effect at the given position
  private createHitEffect(position: Vector2): void {
    const effect = new HitEffect(position);
    this.effects.push(effect);
  }
  
  // Calculate score based on slap and target
  private calculateScore(slap: Slap, target: Target): number {
    // Base score is proportional to velocity magnitude
    let score = slap.velocity.magnitude() * 10;
    
    // Multiply by target value
    score *= target.value;
    
    // Apply combo multiplier if applicable
    if (this.comboCount > 1) {
      score *= (1 + (this.comboCount * 0.1));
    }
    
    return Math.round(score);
  }
  
  // Trigger a score event
  private triggerScoreEvent(score: number, target: Target): void {
    // Dispatch event to game system
    if (this.onScoreEvent) {
      this.onScoreEvent({
        score,
        position: target.position.clone(),
        targetType: target.type,
        comboCount: this.comboCount
      });
    }
    
    // Increment combo count
    this.comboCount++;
    
    // Reset combo timeout
    if (this.comboTimeout) {
      clearTimeout(this.comboTimeout);
    }
    
    this.comboTimeout = setTimeout(() => {
      this.comboCount = 0;
    }, 2000);
  }
  
  // Interpolate physics state for rendering
  interpolate(alpha: number): void {
    // Interpolate all physics objects for smooth rendering
    this.slaps.forEach(slap => slap.interpolate(alpha));
    this.targets.forEach(target => target.interpolate(alpha));
    this.obstacles.forEach(obstacle => obstacle.interpolate(alpha));
  }
  
  // Get the current world state for rendering
  getState(): WorldState {
    return {
      slaps: this.slaps.map(s => s.getState()),
      targets: this.targets.map(t => t.getState()),
      obstacles: this.obstacles.map(o => o.getState()),
      effects: this.effects.map(e => e.getState())
    };
  }
}
```

### 2. Vector Mathematics

```typescript
class Vector2 {
  constructor(public x: number, public y: number) {}
  
  // Add another vector
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }
  
  // Subtract another vector
  subtract(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }
  
  // Scale by a scalar value
  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }
  
  // Calculate dot product
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }
  
  // Calculate magnitude (length)
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  
  // Normalize to unit vector
  normalize(): Vector2 {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2(0, 0);
    return new Vector2(this.x / mag, this.y / mag);
  }
  
  // Calculate distance to another vector
  distanceTo(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // Create a copy of this vector
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }
  
  // Rotate vector by angle (in radians)
  rotate(angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }
}
```

### 3. Physics Objects

#### 3.1 Base Physics Object

```typescript
abstract class PhysicsObject {
  position: Vector2;
  previousPosition: Vector2;
  velocity: Vector2;
  acceleration: Vector2;
  mass: number;
  restitution: number; // Bounciness
  radius: number; // For collision detection
  
  constructor(config: PhysicsObjectConfig) {
    this.position = config.position.clone();
    this.previousPosition = this.position.clone();
    this.velocity = config.velocity?.clone() || new Vector2(0, 0);
    this.acceleration = new Vector2(0, 0);
    this.mass = config.mass || 1;
    this.restitution = config.restitution || 0.7;
    this.radius = config.radius || 10;
  }
  
  // Apply a force to this object
  applyForce(force: Vector2): void {
    // F = ma, so a = F/m
    const accelerationChange = force.scale(1 / this.mass);
    this.acceleration = this.acceleration.add(accelerationChange);
  }
  
  // Update physics state
  update(dt: number): void {
    // Save previous position for interpolation
    this.previousPosition = this.position.clone();
    
    // Update velocity using acceleration
    this.velocity = this.velocity.add(this.acceleration.scale(dt));
    
    // Update position using velocity
    this.position = this.position.add(this.velocity.scale(dt));
    
    // Reset acceleration for next frame
    this.acceleration = new Vector2(0, 0);
  }
  
  // Interpolate between previous and current state
  interpolate(alpha: number): void {
    // No need to interpolate if alpha is 1
    if (alpha >= 1) return;
    
    // Interpolate position for smooth rendering
    const interpolatedPosition = this.previousPosition.add(
      this.position.subtract(this.previousPosition).scale(alpha)
    );
    
    // Store interpolated state for rendering
    this.renderPosition = interpolatedPosition;
  }
  
  // Get current state for rendering
  abstract getState(): any;
}
```

#### 3.2 Slap Object

```typescript
class Slap extends PhysicsObject {
  color: string;
  trailPoints: Vector2[] = [];
  maxTrailPoints: number = 20;
  isDead: boolean = false;
  dragCoefficient: number;
  spinRate: number;
  rotation: number = 0;
  
  constructor(params: SlapParams) {
    super({
      position: new Vector2(params.startX, params.startY),
      velocity: new Vector2(
        params.force * Math.cos(params.angle * Math.PI / 180),
        params.force * Math.sin(params.angle * Math.PI / 180)
      ),
      mass: params.mass || 1,
      radius: params.size || 20,
      restitution: params.restitution || 0.7
    });
    
    this.color = params.color || '#FF5722';
    this.dragCoefficient = params.dragCoefficient || 0.01;
    this.spinRate = params.spin || 0;
    
    // Apply spin effect to initial velocity
    if (this.spinRate !== 0) {
      // Convert spin rate to radians and apply as perpendicular force
      const spinForce = new Vector2(-this.velocity.y, this.velocity.x)
        .normalize()
        .scale(this.spinRate * this.velocity.magnitude() * 0.1);
      
      this.velocity = this.velocity.add(spinForce);
    }
  }
  
  update(dt: number): void {
    super.update(dt);
    
    // Update rotation based on spin rate
    this.rotation += this.spinRate * dt;
    
    // Add current position to trail
    this.trailPoints.push(this.position.clone());
    
    // Limit trail length
    if (this.trailPoints.length > this.maxTrailPoints) {
      this.trailPoints.shift();
    }
    
    // Apply drag force
    const dragForce = this.velocity.clone()
      .normalize()
      .scale(-this.velocity.magnitude() * this.velocity.magnitude() * this.dragCoefficient);
    
    this.applyForce(dragForce);
  }
  
  getState(): SlapState {
    return {
      position: this.renderPosition || this.position,
      velocity: this.velocity,
      radius: this.radius,
      color: this.color,
      rotation: this.rotation,
      trailPoints: this.trailPoints.map(p => p.clone())
    };
  }
}
```

#### 3.3 Target Object

```typescript
class Target extends PhysicsObject {
  type: string;
  value: number;
  isHit: boolean = false;
  hitTime: number = 0;
  hitAnimation: number = 0;
  hitVelocity: number = 0;
  
  constructor(config: TargetConfig) {
    super({
      position: config.position,
      velocity: config.velocity || new Vector2(0, 0),
      mass: config.mass || 5,
      radius: config.radius || 30,
      restitution: config.restitution || 0.5
    });
    
    this.type = config.type || 'standard';
    this.value = config.value || 1;
  }
  
  hit(velocity: number): void {
    this.isHit = true;
    this.hitTime = performance.now();
    this.hitVelocity = velocity;
    
    // Apply hit force
    const hitForce = this.velocity.normalize().scale(velocity * 0.5);
    this.velocity = hitForce;
  }
  
  update(dt: number): void {
    super.update(dt);
    
    // Update hit animation
    if (this.isHit) {
      const elapsed = (performance.now() - this.hitTime) / 1000;
      this.hitAnimation = Math.min(1, elapsed * 2);
      
      // Apply damping to velocity
      this.velocity = this.velocity.scale(0.95);
    }
  }
  
  getState(): TargetState {
    return {
      position: this.renderPosition || this.position,
      velocity: this.velocity,
      radius: this.radius,
      type: this.type,
      isHit: this.isHit,
      hitAnimation: this.hitAnimation
    };
  }
}
```

#### 3.4 Obstacle Object

```typescript
class Obstacle extends PhysicsObject {
  type: string;
  isStatic: boolean;
  
  constructor(config: ObstacleConfig) {
    super({
      position: config.position,
      velocity: config.velocity || new Vector2(0, 0),
      mass: config.mass || 10,
      radius: config.radius || 40,
      restitution: config.restitution || 0.2
    });
    
    this.type = config.type || 'wall';
    this.isStatic = config.isStatic !== undefined ? config.isStatic : true;
  }
  
  update(dt: number): void {
    if (this.isStatic) {
      // Static obstacles don't move
      return;
    }
    
    super.update(dt);
  }
  
  getState(): ObstacleState {
    return {
      position: this.renderPosition || this.position,
      velocity: this.velocity,
      radius: this.radius,
      type: this.type
    };
  }
}
```

### 4. Special Effects

```typescript
class HitEffect {
  position: Vector2;
  startTime: number;
  duration: number = 0.5; // seconds
  isFinished: boolean = false;
  scale: number = 0;
  opacity: number = 1;
  
  constructor(position: Vector2) {
    this.position = position.clone();
    this.startTime = performance.now() / 1000;
  }
  
  update(dt: number): void {
    const elapsed = (performance.now() / 1000) - this.startTime;
    const progress = Math.min(1, elapsed / this.duration);
    
    // Update effect properties based on progress
    this.scale = progress * 2;
    this.opacity = 1 - progress;
    
    // Mark as finished when duration is exceeded
    if (progress >= 1) {
      this.isFinished = true;
    }
  }
  
  getState(): EffectState {
    return {
      position: this.position,
      type: 'hit',
      scale: this.scale,
      opacity: this.opacity
    };
  }
}
```

## Slap Mechanics Implementation

### 1. Slap Parameters

```typescript
interface SlapParams {
  startX: number;        // Starting X position
  startY: number;        // Starting Y position
  force: number;         // Initial force (0-100)
  angle: number;         // Launch angle in degrees (0-90)
  spin: number;          // Spin effect (-10 to 10)
  size?: number;         // Slap size/radius
  mass?: number;         // Slap mass
  color?: string;        // Visual color
  restitution?: number;  // Bounciness (0-1)
  dragCoefficient?: number; // Air resistance
}
```

### 2. Slap Input Controls

#### 2.1 Touch-Based Input

```typescript
class SlapInputController {
  private startPosition: Vector2 | null = null;
  private currentPosition: Vector2 | null = null;
  private startTime: number = 0;
  private isCharging: boolean = false;
  private maxForce: number = 100;
  private maxChargeTime: number = 2000; // ms
  
  constructor(
    private canvas: HTMLCanvasElement,
    private onSlapLaunched: (params: SlapParams) => void
  ) {
    // Touch events
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // Mouse events (for desktop testing)
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }
  
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const touch = event.touches[0];
    this.startCharging(touch.clientX, touch.clientY);
  }
  
  private handleTouchMove(event: TouchEvent): void {
    if (!this.isCharging) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.updateCharging(touch.clientX, touch.clientY);
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isCharging) return;
    event.preventDefault();
    this.releaseSlap();
  }
  
  private handleMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.startCharging(event.clientX, event.clientY);
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isCharging) return;
    event.preventDefault();
    this.updateCharging(event.clientX, event.clientY);
  }
  
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isCharging) return;
    event.preventDefault();
    this.releaseSlap();
  }
  
  private startCharging(x: number, y: number): void {
    this.startPosition = new Vector2(x, y);
    this.currentPosition = new Vector2(x, y);
    this.startTime = performance.now();
    this.isCharging = true;
  }
  
  private updateCharging(x: number, y: number): void {
    if (!this.isCharging) return;
    this.currentPosition = new Vector2(x, y);
  }
  
  private releaseSlap(): void {
    if (!this.startPosition || !this.currentPosition) return;
    
    // Calculate force based on charge time
    const chargeTime = Math.min(performance.now() - this.startTime, this.maxChargeTime);
    const forcePercent = chargeTime / this.maxChargeTime;
    const force = forcePercent * this.maxForce;
    
    // Calculate angle based on drag direction
    const dx = this.startPosition.x - this.currentPosition.x;
    const dy = this.startPosition.y - this.currentPosition.y;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Normalize angle to 0-90 degrees (first quadrant only)
    if (angle < 0) angle += 360;
    if (angle > 90) angle = 90;
    
    // Calculate spin based on horizontal drag component
    const spin = dx * 0.05;
    
    // Create slap parameters
    const slapParams: SlapParams = {
      startX: this.startPosition.x,
      startY: this.startPosition.y,
      force,
      angle,
      spin,
      size: 20,
      color: this.getSlapColor(force)
    };
    
    // Launch the slap
    this.onSlapLaunched(slapParams);
    
    // Reset state
    this.isCharging = false;
    this.startPosition = null;
    this.currentPosition = null;
  }
  
  // Get color based on force (for visual feedback)
  private getSlapColor(force: number): string {
    // Interpolate color from blue (low force) to red (high force)
    const r = Math.floor(255 * (force / this.maxForce));
    const b = Math.floor(255 * (1 - force / this.maxForce));
    return `rgb(${r}, 100, ${b})`;
  }
  
  // Get current charging state for rendering
  getChargingState(): ChargingState | null {
    if (!this.isCharging || !this.startPosition || !this.currentPosition) {
      return null;
    }
    
    const chargeTime = Math.min(performance.now() - this.startTime, this.maxChargeTime);
    const forcePercent = chargeTime / this.maxChargeTime;
    
    return {
      startPosition: this.startPosition,
      currentPosition: this.currentPosition,
      forcePercent,
      angle: Math.atan2(
        this.startPosition.y - this.currentPosition.y,
        this.startPosition.x - this.currentPosition.x
      ) * 180 / Math.PI
    };
  }
}
```

#### 2.2 Alternative Control Scheme (Button-Based)

```typescript
class ButtonSlapController {
  private isCharging: boolean = false;
  private startTime: number = 0;
  private maxForce: number = 100;
  private maxChargeTime: number = 2000; // ms
  private angle: number = 45; // Default angle
  private spin: number = 0;
  
  constructor(
    private chargeButton: HTMLElement,
    private angleSlider: HTMLInputElement,
    private spinSlider: HTMLInputElement,
    private onSlapLaunched: (params: SlapParams) => void,
    private startPosition: { x: number, y: number }
  ) {
    // Set up charge button
    chargeButton.addEventListener('mousedown', this.startCharging.bind(this));
    chargeButton.addEventListener('touchstart', this.startCharging.bind(this));
    chargeButton.addEventListener('mouseup', this.releaseSlap.bind(this));
    chargeButton.addEventListener('touchend', this.releaseSlap.bind(this));
    
    // Set up angle slider
    angleSlider.addEventListener('input', () => {
      this.angle = parseFloat(angleSlider.value);
    });
    
    // Set up spin slider
    spinSlider.addEventListener('input', () => {
      this.spin = parseFloat(spinSlider.value);
    });
    
    // Initialize sliders
    angleSlider.value = this.angle.toString();
    spinSlider.value = this.spin.toString();
  }
  
  private startCharging(event: Event): void {
    event.preventDefault();
    this.startTime = performance.now();
    this.isCharging = true;
    
    // Start visual feedback (e.g., button pulsing animation)
    this.chargeButton.classList.add('charging');
    
    // Start charge animation
    this.animateCharging();
  }
  
  private animateCharging(): void {
    if (!this.isCharging) return;
    
    const chargeTime = Math.min(performance.now() - this.startTime, this.maxChargeTime);
    const forcePercent = chargeTime / this.maxChargeTime;
    
    // Update visual feedback
    this.chargeButton.style.transform = `scale(${1 + forcePercent * 0.2})`;
    
    // Continue animation
    requestAnimationFrame(this.animateCharging.bind(this));
  }
  
  private releaseSlap(event: Event): void {
    if (!this.isCharging) return;
    event.preventDefault();
    
    // Calculate force based on charge time
    const chargeTime = Math.min(performance.now() - this.startTime, this.maxChargeTime);
    const forcePercent = chargeTime / this.maxChargeTime;
    const force = forcePercent * this.maxForce;
    
    // Create slap parameters
    const slapParams: SlapParams = {
      startX: this.startPosition.x,
      startY: this.startPosition.y,
      force,
      angle: this.angle,
      spin: this.spin,
      size: 20,
      color: this.getSlapColor(force)
    };
    
    // Launch the slap
    this.onSlapLaunched(slapParams);
    
    // Reset state
    this.isCharging = false;
    this.chargeButton.classList.remove('charging');
    this.chargeButton.style.transform = 'scale(1)';
  }
  
  // Get color based on force (for visual feedback)
  private getSlapColor(force: number): string {
    // Interpolate color from blue (low force) to red (high force)
    const r = Math.floor(255 * (force / this.maxForce));
    const b = Math.floor(255 * (1 - force / this.maxForce));
    return `rgb(${r}, 100, ${b})`;
  }
  
  // Get current charging state for rendering
  getChargingState(): ChargingState | null {
    if (!this.isCharging) {
      return null;
    }
    
    const chargeTime = Math.min(performance.now() - this.startTime, this.maxChargeTime);
    const forcePercent = chargeTime / this.maxChargeTime;
    
    return {
      forcePercent,
      angle: this.angle,
      spin: this.spin
    };
  }
}
```

### 3. Trajectory Prediction

```typescript
class TrajectoryPredictor {
  private maxSteps: number = 100;
  private timeStep: number = 1/30; // 30 steps per second
  
  constructor(private world: SlapWorld) {}
  
  // Predict trajectory based on slap parameters
  predictTrajectory(params: SlapParams): Vector2[] {
    // Create a temporary slap for simulation
    const slap = new Slap(params);
    
    // Create a copy of the world for simulation
    const worldCopy = this.world.clone();
    
    // Array to store trajectory points
    const trajectory: Vector2[] = [slap.position.clone()];
    
    // Simulate slap movement
    for (let i = 0; i < this.maxSteps; i++) {
      // Apply gravity
      slap.applyForce(worldCopy.gravity.scale(slap.mass));
      
      // Apply wind force
      slap.applyForce(worldCopy.windForce.scale(slap.dragCoefficient));
      
      // Update slap position
      slap.update(this.timeStep);
      
      // Add point to trajectory
      trajectory.push(slap.position.clone());
      
      // Check for collisions with world boundaries
      const collision = worldCopy.checkBoundaryCollisions(slap);
      
      // Check for collisions with obstacles
      const obstacleCollision = worldCopy.checkObstacleCollisions(slap);
      
      // Check for collisions with targets
      const targetCollision = worldCopy.checkTargetCollisions(slap);
      
      // Stop simulation if slap is dead or hit something
      if (slap.isDead || collision || obstacleCollision || targetCollision) {
        break;
      }
    }
    
    return trajectory;
  }
  
  // Get a simplified trajectory for rendering (fewer points)
  getSimplifiedTrajectory(params: SlapParams, pointCount: number = 10): Vector2[] {
    const fullTrajectory = this.predictTrajectory(params);
    
    // If trajectory is shorter than requested point count, return as is
    if (fullTrajectory.length <= pointCount) {
      return fullTrajectory;
    }
    
    // Sample points evenly from the full trajectory
    const simplified: Vector2[] = [];
    const step = fullTrajectory.length / pointCount;
    
    for (let i = 0; i < pointCount; i++) {
      const index = Math.min(Math.floor(i * step), fullTrajectory.length - 1);
      simplified.push(fullTrajectory[index]);
    }
    
    // Always include the last point
    simplified.push(fullTrajectory[fullTrajectory.length - 1]);
    
    return simplified;
  }
}
```

## Rendering System

### 1. Canvas Renderer

```typescript
class SlapRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Set up canvas for high DPI displays
    this.setupHiDPI();
  }
  
  // Set up canvas for high DPI displays
  private setupHiDPI(): void {
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas dimensions
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    
    // Scale canvas CSS dimensions
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    
    // Scale context
    this.ctx.scale(dpr, dpr);
  }
  
  // Clear the canvas
  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  
  // Render the world state
  renderWorld(state: WorldState): void {
    this.clear();
    
    // Render background
    this.renderBackground();
    
    // Render obstacles
    state.obstacles.forEach(obstacle => this.renderObstacle(obstacle));
    
    // Render targets
    state.targets.forEach(target => this.renderTarget(target));
    
    // Render effects
    state.effects.forEach(effect => this.renderEffect(effect));
    
    // Render slaps
    state.slaps.forEach(slap => this.renderSlap(slap));
  }
  
  // Render background
  private renderBackground(): void {
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw grid lines
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= this.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= this.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }
  
  // Render a slap
  private renderSlap(slap: SlapState): void {
    const { position, radius, color, rotation, trailPoints } = slap;
    
    // Render trail
    if (trailPoints && trailPoints.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(trailPoints[0].x, trailPoints[0].y);
      
      for (let i = 1; i < trailPoints.length; i++) {
        this.ctx.lineTo(trailPoints[i].x, trailPoints[i].y);
      }
      
      this.ctx.strokeStyle = color + '80'; // Add transparency
      this.ctx.lineWidth = radius * 0.5;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();
    }
    
    // Render slap
    this.ctx.save();
    this.ctx.translate(position.x, position.y);
    this.ctx.rotate(rotation);
    
    // Draw slap circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    
    // Draw direction indicator
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(radius, 0);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  // Render a target
  private renderTarget(target: TargetState): void {
    const { position, radius, type, isHit, hitAnimation } = target;
    
    this.ctx.save();
    this.ctx.translate(position.x, position.y);
    
    // Apply hit animation
    if (isHit) {
      const scale = 1 + hitAnimation * 0.3;
      this.ctx.scale(scale, scale);
      this.ctx.globalAlpha = 1 - hitAnimation * 0.8;
    }
    
    // Draw target based on type
    switch (type) {
      case 'standard':
        this.renderStandardTarget(radius);
        break;
      case 'bonus':
        this.renderBonusTarget(radius);
        break;
      case 'special':
        this.renderSpecialTarget(radius);
        break;
      default:
        this.renderStandardTarget(radius);
    }
    
    this.ctx.restore();
  }
  
  // Render a standard target
  private renderStandardTarget(radius: number): void {
    // Draw outer circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fill();
    
    // Draw inner circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    this.ctx.fillStyle = '#8BC34A';
    this.ctx.fill();
    
    // Draw center
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = '#CDDC39';
    this.ctx.fill();
  }
  
  // Render a bonus target
  private renderBonusTarget(radius: number): void {
    // Draw outer circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFC107';
    this.ctx.fill();
    
    // Draw inner circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FF9800';
    this.ctx.fill();
    
    // Draw center
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FF5722';
    this.ctx.fill();
    
    // Draw star
    this.ctx.beginPath();
    const spikes = 5;
    const outerRadius = radius * 0.9;
    const innerRadius = radius * 0.4;
    
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * 2 * i) / (spikes * 2);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.closePath();
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
  
  // Render a special target
  private renderSpecialTarget(radius: number): void {
    // Draw outer circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#9C27B0';
    this.ctx.fill();
    
    // Draw inner circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    this.ctx.fillStyle = '#673AB7';
    this.ctx.fill();
    
    // Draw center
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = '#3F51B5';
    this.ctx.fill();
    
    // Draw glowing effect
    const gradient = this.ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 1.2);
    gradient.addColorStop(0, 'rgba(156, 39, 176, 0.5)');
    gradient.addColorStop(1, 'rgba(156, 39, 176, 0)');
    
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }
  
  // Render an obstacle
  private renderObstacle(obstacle: ObstacleState): void {
    const { position, radius, type } = obstacle;
    
    this.ctx.save();
    this.ctx.translate(position.x, position.y);
    
    // Draw obstacle based on type
    switch (type) {
      case 'wall':
        this.renderWallObstacle(radius);
        break;
      case 'bumper':
        this.renderBumperObstacle(radius);
        break;
      default:
        this.renderWallObstacle(radius);
    }
    
    this.ctx.restore();
  }
  
  // Render a wall obstacle
  private renderWallObstacle(radius: number): void {
    // Draw square
    this.ctx.fillStyle = '#607D8B';
    this.ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    
    // Draw border
    this.ctx.strokeStyle = '#455A64';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-radius, -radius, radius * 2, radius * 2);
  }
  
  // Render a bumper obstacle
  private renderBumperObstacle(radius: number): void {
    // Draw circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#F44336';
    this.ctx.fill();
    
    // Draw border
    this.ctx.strokeStyle = '#B71C1C';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Draw inner circle
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    this.ctx.fillStyle = '#E57373';
    this.ctx.fill();
  }
  
  // Render an effect
  private renderEffect(effect: EffectState): void {
    const { position, type, scale, opacity } = effect;
    
    this.ctx.save();
    this.ctx.translate(position.x, position.y);
    this.ctx.globalAlpha = opacity;
    
    // Draw effect based on type
    switch (type) {
      case 'hit':
        this.renderHitEffect(scale);
        break;
      default:
        this.renderHitEffect(scale);
    }
    
    this.ctx.restore();
  }
  
  // Render a hit effect
  private renderHitEffect(scale: number): void {
    const radius = 30 * scale;
    
    // Draw outer circle
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
    
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Draw lines
    const lineCount = 8;
    const lineLength = radius * 1.5;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i < lineCount; i++) {
      const angle = (Math.PI * 2 * i) / lineCount;
      const x = Math.cos(angle) * lineLength;
      const y = Math.sin(angle) * lineLength;
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }
  }
  
  // Render charging state
  renderChargingState(state: ChargingState): void {
    if (!state) return;
    
    const { startPosition, currentPosition, forcePercent, angle } = state;
    
    // Draw line from start to current position
    if (startPosition && currentPosition) {
      this.ctx.beginPath();
      this.ctx.moveTo(startPosition.x, startPosition.y);
      this.ctx.lineTo(currentPosition.x, currentPosition.y);
      this.ctx.strokeStyle = '#333333';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Draw arrow at start position
      const arrowLength = 50 * forcePercent;
      const arrowAngle = angle * Math.PI / 180;
      const arrowX = startPosition.x + Math.cos(arrowAngle) * arrowLength;
      const arrowY = startPosition.y + Math.sin(arrowAngle) * arrowLength;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startPosition.x, startPosition.y);
      this.ctx.lineTo(arrowX, arrowY);
      this.ctx.strokeStyle = '#FF5722';
      this.ctx.lineWidth = 4;
      this.ctx.stroke();
      
      // Draw arrowhead
      const headLength = 15;
      const headAngle = 0.5;
      
      this.ctx.beginPath();
      this.ctx.moveTo(arrowX, arrowY);
      this.ctx.lineTo(
        arrowX - headLength * Math.cos(arrowAngle - headAngle),
        arrowY - headLength * Math.sin(arrowAngle - headAngle)
      );
      this.ctx.lineTo(
        arrowX - headLength * Math.cos(arrowAngle + headAngle),
        arrowY - headLength * Math.sin(arrowAngle + headAngle)
      );
      this.ctx.closePath();
      this.ctx.fillStyle = '#FF5722';
      this.ctx.fill();
    }
    
    // Draw force meter
    const meterWidth = 200;
    const meterHeight = 20;
    const meterX = this.width / 2 - meterWidth / 2;
    const meterY = this.height - 50;
    
    // Draw background
    this.ctx.fillStyle = '#EEEEEE';
    this.ctx.fillRect(meterX, meterY, meterWidth, meterHeight);
    
    // Draw filled portion
    this.ctx.fillStyle = this.getForceColor(forcePercent);
    this.ctx.fillRect(meterX, meterY, meterWidth * forcePercent, meterHeight);
    
    // Draw border
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);
    
    // Draw force text
    this.ctx.fillStyle = '#333333';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Force: ${Math.round(forcePercent * 100)}%`,
      meterX + meterWidth / 2,
      meterY - 10
    );
  }
  
  // Get color based on force percentage
  private getForceColor(forcePercent: number): string {
    // Interpolate color from blue (low force) to red (high force)
    const r = Math.floor(255 * forcePercent);
    const g = Math.floor(255 * (1 - Math.abs(forcePercent - 0.5) * 2));
    const b = Math.floor(255 * (1 - forcePercent));
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Render trajectory prediction
  renderTrajectory(points: Vector2[]): void {
    if (!points || points.length < 2) return;
    
    // Draw trajectory line
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Draw points
    for (let i = 0; i < points.length; i += Math.max(1, Math.floor(points.length / 10))) {
      this.ctx.beginPath();
      this.ctx.arc(points[i].x, points[i].y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      this.ctx.fill();
    }
    
    // Draw end point
    const lastPoint = points[points.length - 1];
    this.ctx.beginPath();
    this.ctx.arc(lastPoint.x, lastPoint.y, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    this.ctx.fill();
  }
}
```

### 2. Particle Effects System

```typescript
class ParticleSystem {
  private particles: Particle[] = [];
  
  constructor(private ctx: CanvasRenderingContext2D) {}
  
  // Create a hit effect at the given position
  createHitEffect(position: Vector2, color: string = '#FFEB3B'): void {
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const size = 2 + Math.random() * 4;
      const lifetime = 0.5 + Math.random() * 0.5; // seconds
      
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );
      
      this.particles.push(new Particle(
        position.clone(),
        velocity,
        size,
        color,
        lifetime
      ));
    }
  }
  
  // Create a trail effect at the given position
  createTrailEffect(position: Vector2, velocity: Vector2, color: string = '#FF9800'): void {
    const particleCount = 3;
    
    for (let i = 0; i < particleCount; i++) {
      // Calculate perpendicular direction to velocity
      const perpAngle = Math.atan2(velocity.y, velocity.x) + (Math.PI / 2);
      const randomOffset = (Math.random() - 0.5) * 10;
      
      const particlePos = new Vector2(
        position.x + Math.cos(perpAngle) * randomOffset,
        position.y + Math.sin(perpAngle) * randomOffset
      );
      
      // Slow down particle compared to slap
      const particleVel = velocity.scale(-0.1);
      
      const size = 1 + Math.random() * 3;
      const lifetime = 0.2 + Math.random() * 0.3; // seconds
      
      this.particles.push(new Particle(
        particlePos,
        particleVel,
        size,
        color,
        lifetime
      ));
    }
  }
  
  // Update all particles
  update(dt: number): void {
    // Update existing particles
    this.particles = this.particles.filter(particle => {
      particle.update(dt);
      return !particle.isDead;
    });
  }
  
  // Render all particles
  render(): void {
    for (const particle of this.particles) {
      particle.render(this.ctx);
    }
  }
}

class Particle {
  position: Vector2;
  velocity: Vector2;
  size: number;
  color: string;
  lifetime: number;
  age: number = 0;
  isDead: boolean = false;
  
  constructor(
    position: Vector2,
    velocity: Vector2,
    size: number,
    color: string,
    lifetime: number
  ) {
    this.position = position;
    this.velocity = velocity;
    this.size = size;
    this.color = color;
    this.lifetime = lifetime;
  }
  
  update(dt: number): void {
    // Update position
    this.position = this.position.add(this.velocity.scale(dt));
    
    // Apply drag
    this.velocity = this.velocity.scale(0.95);
    
    // Update age
    this.age += dt;
    
    // Check if particle should die
    if (this.age >= this.lifetime) {
      this.isDead = true;
    }
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // Calculate opacity based on age
    const opacity = 1 - (this.age / this.lifetime);
    
    // Calculate size based on age
    const currentSize = this.size * (1 - (this.age / this.lifetime) * 0.5);
    
    // Draw particle
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, currentSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
    ctx.fill();
  }
}
```

## Scoring and Rewards System

### 1. Score Calculation

```typescript
class ScoringSystem {
  private basePoints: number = 10;
  private comboMultiplier: number = 0.1; // 10% increase per combo
  private comboCount: number = 0;
  private comboTimeout: number | null = null;
  private comboResetTime: number = 2000; // ms
  private currentScore: number = 0;
  private highScore: number = 0;
  
  constructor(private onScoreUpdate: (score: number, combo: number) => void) {
    // Load high score from storage
    this.loadHighScore();
  }
  
  // Calculate score for a target hit
  calculateScore(hitData: HitData): number {
    // Base score from velocity and target value
    let score = hitData.velocity * this.basePoints * hitData.targetValue;
    
    // Apply combo multiplier
    if (this.comboCount > 0) {
      score *= (1 + (this.comboCount * this.comboMultiplier));
    }
    
    // Apply arena multiplier
    score *= hitData.arenaMultiplier;
    
    // Apply any special modifiers
    hitData.specialModifiers.forEach(modifier => {
      score *= modifier.value;
    });
    
    // Round to integer
    score = Math.round(score);
    
    // Update combo
    this.updateCombo();
    
    // Update current score
    this.currentScore += score;
    
    // Check for high score
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      this.saveHighScore();
    }
    
    // Notify listeners
    this.onScoreUpdate(this.currentScore, this.comboCount);
    
    return score;
  }
  
  // Update combo counter
  private updateCombo(): void {
    // Increment combo count
    this.comboCount++;
    
    // Clear existing timeout
    if (this.comboTimeout !== null) {
      clearTimeout(this.comboTimeout);
    }
    
    // Set new timeout
    this.comboTimeout = window.setTimeout(() => {
      this.comboCount = 0;
      this.onScoreUpdate(this.currentScore, this.comboCount);
    }, this.comboResetTime);
  }
  
  // Reset score for new game
  resetScore(): void {
    this.currentScore = 0;
    this.comboCount = 0;
    
    if (this.comboTimeout !== null) {
      clearTimeout(this.comboTimeout);
      this.comboTimeout = null;
    }
    
    this.onScoreUpdate(this.currentScore, this.comboCount);
  }
  
  // Get current score
  getCurrentScore(): number {
    return this.currentScore;
  }
  
  // Get high score
  getHighScore(): number {
    return this.highScore;
  }
  
  // Save high score to local storage
  private saveHighScore(): void {
    try {
      localStorage.setItem('noGasSlaps_highScore', this.highScore.toString());
    } catch (e) {
      console.error('Failed to save high score:', e);
    }
  }
  
  // Load high score from local storage
  private loadHighScore(): void {
    try {
      const storedScore = localStorage.getItem('noGasSlaps_highScore');
      if (storedScore) {
        this.highScore = parseInt(storedScore, 10);
      }
    } catch (e) {
      console.error('Failed to load high score:', e);
    }
  }
}

interface HitData {
  velocity: number;
  targetValue: number;
  arenaMultiplier: number;
  specialModifiers: {
    name: string;
    value: number;
  }[];
}
```

### 2. Reward Distribution

```typescript
class RewardSystem {
  private xpPerPoint: number = 0.1;
  private tokenThreshold: number = 1000; // Score needed for token reward
  private tokenPerThreshold: number = 1; // Tokens awarded per threshold
  private relicChance: number = 0.05; // 5% chance per game
  private relicRarityDistribution: { [key: string]: number } = {
    common: 0.6,
    uncommon: 0.25,
    rare: 0.1,
    epic: 0.04,
    legendary: 0.01
  };
  
  constructor(
    private blockchainService: BlockchainService,
    private userProfileService: UserProfileService
  ) {}
  
  // Calculate rewards based on score
  calculateRewards(score: number, arenaId: string): GameRewards {
    const rewards: GameRewards = {
      xp: Math.round(score * this.xpPerPoint),
      tokens: Math.floor(score / this.tokenThreshold) * this.tokenPerThreshold,
      relics: []
    };
    
    // Check for relic reward
    if (Math.random() < this.relicChance) {
      const relic = this.generateRelic(arenaId);
      rewards.relics.push(relic);
    }
    
    return rewards;
  }
  
  // Generate a random relic
  private generateRelic(arenaId: string): RelicReward {
    // Determine rarity
    const rarity = this.determineRelicRarity();
    
    // Get relic pool for this arena and rarity
    const relicPool = this.getRelicPool(arenaId, rarity);
    
    // Select random relic from pool
    const relic = relicPool[Math.floor(Math.random() * relicPool.length)];
    
    return {
      id: relic.id,
      name: relic.name,
      description: relic.description,
      rarity,
      type: relic.type,
      effects: relic.effects,
      isNFT: relic.isNFT
    };
  }
  
  // Determine relic rarity based on distribution
  private determineRelicRarity(): string {
    const rand = Math.random();
    let cumulativeProbability = 0;
    
    for (const [rarity, probability] of Object.entries(this.relicRarityDistribution)) {
      cumulativeProbability += probability;
      
      if (rand <= cumulativeProbability) {
        return rarity;
      }
    }
    
    // Default to common if something goes wrong
    return 'common';
  }
  
  // Get relic pool for arena and rarity
  private getRelicPool(arenaId: string, rarity: string): RelicTemplate[] {
    // This would typically come from a database or configuration
    // For now, we'll use a simple mapping
    
    const relicPools: { [key: string]: { [key: string]: RelicTemplate[] } } = {
      'arena1': {
        'common': [
          {
            id: 'force_boost_1',
            name: 'Force Amplifier I',
            description: 'Increases slap force by 10%',
            type: 'passive',
            effects: [{ type: 'forceBoost', value: 1.1 }],
            isNFT: false
          },
          {
            id: 'precision_boost_1',
            name: 'Aim Enhancer I',
            description: 'Increases slap precision by 10%',
            type: 'passive',
            effects: [{ type: 'precisionBoost', value: 1.1 }],
            isNFT: false
          }
        ],
        'rare': [
          {
            id: 'combo_master_1',
            name: 'Combo Master I',
            description: 'Increases combo multiplier by 20%',
            type: 'passive',
            effects: [{ type: 'comboMultiplier', value: 1.2 }],
            isNFT: true
          }
        ]
      }
    };
    
    // Get pool for arena and rarity, or default pool if not found
    return relicPools[arenaId]?.[rarity] || [
      {
        id: 'default_relic',
        name: 'Mystery Relic',
        description: 'A mysterious relic with unknown powers',
        type: 'passive',
        effects: [{ type: 'scoreMultiplier', value: 1.05 }],
        isNFT: false
      }
    ];
  }
  
  // Distribute rewards to user
  async distributeRewards(userId: string, rewards: GameRewards): Promise<void> {
    try {
      // Add XP to user profile
      await this.userProfileService.addXP(userId, rewards.xp);
      
      // Add tokens if any
      if (rewards.tokens > 0) {
        await this.distributeTokens(userId, rewards.tokens);
      }
      
      // Add relics if any
      for (const relic of rewards.relics) {
        await this.distributeRelic(userId, relic);
      }
    } catch (error) {
      console.error('Failed to distribute rewards:', error);
      throw error;
    }
  }
  
  // Distribute tokens to user
  private async distributeTokens(userId: string, amount: number): Promise<void> {
    // Check if user has connected wallet
    const walletAddress = await this.userProfileService.getWalletAddress(userId);
    
    if (walletAddress) {
      // Distribute tokens via blockchain
      await this.blockchainService.distributeTokens(walletAddress, amount);
    } else {
      // Store tokens for later claiming
      await this.userProfileService.addPendingTokens(userId, amount);
    }
  }
  
  // Distribute relic to user
  private async distributeRelic(userId: string, relic: RelicReward): Promise<void> {
    // Add relic to user inventory
    await this.userProfileService.addRelic(userId, relic);
    
    // If relic is NFT and user has connected wallet, mint it
    if (relic.isNFT) {
      const walletAddress = await this.userProfileService.getWalletAddress(userId);
      
      if (walletAddress) {
        // Mint NFT relic
        await this.blockchainService.mintNFTRelic(walletAddress, relic);
      } else {
        // Store NFT for later minting
        await this.userProfileService.addPendingNFT(userId, relic);
      }
    }
  }
}

interface GameRewards {
  xp: number;
  tokens: number;
  relics: RelicReward[];
}

interface RelicReward {
  id: string;
  name: string;
  description: string;
  rarity: string;
  type: string;
  effects: { type: string; value: number }[];
  isNFT: boolean;
}

interface RelicTemplate extends RelicReward {
  // Same as RelicReward
}
```

## Game Integration

### 1. Main Game Class

```typescript
class NoGasSlapsGame {
  private canvas: HTMLCanvasElement;
  private physics: SlapPhysicsEngine;
  private renderer: SlapRenderer;
  private inputController: SlapInputController;
  private trajectoryPredictor: TrajectoryPredictor;
  private particleSystem: ParticleSystem;
  private scoringSystem: ScoringSystem;
  private rewardSystem: RewardSystem;
  private gameState: GameState = GameState.MENU;
  private currentArena: Arena;
  private gameLoop: number | null = null;
  private lastFrameTime: number = 0;
  
  constructor(
    canvasId: string,
    private blockchainService: BlockchainService,
    private userProfileService: UserProfileService
  ) {
    // Get canvas
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    
    // Create renderer
    this.renderer = new SlapRenderer(this.canvas);
    
    // Create particle system
    this.particleSystem = new ParticleSystem(this.renderer.getContext());
    
    // Create scoring system
    this.scoringSystem = new ScoringSystem(this.onScoreUpdate.bind(this));
    
    // Create reward system
    this.rewardSystem = new RewardSystem(blockchainService, userProfileService);
    
    // Load initial arena
    this.currentArena = this.loadArena('arena1');
    
    // Create physics engine
    this.physics = new SlapPhysicsEngine(this.currentArena.worldConfig);
    
    // Create trajectory predictor
    this.trajectoryPredictor = new TrajectoryPredictor(this.physics.getWorld());
    
    // Create input controller
    this.inputController = new SlapInputController(
      this.canvas,
      this.onSlapLaunched.bind(this)
    );
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  // Start the game
  start(): void {
    // Reset score
    this.scoringSystem.resetScore();
    
    // Set game state
    this.gameState = GameState.PLAYING;
    
    // Start game loop
    this.lastFrameTime = performance.now();
    this.gameLoop = requestAnimationFrame(this.update.bind(this));
  }
  
  // Pause the game
  pause(): void {
    if (this.gameState === GameState.PLAYING) {
      this.gameState = GameState.PAUSED;
    }
  }
  
  // Resume the game
  resume(): void {
    if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.PLAYING;
      this.lastFrameTime = performance.now();
      this.gameLoop = requestAnimationFrame(this.update.bind(this));
    }
  }
  
  // End the game
  end(): void {
    // Cancel game loop
    if (this.gameLoop !== null) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }
    
    // Calculate rewards
    const score = this.scoringSystem.getCurrentScore();
    const rewards = this.rewardSystem.calculateRewards(score, this.currentArena.id);
    
    // Distribute rewards
    const userId = this.userProfileService.getCurrentUserId();
    if (userId) {
      this.rewardSystem.distributeRewards(userId, rewards)
        .then(() => {
          console.log('Rewards distributed successfully');
        })
        .catch(error => {
          console.error('Failed to distribute rewards:', error);
        });
    }
    
    // Show game over screen
    this.gameState = GameState.GAME_OVER;
    this.showGameOverScreen(score, rewards);
  }
  
  // Change arena
  changeArena(arenaId: string): void {
    // Load new arena
    this.currentArena = this.loadArena(arenaId);
    
    // Update physics engine
    this.physics = new SlapPhysicsEngine(this.currentArena.worldConfig);
    
    // Update trajectory predictor
    this.trajectoryPredictor = new TrajectoryPredictor(this.physics.getWorld());
    
    // Reset score
    this.scoringSystem.resetScore();
  }
  
  // Main update loop
  private update(timestamp: number): void {
    // Calculate delta time
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    
    // Skip if paused
    if (this.gameState !== GameState.PLAYING) {
      return;
    }
    
    // Update physics
    this.physics.update(timestamp);
    
    // Update particles
    this.particleSystem.update(deltaTime / 1000);
    
    // Render
    this.render();
    
    // Check for game over condition
    if (this.checkGameOver()) {
      this.end();
      return;
    }
    
    // Continue game loop
    this.gameLoop = requestAnimationFrame(this.update.bind(this));
  }
  
  // Render the game
  private render(): void {
    // Clear canvas
    this.renderer.clear();
    
    // Render world
    this.renderer.renderWorld(this.physics.getWorldState());
    
    // Render particles
    this.particleSystem.render();
    
    // Render charging state
    const chargingState = this.inputController.getChargingState();
    if (chargingState) {
      // Predict trajectory
      const slapParams: SlapParams = {
        startX: chargingState.startPosition.x,
        startY: chargingState.startPosition.y,
        force: chargingState.forcePercent * 100,
        angle: chargingState.angle,
        spin: 0
      };
      
      const trajectory = this.trajectoryPredictor.getSimplifiedTrajectory(slapParams);
      
      // Render trajectory prediction
      this.renderer.renderTrajectory(trajectory);
      
      // Render charging UI
      this.renderer.renderChargingState(chargingState);
    }
    
    // Render UI
    this.renderUI();
  }
  
  // Render UI elements
  private renderUI(): void {
    const ctx = this.renderer.getContext();
    
    // Render score
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.scoringSystem.getCurrentScore()}`, 20, 40);
    
    // Render combo
    const comboCount = this.inputController.getComboCount();
    if (comboCount > 1) {
      ctx.fillStyle = '#FF5722';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Combo: ${comboCount}x`, 20, 70);
    }
    
    // Render high score
    ctx.fillStyle = '#666666';
    ctx.font = '18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`High Score: ${this.scoringSystem.getHighScore()}`, this.canvas.width - 20, 40);
    
    // Render arena name
    ctx.fillStyle = '#333333';
    ctx.font = 'italic 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.currentArena.name, this.canvas.width / 2, 30);
  }
  
  // Handle slap launch
  private onSlapLaunched(params: SlapParams): void {
    // Apply slap
    this.physics.applySlap(params);
    
    // Create trail effect
    const velocity = new Vector2(
      params.force * Math.cos(params.angle * Math.PI / 180),
      params.force * Math.sin(params.angle * Math.PI / 180)
    );
    
    this.particleSystem.createTrailEffect(
      new Vector2(params.startX, params.startY),
      velocity,
      params.color
    );
  }
  
  // Handle score update
  private onScoreUpdate(score: number, combo: number): void {
    // Update UI
    // (handled in renderUI)
  }
  
  // Handle target hit
  private onTargetHit(target: Target, slap: Slap): void {
    // Calculate hit data
    const hitData: HitData = {
      velocity: slap.velocity.magnitude(),
      targetValue: target.value,
      arenaMultiplier: this.currentArena.scoreMultiplier,
      specialModifiers: []
    };
    
    // Calculate score
    const score = this.scoringSystem.calculateScore(hitData);
    
    // Create hit effect
    this.particleSystem.createHitEffect(target.position, target.getHitColor());
    
    // Show floating score text
    this.showFloatingScore(score, target.position);
  }
  
  // Show floating score text
  private showFloatingScore(score: number, position: Vector2): void {
    const ctx = this.renderer.getContext();
    
    // Create floating text
    const floatingText = new FloatingText(
      position,
      score.toString(),
      '#FFFFFF',
      1.0, // seconds
      new Vector2(0, -50)
    );
    
    // Add to floating texts array
    this.floatingTexts.push(floatingText);
  }
  
  // Check if game is over
  private checkGameOver(): boolean {
    // Check if all targets are hit
    const worldState = this.physics.getWorldState();
    const allTargetsHit = worldState.targets.every(target => target.isHit);
    
    // Check if no active slaps
    const noActiveSlaps = worldState.slaps.length === 0;
    
    return allTargetsHit && noActiveSlaps;
  }
  
  // Show game over screen
  private showGameOverScreen(score: number, rewards: GameRewards): void {
    // Implementation depends on UI framework
    console.log('Game Over!');
    console.log('Score:', score);
    console.log('Rewards:', rewards);
    
    // Dispatch event for UI to handle
    const gameOverEvent = new CustomEvent('gameOver', {
      detail: {
        score,
        rewards
      }
    });
    
    document.dispatchEvent(gameOverEvent);
  }
  
  // Load arena configuration
  private loadArena(arenaId: string): Arena {
    // This would typically come from a database or configuration
    // For now, we'll use a simple mapping
    
    const arenas: { [key: string]: Arena } = {
      'arena1': {
        id: 'arena1',
        name: 'Novice Grounds',
        description: 'A beginner-friendly arena with simple targets',
        worldConfig: {
          gravity: new Vector2(0, 9.8),
          bounds: { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height },
          windForce: new Vector2(0, 0),
          targets: [
            {
              position: new Vector2(this.canvas.width * 0.7, this.canvas.height * 0.3),
              radius: 30,
              type: 'standard',
              value: 1
            },
            {
              position: new Vector2(this.canvas.width * 0.8, this.canvas.height * 0.5),
              radius: 25,
              type: 'standard',
              value: 2
            },
            {
              position: new Vector2(this.canvas.width * 0.6, this.canvas.height * 0.7),
              radius: 20,
              type: 'bonus',
              value: 3
            }
          ],
          obstacles: [
            {
              position: new Vector2(this.canvas.width * 0.5, this.canvas.height * 0.5),
              radius: 40,
              type: 'wall',
              isStatic: true
            }
          ]
        },
        scoreMultiplier: 1.0,
        requiredLevel: 1
      },
      'arena2': {
        id: 'arena2',
        name: 'Glitch Valley',
        description: 'Targets occasionally teleport or glitch',
        worldConfig: {
          gravity: new Vector2(0, 9.8),
          bounds: { x: 0, y: 0, width: this.canvas.width, height: this.canvas.height },
          windForce: new Vector2(0.5, 0),
          targets: [
            {
              position: new Vector2(this.canvas.width * 0.6, this.canvas.height * 0.2),
              radius: 25,
              type: 'standard',
              value: 2
            },
            {
              position: new Vector2(this.canvas.width * 0.7, this.canvas.height * 0.4),
              radius: 20,
              type: 'bonus',
              value: 3
            },
            {
              position: new Vector2(this.canvas.width * 0.8, this.canvas.height * 0.6),
              radius: 15,
              type: 'special',
              value: 5
            }
          ],
          obstacles: [
            {
              position: new Vector2(this.canvas.width * 0.4, this.canvas.height * 0.3),
              radius: 35,
              type: 'wall',
              isStatic: true
            },
            {
              position: new Vector2(this.canvas.width * 0.5, this.canvas.height * 0.6),
              radius: 30,
              type: 'bumper',
              isStatic: false
            }
          ]
        },
        scoreMultiplier: 1.5,
        requiredLevel: 5
      }
    };
    
    return arenas[arenaId] || arenas['arena1'];
  }
  
  // Set up event listeners
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }
  
  // Handle window resize
  private handleResize(): void {
    // Resize canvas
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Update renderer
    this.renderer.resize(this.canvas.width, this.canvas.height);
    
    // Update physics bounds
    this.physics.updateBounds({
      x: 0,
      y: 0,
      width: this.canvas.width,
      height: this.canvas.height
    });
  }
}

enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER
}

interface Arena {
  id: string;
  name: string;
  description: string;
  worldConfig: WorldConfig;
  scoreMultiplier: number;
  requiredLevel: number;
}

class FloatingText {
  private opacity: number = 1;
  private scale: number = 1;
  private age: number = 0;
  private isDead: boolean = false;
  
  constructor(
    public position: Vector2,
    public text: string,
    public color: string,
    public lifetime: number,
    public velocity: Vector2
  ) {}
  
  update(dt: number): void {
    // Update position
    this.position = this.position.add(this.velocity.scale(dt));
    
    // Update age
    this.age += dt;
    
    // Update opacity and scale
    const progress = this.age / this.lifetime;
    this.opacity = 1 - progress;
    this.scale = 1 + progress * 0.5;
    
    // Check if text should die
    if (this.age >= this.lifetime) {
      this.isDead = true;
    }
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    // Set font properties
    ctx.font = `bold ${Math.floor(24 * this.scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = this.color + Math.floor(this.opacity * 255).toString(16).padStart(2, '0');
    
    // Draw text
    ctx.fillText(this.text, this.position.x, this.position.y);
    
    ctx.restore();
  }
}
```

### 2. Integration with Telegram Mini-App

```typescript
class NoGasSlapsApp {
  private game: NoGasSlapsGame | null = null;
  private telegramWebApp: any; // Telegram WebApp SDK
  private userId: string | null = null;
  private isInitialized: boolean = false;
  
  constructor(
    private canvasId: string,
    private blockchainService: BlockchainService,
    private userProfileService: UserProfileService
  ) {
    // Initialize Telegram WebApp
    this.initializeTelegramWebApp();
  }
  
  // Initialize Telegram WebApp
  private async initializeTelegramWebApp(): Promise<void> {
    try {
      // Import Telegram WebApp SDK
      const WebApp = (window as any).Telegram?.WebApp;
      
      if (!WebApp) {
        console.error('Telegram WebApp SDK not found');
        return;
      }
      
      this.telegramWebApp = WebApp;
      
      // Initialize WebApp
      this.telegramWebApp.ready();
      
      // Get user data
      const user = this.telegramWebApp.initDataUnsafe?.user;
      
      if (user) {
        // Authenticate user
        this.userId = await this.authenticateUser(user);
        
        // Initialize game
        this.initializeGame();
      } else {
        console.error('User data not available');
      }
      
      // Set up WebApp event listeners
      this.setupWebAppEventListeners();
      
      // Mark as initialized
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Telegram WebApp:', error);
    }
  }
  
  // Authenticate user
  private async authenticateUser(user: any): Promise<string> {
    try {
      // Call authentication API
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telegramId: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name
        })
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      const data = await response.json();
      
      // Set user ID in profile service
      this.userProfileService.setCurrentUserId(data.userId);
      
      return data.userId;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }
  
  // Initialize game
  private initializeGame(): void {
    if (!this.userId) {
      console.error('Cannot initialize game: User not authenticated');
      return;
    }
    
    // Create game instance
    this.game = new NoGasSlapsGame(
      this.canvasId,
      this.blockchainService,
      this.userProfileService
    );
    
    // Set up game event listeners
    this.setupGameEventListeners();
    
    // Show main menu
    this.showMainMenu();
  }
  
  // Set up WebApp event listeners
  private setupWebAppEventListeners(): void {
    // Handle back button
    this.telegramWebApp.BackButton.onClick(() => {
      this.handleBackButton();
    });
    
    // Handle main button
    this.telegramWebApp.MainButton.onClick(() => {
      this.handleMainButton();
    });
    
    // Handle viewport changes
    this.telegramWebApp.onEvent('viewportChanged', () => {
      this.handleViewportChange();
    });
  }
  
  // Set up game event listeners
  private setupGameEventListeners(): void {
    // Handle game over
    document.addEventListener('gameOver', (event: CustomEvent) => {
      this.handleGameOver(event.detail);
    });
  }
  
  // Show main menu
  private showMainMenu(): void {
    // Hide back button
    this.telegramWebApp.BackButton.hide();
    
    // Show main button
    this.telegramWebApp.MainButton.setText('PLAY NOW');
    this.telegramWebApp.MainButton.show();
    
    // Set main button callback
    this.mainButtonAction = () => {
      this.startGame();
    };
    
    // Show menu UI
    this.showMenuUI();
  }
  
  // Show menu UI
  private showMenuUI(): void {
    // Implementation depends on UI framework
    const menuElement = document.getElementById('menu');
    const gameElement = document.getElementById('game');
    const gameOverElement = document.getElementById('gameOver');
    
    if (menuElement && gameElement && gameOverElement) {
      menuElement.style.display = 'block';
      gameElement.style.display = 'none';
      gameOverElement.style.display = 'none';
    }
  }
  
  // Start game
  private startGame(): void {
    if (!this.game) {
      console.error('Cannot start game: Game not initialized');
      return;
    }
    
    // Hide main button
    this.telegramWebApp.MainButton.hide();
    
    // Show back button
    this.telegramWebApp.BackButton.show();
    
    // Set back button action
    this.backButtonAction = () => {
      this.pauseGame();
    };
    
    // Show game UI
    this.showGameUI();
    
    // Start game
    this.game.start();
  }
  
  // Show game UI
  private showGameUI(): void {
    // Implementation depends on UI framework
    const menuElement = document.getElementById('menu');
    const gameElement = document.getElementById('game');
    const gameOverElement = document.getElementById('gameOver');
    
    if (menuElement && gameElement && gameOverElement) {
      menuElement.style.display = 'none';
      gameElement.style.display = 'block';
      gameOverElement.style.display = 'none';
    }
  }
  
  // Pause game
  private pauseGame(): void {
    if (!this.game) return;
    
    // Pause game
    this.game.pause();
    
    // Show pause menu
    this.showPauseMenu();
  }
  
  // Show pause menu
  private showPauseMenu(): void {
    // Show main button
    this.telegramWebApp.MainButton.setText('RESUME');
    this.telegramWebApp.MainButton.show();
    
    // Set main button action
    this.mainButtonAction = () => {
      this.resumeGame();
    };
    
    // Show pause UI
    this.showPauseUI();
  }
  
  // Show pause UI
  private showPauseUI(): void {
    // Implementation depends on UI framework
    const pauseElement = document.getElementById('pause');
    
    if (pauseElement) {
      pauseElement.style.display = 'block';
    }
  }
  
  // Resume game
  private resumeGame(): void {
    if (!this.game) return;
    
    // Hide main button
    this.telegramWebApp.MainButton.hide();
    
    // Hide pause UI
    this.hidePauseUI();
    
    // Resume game
    this.game.resume();
  }
  
  // Hide pause UI
  private hidePauseUI(): void {
    // Implementation depends on UI framework
    const pauseElement = document.getElementById('pause');
    
    if (pauseElement) {
      pauseElement.style.display = 'none';
    }
  }
  
  // Handle game over
  private handleGameOver(data: { score: number, rewards: GameRewards }): void {
    // Show game over UI
    this.showGameOverUI(data);
    
    // Show main button
    this.telegramWebApp.MainButton.setText('PLAY AGAIN');
    this.telegramWebApp.MainButton.show();
    
    // Set main button action
    this.mainButtonAction = () => {
      this.startGame();
    };
    
    // Set back button action
    this.backButtonAction = () => {
      this.showMainMenu();
    };
  }
  
  // Show game over UI
  private showGameOverUI(data: { score: number, rewards: GameRewards }): void {
    // Implementation depends on UI framework
    const menuElement = document.getElementById('menu');
    const gameElement = document.getElementById('game');
    const gameOverElement = document.getElementById('gameOver');
    
    if (menuElement && gameElement && gameOverElement) {
      menuElement.style.display = 'none';
      gameElement.style.display = 'none';
      gameOverElement.style.display = 'block';
    }
    
    // Populate game over UI with data
    const scoreElement = document.getElementById('finalScore');
    const xpElement = document.getElementById('earnedXP');
    const tokensElement = document.getElementById('earnedTokens');
    const relicsElement = document.getElementById('earnedRelics');
    
    if (scoreElement) {
      scoreElement.textContent = data.score.toString();
    }
    
    if (xpElement) {
      xpElement.textContent = data.rewards.xp.toString();
    }
    
    if (tokensElement) {
      tokensElement.textContent = data.rewards.tokens.toString();
    }
    
    if (relicsElement) {
      relicsElement.innerHTML = '';
      
      data.rewards.relics.forEach(relic => {
        const relicElement = document.createElement('div');
        relicElement.className = `relic ${relic.rarity}`;
        relicElement.innerHTML = `
          <h3>${relic.name}</h3>
          <p>${relic.description}</p>
          ${relic.isNFT ? '<span class="nft-badge">NFT</span>' : ''}
        `;
        
        relicsElement.appendChild(relicElement);
      });
    }
  }
  
  // Handle back button
  private handleBackButton(): void {
    if (this.backButtonAction) {
      this.backButtonAction();
    }
  }
  
  // Handle main button
  private handleMainButton(): void {
    if (this.mainButtonAction) {
      this.mainButtonAction();
    }
  }
  
  // Handle viewport change
  private handleViewportChange(): void {
    // Resize game canvas if needed
    if (this.game) {
      const canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
      
      if (canvas) {
        canvas.width = this.telegramWebApp.viewportStableWidth;
        canvas.height = this.telegramWebApp.viewportHeight;
      }
    }
  }
  
  // Variables to store button actions
  private backButtonAction: (() => void) | null = null;
  private mainButtonAction: (() => void) | null = null;
}
```

## Conclusion

This implementation guide provides a comprehensive framework for building the physics-based slap engine for the No_Gas_Slaps™ Telegram mini-app. The engine includes:

1. **Core Physics System**: A custom 2D physics engine optimized for mobile performance with vector mathematics, collision detection, and object interactions.

2. **Slap Mechanics**: Detailed implementation of slap parameters, input controls, and trajectory prediction for an engaging gameplay experience.

3. **Rendering System**: Canvas-based rendering with particle effects for visual feedback and a responsive UI.

4. **Scoring and Rewards**: A comprehensive scoring system with combo mechanics and a reward distribution system that integrates with blockchain.

5. **Game Integration**: A complete game class that ties all components together and integrates with the Telegram Mini-App SDK.

By following this guide, developers can implement a high-quality physics-based game that provides an engaging play-to-earn experience within the Telegram ecosystem. The modular architecture allows for easy extension and customization to fit the specific needs of the No_Gas_Labs™ universe.