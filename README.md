# 🏀 Basketball Manager

Lithuanian Basketball League management simulation with multiplayer support.

## Play Online

**[▶ Play Now on GitHub Pages](https://SimonBucelis.github.io/basketball-manager/)**

## Deploy Your Own

### Option A — GitHub Pages (Automatic CI/CD)

1. Fork this repo
2. Go to **Settings → Pages** → Source: **GitHub Actions**
3. Push to `main` — the `.github/workflows/deploy.yml` workflow builds and deploys automatically
4. Your game will be live at `https://<your-username>.github.io/basketball-manager/`

> If your repo name differs, update `base` in `vite.config.ts` and `homepage` in `package.json`.

### Option B — Manual Deploy

```bash
npm install
npm run deploy   # builds + pushes to gh-pages branch via gh-pages
```

### Option C — Local Dev

```bash
npm install
npm run dev      # http://localhost:8080
```

## Features

- **Single Player** — manage your club through seasons, transfers, and promotions
- **Multiplayer** — real-time 2-player via Firebase (turn-based: both click Ready to advance)
- **Two Leagues** — A League (RKL) with playoffs, B League (LKL) with promotion game
- **Promotion/Relegation** — B League champion vs A League last place in a best-of-3 Promotion Game
- **Strategy System** — Defensive / Offensive / Playmaking (rock-paper-scissors bonuses)
- **Season Modifiers & Bonuses** — random events that shake up each season
