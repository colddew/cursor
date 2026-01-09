<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md - Mini Games Project

This document provides guidelines for AI agents working on this mini-games project.

## Project Overview

This is a collection of casual browser-based mini-games built with HTML5, JavaScript, and Python (pygame). The project includes 2048, Flappy Bird, Merge Watermelon, Push Box, Sheep, and Tetris.

## Build, Lint, and Test Commands

### Python Games

```bash
# Run Tetris game
python3 tetris.py

# Python linting
pip install flake8
flake8 tetris.py --max-line-length=120 --ignore=E501,W503

# Type checking
pip install mypy
mypy tetris.py --ignore-missing-imports
```

### HTML/JS Games

```bash
# No build required - files are self-contained HTML
# Open directly in browser: 2048.html, flappy-bird.html, etc.

# HTML validation
pip install html5validator
html5validator --ignore=SVG_NS_ERROR *.html
```

## Code Style Guidelines

### Python (pygame games)

**Imports:**
```python
import pygame
import random
import sys
import array
import platform
import math
```

**Naming:**
- `PascalCase` for classes: `SoundManager`, `Tetris`, `Figure`
- `snake_case` for functions/variables: `get_drop_speed()`, `game_state`
- `UPPER_SNAKE_CASE` for constants: `COLORS`, `SHAPES`

**Formatting:**
- Line length: 120 characters max
- 4 spaces for indentation
- Spaces around operators: `x + y`

**Docstrings:**
- Chinese comments for game logic
- Section comments for code organization:
```python
# ============ 音效系统 ============
class SoundManager:
    """音效管理器 - 生成合成音效"""
```

**Error Handling:**
- Use try-except for system operations
- Include error messages: `print(f"Error: {e}")`
- Allow silent pass for non-critical errors

### HTML/CSS/JavaScript

**HTML Structure:**
- Include `lang` attribute: `<html lang="zh-CN">`
- Meta tags for charset and viewport

**CSS:**
- Use CSS variables: `--bg-color`, `--grid-bg`
- BEM naming: `.game-container`, `.tile-new`
- Responsive design with media queries

```css
:root {
    --bg-color: #fdf6f0;
}
.game-container {
    display: flex;
    gap: 24px;
}
```

**JavaScript:**
- `const` for constants, `let` for variables
- CamelCase: `initGame()`, `checkGameOver()`
- Event handlers: `onKeyDown`, `handleGesture`
- Chinese comments for game logic

```javascript
const gridLayer = document.getElementById('tile-layer');

function initGame() {
    board = Array(size).fill().map(() => Array(size).fill(0));
}
```

**General Rules:**
- Avoid global variables
- Use strict equality: `===` and `!==`
- Descriptive variable names

### File Organization

- One game per file: `game-name.html` or `game-name.py`
- Self-contained HTML files
- CSS in `<style>`, JS in `<script>` at end of `<body>`

### Game Development Specifics

**Canvas Games:** Use `requestAnimationFrame`, handle DPI, delta time
**Input Handling:** Support keyboard, mouse, and touch controls
**Performance:** CSS transforms for animations, minimize DOM operations

## OpenCode Configuration

```json
{
  "$schema": "https://opencode.ai/config.json",
  "lsp": {
    "python": { "disabled": false, "command": "pylsp" },
    "html": { "disabled": false, "command": "html-lsp" }
  }
}
```

## Common Tasks

### Adding a New Game
1. Create `new-game.html` with HTML/CSS/JS
2. Follow existing code style conventions
3. Add responsive CSS with media queries
4. Implement keyboard/touch controls
5. Test in browser at multiple screen sizes

### Modifying Game Logic
1. Locate relevant function in file
2. Preserve existing comments and structure
3. Test changes don't break existing features

### Debugging
1. Open HTML file directly in browser
2. Use browser DevTools for console logs
3. For Python: run with `python3 -i game.py`
