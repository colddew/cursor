# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "lucky-wheel" project - a web application for creating custom weighted spinning wheels. Currently, this repository contains only documentation (PRD) and no actual source code has been implemented yet.

## Key Documentation

- **[prd.md](prd.md)**: Comprehensive product requirements document covering all three phases:
  1. Phase 1: Configuration interface ("Builder")
  2. Phase 2: Game interface (modal window)
  3. Phase 3: Standalone HTML file export

## Recommended Implementation Approach

Based on the PRD analysis:
- **Use vanilla HTML + CSS + JavaScript** (single file)
- **Avoid frameworks like Next.js** - they're over-engineered for this simple application
- **Use SVG for wheel rendering** (easier to style and animate than Canvas)
- **CSS animations for spinning effects**
- **Blob API for standalone HTML generation**

## Architecture Notes

When implementing, remember:
- Two main interfaces that toggle: configuration mode vs game mode
- Modal-based design for the game interface
- Weight-based probability calculations for fair results
- Three preset themes with different color schemes
- Export must create a completely self-contained HTML file

## Development Status

- Phase: Documentation only
- No build system configured
- No package.json or dependencies
- Ready for initial implementation