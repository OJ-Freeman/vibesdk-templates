// "Drift Catch" - a tiny reference game showing how to make a Phaser 3
// mini-game feel *alive* with no external art assets: procedurally-drawn
// glow textures, a parallax starfield, particle bursts, camera shake,
// tween-driven UI feedback, and an escalating difficulty curve.
//
// Replace the gameplay in GameScene with your own - keep the *pattern*:
// juice every catch/miss/score event, don't just move a sprite and call it done.

const LIVES = 3;
const WORLD = { width: 480, height: 800 };

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // Draw all textures with Graphics instead of loading image files - keeps
  // this template dependency-free. Swap for this.load.image(...) in
  // preload() once you have real art.
  createTextures() {
    const gfx = this.add.graphics();

    // Soft glowing orb: a few translucent rings stacked to fake a radial glow.
    const orbSize = 64;
    gfx.clear();
    for (let ring = 6; ring >= 0; ring--) {
      const alpha = 0.06 + (6 - ring) * 0.045;
      gfx.fillStyle(0x5be8ff, alpha);
      gfx.fillCircle(orbSize / 2, orbSize / 2, (orbSize / 2) * (ring / 6));
    }
    gfx.fillStyle(0xffffff, 0.95);
    gfx.fillCircle(orbSize / 2, orbSize / 2, orbSize * 0.14);
    gfx.generateTexture('orb', orbSize, orbSize);

    gfx.clear();
    for (let ring = 6; ring >= 0; ring--) {
      const alpha = 0.06 + (6 - ring) * 0.045;
      gfx.fillStyle(0xff5ec4, alpha);
      gfx.fillCircle(orbSize / 2, orbSize / 2, (orbSize / 2) * (ring / 6));
    }
    gfx.fillStyle(0xffffff, 0.95);
    gfx.fillCircle(orbSize / 2, orbSize / 2, orbSize * 0.14);
    gfx.generateTexture('orb-bonus', orbSize, orbSize);

    // Tiny particle spark used for catch bursts.
    gfx.clear();
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(4, 4, 4);
    gfx.generateTexture('spark', 8, 8);

    // Single-pixel star for the parallax field.
    gfx.clear();
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(2, 2, 2);
    gfx.generateTexture('star', 4, 4);

    gfx.destroy();
  }

  create() {
    this.createTextures();
    this.cameras.main.setBackgroundColor(0x0b0e21);

    this.buildStarfield();

    this.orbs = [];
    this.spawnTimer = null;
    this.running = false;
    this.score = 0;
    this.combo = 1;
    this.lives = LIVES;
    this.difficulty = 0;

    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 60, max: 180 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 380,
      quantity: 0,
      blendMode: 'ADD',
    });

    // Catch line near the bottom - orbs crossing it without a click count as a miss.
    this.catchLineY = WORLD.height - 90;

    // Keyboard support: space bar catches the lowest live orb.
    this.input.keyboard.on('keydown-SPACE', () => this.catchLowestOrb());

    // Expose a tiny API the DOM buttons call into.
    this.game.registry.set('drift', {
      start: () => this.startRun(),
    });
  }

  buildStarfield() {
    this.stars = this.add.group();
    for (let i = 0; i < 70; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, WORLD.width),
        Phaser.Math.Between(0, WORLD.height),
        'star',
      );
      star.setAlpha(Phaser.Math.FloatBetween(0.15, 0.7));
      star.setScale(Phaser.Math.FloatBetween(0.5, 1.6));
      star.speed = Phaser.Math.FloatBetween(6, 26);
      this.stars.add(star);
    }
  }

  startRun() {
    this.score = 0;
    this.combo = 1;
    this.lives = LIVES;
    this.difficulty = 0;
    this.orbs.forEach((o) => o.destroy());
    this.orbs = [];
    this.running = true;

    updateHud({ score: 0, combo: 1, lives: LIVES });

    if (this.spawnTimer) this.spawnTimer.remove();
    this.spawnTimer = this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => this.spawnOrb(),
    });
    this.spawnOrb();
  }

  spawnOrb() {
    if (!this.running) return;
    const isBonus = Math.random() < 0.15;
    const x = Phaser.Math.Between(40, WORLD.width - 40);
    const orb = this.add.image(x, -30, isBonus ? 'orb-bonus' : 'orb');
    orb.isBonus = isBonus;
    orb.fallSpeed = Phaser.Math.Between(70, 110) + this.difficulty * 6;
    orb.setInteractive({ useHandCursor: true });
    orb.on('pointerdown', () => this.catchOrb(orb));
    this.orbs.push(orb);
  }

  catchLowestOrb() {
    if (!this.orbs.length) return;
    const lowest = this.orbs.reduce((a, b) => (a.y > b.y ? a : b));
    this.catchOrb(lowest);
  }

  catchOrb(orb) {
    if (!this.running || !orb.active) return;

    const points = (orb.isBonus ? 30 : 10) * this.combo;
    this.score += points;
    this.combo = Math.min(this.combo + 1, 8);
    this.difficulty += 1;

    this.sparks.setParticleTint(orb.isBonus ? 0xff5ec4 : 0x5be8ff);
    this.sparks.explode(14, orb.x, orb.y);

    // Punchy feedback: quick pop-scale then fade, instead of just vanishing.
    this.tweens.add({
      targets: orb,
      scale: 1.6,
      alpha: 0,
      duration: 160,
      ease: 'Cubic.easeOut',
      onComplete: () => orb.destroy(),
    });
    this.orbs = this.orbs.filter((o) => o !== orb);

    this.cameras.main.flash(60, 91, 232, 255, false);
    updateHud({ score: this.score, combo: this.combo, comboPulse: true });
  }

  missOrb(orb) {
    orb.destroy();
    this.orbs = this.orbs.filter((o) => o !== orb);
    this.combo = 1;
    this.lives -= 1;
    this.cameras.main.shake(160, 0.01);
    updateHud({ combo: this.combo, lives: this.lives });

    if (this.lives <= 0) this.endRun();
  }

  endRun() {
    this.running = false;
    if (this.spawnTimer) this.spawnTimer.remove();
    this.orbs.forEach((o) => o.destroy());
    this.orbs = [];
    showGameOver(this.score, this.combo);
  }

  update(_time, deltaMs) {
    const dt = deltaMs / 1000;

    this.stars.getChildren().forEach((star) => {
      star.y += star.speed * dt;
      if (star.y > WORLD.height) {
        star.y = -4;
        star.x = Phaser.Math.Between(0, WORLD.width);
      }
    });

    if (!this.running) return;

    for (const orb of [...this.orbs]) {
      orb.y += orb.fallSpeed * dt;
      if (orb.y > this.catchLineY + 40) this.missOrb(orb);
    }
  }
}

// ---------------------------------------------------------------------------
// DOM <-> Phaser bridge. Keeping menu/HUD/game-over in real HTML+CSS (see
// index.html/styles.css) instead of Phaser Text/Buttons gives crisper type
// and makes restyling trivial - only the play-field itself is canvas.
// ---------------------------------------------------------------------------

const hud = document.getElementById('hud');
const hudScore = document.getElementById('hud-score');
const hudCombo = document.getElementById('hud-combo');
const hudComboPill = document.getElementById('hud-combo-pill');
const hudLives = document.getElementById('hud-lives');
const screenStart = document.getElementById('screen-start');
const screenGameOver = document.getElementById('screen-gameover');
const finalScoreEl = document.getElementById('final-score');
const finalComboEl = document.getElementById('final-combo');

function renderLives(count) {
  hudLives.innerHTML = '';
  for (let i = 0; i < LIVES; i++) {
    const dot = document.createElement('span');
    dot.className = 'life' + (i < count ? '' : ' lost');
    hudLives.appendChild(dot);
  }
}

function updateHud({ score, combo, lives, comboPulse }) {
  if (score !== undefined) hudScore.textContent = String(score);
  if (combo !== undefined) hudCombo.textContent = 'x' + combo;
  if (lives !== undefined) renderLives(lives);
  if (comboPulse) {
    hudComboPill.classList.remove('pulse');
    // Force reflow so the animation can retrigger on consecutive catches.
    void hudComboPill.offsetWidth;
    hudComboPill.classList.add('pulse');
  }
}

function showGameOver(score, combo) {
  finalScoreEl.textContent = String(score);
  finalComboEl.textContent = 'x' + combo;
  hud.classList.add('hidden');
  screenGameOver.classList.remove('hidden');
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: WORLD.width,
  height: WORLD.height,
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);

function beginRun() {
  screenStart.classList.add('hidden');
  screenGameOver.classList.add('hidden');
  hud.classList.remove('hidden');
  renderLives(LIVES);
  const drift = game.registry.get('drift');
  if (drift) drift.start();
}

document.getElementById('btn-start').addEventListener('click', beginRun);
document.getElementById('btn-restart').addEventListener('click', beginRun);
