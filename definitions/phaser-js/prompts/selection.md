# Template Selection Guidelines

Use this template for **2D games**: arcade/action games, puzzle games, platformers, clicker/idle games, card or board games with animation, or any request centered on interactive play rather than forms/data (dashboards, CRUD apps, blogs).

**Key characteristics:**
- Phaser 3 (the most widely used open-source 2D game framework) loaded via CDN script tag - no bundler, no build step
- A working reference mini-game already wired up (game loop, input, particles, camera effects, tween-based feedback, a parallax starfield) to demonstrate real "juice" patterns, not just an empty canvas
- DOM-based menu/HUD/game-over screens layered over the canvas for crisp text and easy restyling, with the actual play-field rendered in Phaser
- No backend/database - runs entirely client-side, deploys instantly (`renderMode: browser`)

**Use when:**
- The user asks for a game, especially anything with falling/moving objects, clicking/tapping targets, scoring, lives, levels, or physics-like movement
- "Build me a game like X" where X is a simple browser game (Flappy Bird-likes, catchers, matchers, runners, breakout/pong-likes, simple platformers)

**Avoid when:**
- The request needs persistent multiplayer state, leaderboards backed by a database, or user accounts - pick a Durable Object/KV template instead (or use this template for the client and note the backend gap)
- The request is actually a dashboard/tool/form dressed up as "gamified" - those still want the DO/React templates
- The request is a 3D game - Phaser's WebGL renderer can do basic 3D-ish effects but this template's patterns (and the reference mini-game) are 2D-first

Built with:
- Phaser 3 (CDN), vanilla HTML/CSS/JS, Google Fonts, Cloudflare Workers static assets
