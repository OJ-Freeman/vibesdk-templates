# Usage Instructions

A Phaser 3 game template - vanilla HTML/CSS/JS, Phaser loaded via CDN, no bundler or build step. Comes with a working reference mini-game ("Drift Catch" - tap falling glowing orbs before they pass a line) so you have real, tested patterns for game feel to extend rather than a blank canvas.

## ⚠️ IMPORTANT: Reference Game

**"Drift Catch" (`public/game.js`) is FOR PATTERN REFERENCE, NOT your final game.**
- Replace the gameplay in `GameScene` with whatever the user actually asked for - keep the *techniques* (procedural textures, particles, camera feedback, tweened UI, parallax background), not the catching mechanic itself, unless the user explicitly wants a catching game.
- Replace the copy in `index.html` (title, subtitle, button text) and the color palette in `styles.css` - "DRIFT CATCH" and its cyan/magenta neon theme are one aesthetic direction for one demo, not a house style. Pick a palette and tone that fits the user's game.
- Keep the DOM-overlay + canvas-playfield architecture; it's the right pattern for almost any 2D game built here.

## Included Libraries
- **Phaser 3** (`https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`) - loaded as a classic script, exposes the global `Phaser`. Bump the pinned version deliberately if you need a newer feature; don't switch to `@latest`.
- **Google Fonts** - swap the `Chakra Petch` / `Manrope` pairing in `index.html`'s `<link>` for fonts that fit the game's tone.

**Important**: This is a no-build-step template (`renderMode: browser` - it deploys straight from `public/`). Don't add webpack/vite/npm bundling for the game code, don't `npm install phaser`, and don't try to `import` Phaser as an ES module from npm - the CDN global is the integration point.

## File Structure
- `public/index.html` - page shell: canvas host (`#game-root`), DOM HUD, start/game-over overlay screens, font + Phaser CDN tags
- `public/styles.css` - all page chrome styling (HUD pills, overlay cards, buttons, background atmosphere)
- `public/game.js` - Phaser scene(s) + the DOM↔Phaser bridge at the bottom of the file
- `wrangler.jsonc` - static assets deploy config. **Do not add a worker/backend here** - if the game genuinely needs persistence (leaderboards, saved progress across sessions), say so explicitly rather than silently bolting on a backend this template doesn't support.

## Phaser Patterns

### Scenes
One `Phaser.Scene` subclass is usually enough for a small game (`create()` for setup, `update(time, deltaMs)` for the loop). Add a second scene only when you need a real state boundary (e.g. a separate level-select or map scene) - don't split trivial menu/game-over logic into scenes when the DOM overlay pattern already handles it.

### No art assets needed
Draw placeholder/final visuals procedurally instead of trying to `this.load.image()` files that don't exist:
```js
const gfx = this.add.graphics();
gfx.fillStyle(0x5be8ff, 1);
gfx.fillCircle(16, 16, 16);
gfx.generateTexture('myTexture', 32, 32);
gfx.destroy();
```
Stack several translucent circles at decreasing radius (see `createTextures()` in `game.js`) to fake a soft glow with zero image files. Simple geometric shapes, layered and colored with intention, read as designed - not lazy - when the palette and motion around them are considered.

### Input
- Pointer (mouse + touch, same handler): `sprite.setInteractive({ useHandCursor: true }); sprite.on('pointerdown', ...)`, or `this.input.on('pointerdown', (pointer) => ...)` for whole-scene taps.
- Keyboard: `this.input.keyboard.on('keydown-SPACE', ...)` (or `-LEFT`/`-RIGHT`/etc).
- Always give touch and keyboard/mouse equal support - never ship a game that only works with a mouse.

### Physics
Manual per-object movement in `update()` (as in the reference game) is enough for falling/moving-target games. For anything with collisions, gravity, or bouncing, enable Arcade Physics instead of hand-rolling it:
```js
const config = { /* ... */ physics: { default: 'arcade', arcade: { gravity: { y: 300 }, debug: false } } };
// then: this.physics.add.sprite(...), this.physics.add.collider(a, b, onHit)
```

## Game Feel - Not Optional

A mechanically-correct game with no feedback reads as broken, not "minimal." Every meaningful event (score, hit, miss, level-up) needs at least one of these:
- **Camera shake/flash**: `this.cameras.main.shake(160, 0.01)` on impact/miss, `this.cameras.main.flash(60, r, g, b)` on a good hit.
- **Particles**: `this.add.particles(0, 0, textureKey, { speed: {min, max}, scale: {start, end}, lifespan, blendMode: 'ADD' })`, then `.explode(count, x, y)` for a one-off burst at an event.
- **Tweened feedback**: pop-scale + fade on collect (`this.tweens.add({ targets, scale: 1.6, alpha: 0, duration: 160, ease: 'Cubic.easeOut' })`), squash-and-stretch on land/bounce, a brief `timeScale` dip for a "hit-stop" beat on big impacts.
- **Sound**: Phaser's sound manager (`this.sound.play(...)`) needs an audio asset; if none is available, either synthesize short blips with the Web Audio API, or ship without sound but say so - don't silently skip audio without mentioning it.

Escalate difficulty over time (faster spawns, more targets, tighter windows) so runs have a shape - a flat, unchanging difficulty curve feels unfinished even when the mechanics work.

## HUD and Menus (DOM, not Phaser Text)

Keep score/lives/menus/game-over screens as real HTML+CSS layered over the canvas (see `#hud`, `#screen-start`, `#screen-gameover` in `index.html`) rather than `this.add.text(...)` - it renders crisper at any resolution, is trivial to restyle, and gets you real CSS transitions for free. Bridge the two directions:
- **DOM → Phaser**: `game.registry.set('drift', { start: () => this.startRun() })` inside the scene; call it from a button's click handler via `game.registry.get('drift').start()`.
- **Phaser → DOM**: call plain functions like `updateHud({ score, combo, lives })` directly from scene methods (`catchOrb`, `missOrb`, etc).

## Responsive & Mobile
- Keep `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }` (or switch to `Phaser.Scale.RESIZE` only if the game genuinely needs to fill the viewport edge-to-edge) so the canvas scales cleanly on any screen.
- Use `env(safe-area-inset-*)` in CSS for HUD elements near the edges (notches/home indicators).
- Test that every interaction works via touch - `pointerdown`/`pointerup`, not `click`, for anything that needs to feel immediate.

## Visual Design
Same principle as any UI: commit to a clear aesthetic direction and avoid the defaults.
- Pick a palette and typography pairing that fits the game's tone (the neon space theme here is one option among many - a puzzle game might want warm pastels and a rounded display font; a horror-tinged game might want desaturated color and a condensed serif).
- Never leave the background flat/empty - atmosphere (parallax layers, gradients, drifting particles, subtle vignettes) costs little and reads as "designed."
- Avoid default system fonts and the purple-gradient-on-white cliché unless the game concept genuinely calls for it.
- Ensure the result works on both desktop and mobile viewports.
