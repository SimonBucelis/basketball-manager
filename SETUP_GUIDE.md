# 🏀 Basketball Manager — Setup & Deployment Guide

Complete guide for running locally, pushing to GitHub, and deploying to GitHub Pages with multiplayer via Firebase.

---

## 📋 Prerequisites

Make sure you have these installed before anything else:

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| **Node.js** | v18 or v20 | `node -v` | https://nodejs.org |
| **npm** | v9+ | `npm -v` | Comes with Node |
| **Git** | any | `git --version` | https://git-scm.com |

---

## 🖥️ Running Locally

### 1. Clone your repository

```bash
git clone https://github.com/SimonBucelis/basketball-manager.git
cd basketball-manager
```

### 2. Install dependencies

```bash
npm install
```

> This will install all packages including **Firebase** (which powers multiplayer).

### 3. Start the dev server

```bash
npm run dev
```

Open your browser at: **http://localhost:8080**

The app hot-reloads — any file you save will instantly update in the browser without refreshing.

### 4. Stop the server

Press `Ctrl + C` in the terminal.

---

## 🔥 Firebase Setup (Multiplayer)

Firebase is already configured in `src/lib/firebase.ts` with your credentials. You just need to set the database rules.

### Set Database Rules

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open your **Basketball-manager** project
3. Click **Realtime Database** in the left sidebar
4. Click the **Rules** tab at the top
5. Replace everything with:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

6. Click **Publish**

> ⚠️ These rules are open for development. Fine for a small friend group. For a public app with many users, you'd want stricter rules later.

---

## 🐙 Pushing to GitHub

### If this is your first push (new repo)

```bash
# Initialize git (skip if already done)
git init

# Connect to your GitHub repo
git remote add origin https://github.com/SimonBucelis/basketball-manager.git

# Stage all files
git add .

# Commit
git commit -m "feat: add multiplayer with Firebase"

# Push
git push -u origin main
```

### For future updates (after first push)

```bash
git add .
git commit -m "your message here"
git push
```

### Useful git commands

```bash
git status              # see what files changed
git diff                # see exact changes
git log --oneline       # see commit history
git pull                # get latest changes from GitHub
```

---

## 🚀 Deploying to GitHub Pages

Your project is set up with **GitHub Actions** — it deploys automatically every time you push to `main`. No manual steps needed after the one-time setup below.

### One-time GitHub Pages setup

1. Go to your repo on GitHub: `https://github.com/SimonBucelis/basketball-manager`
2. Click **Settings** (top tab)
3. Click **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Click **Save**

### That's it!

Every `git push` to `main` will:
1. Trigger the GitHub Action (`.github/workflows/deploy.yml`)
2. Run `npm install` + `npm run build`
3. Deploy the built files to GitHub Pages

### Check deployment status

- Go to your repo → **Actions** tab
- You'll see a workflow run — green ✅ = deployed, red ❌ = error

### Your live URL

```
https://SimonBucelis.github.io/basketball-manager/
```

> Allow 1–3 minutes after pushing for the deployment to complete.

---

## 🎮 How Multiplayer Works

```
Player 1 (Host)                    Player 2 (Guest)
────────────────                   ─────────────────
Click "Multiplayer"                Click "Multiplayer"
→ Create Lobby                     → Join Lobby
→ Pick your team                   → Enter the 6-letter code
→ Share the code         CODE →    → Pick your team
→ Click "Start Game →"             (waits for host)
         │                                  │
         └──────── Game begins ─────────────┘
                        │
              Both manage their teams
              (transfers, squad, etc.)
                        │
              Both click "Ready for Week X →"
                        │
              Week simulates ONLY when both ready
                        │
                    Repeat!
```

### Multiplayer rules
- Both players must be in the **same league** (or different leagues — both work)
- Only the **host** can click "Start Game"
- The week simulates automatically as soon as **both** players click Ready
- Each player manages their own **squad, transfers, and finances** independently
- Standings update live for both players after each week

---

## 🔧 Build for Production (manual)

If you want to build without deploying:

```bash
npm run build
```

Output goes to the `dist/` folder. You can preview it with:

```bash
npm run preview
```

---

## 🐛 Troubleshooting

### `npm install` fails
- Make sure Node.js v18 or v20 is installed: `node -v`
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

### Multiplayer lobby not connecting
- Check Firebase rules are set to read/write (see Firebase Setup above)
- Make sure both players are on the live deployed URL, not `localhost`
- Check browser console (F12) for Firebase errors

### GitHub Pages shows old version
- Check the **Actions** tab — the deployment may still be running
- Hard refresh the browser: `Ctrl + Shift + R`

### Build fails in GitHub Actions
- Check the Actions tab for the error message
- Most common cause: TypeScript error in a file you edited

### Port 8080 already in use locally
```bash
# Kill whatever is using port 8080
npx kill-port 8080
npm run dev
```

---

## 📁 Project Structure

```
basketball-manager/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-deploy to GitHub Pages on push
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── Dashboard.tsx   # Main game screen + multiplayer ready button
│   │   │   ├── GameLayout.tsx  # Navigation shell
│   │   │   ├── SquadView.tsx   # Squad management
│   │   │   ├── TransferMarket.tsx
│   │   │   ├── FinanceView.tsx
│   │   │   ├── LeagueView.tsx
│   │   │   └── PlayoffsView.tsx
│   │   └── multiplayer/
│   │       ├── LobbyScreen.tsx     # Create/join lobby UI
│   │       └── MultiplayerEntry.tsx # Home screen mode picker
│   ├── hooks/
│   │   ├── useGameState.tsx    # Game state + MultiplayerGameProvider
│   │   └── useLobby.ts         # Firebase lobby logic
│   ├── lib/
│   │   ├── firebase.ts         # Firebase connection (your credentials)
│   │   ├── multiplayerTypes.ts # TypeScript types for lobby
│   │   ├── gameEngine.ts       # Core game simulation logic
│   │   ├── gameData.ts         # Teams, players, divisions data
│   │   └── types.ts            # All TypeScript types
│   └── pages/
│       └── Index.tsx           # App entry — menu/singleplayer/multiplayer routing
├── package.json                # Dependencies (includes firebase ^10.14.1)
└── vite.config.ts              # Build config with /basketball-manager/ base path
```

---

## 🔑 Firebase Credentials

Your Firebase config is stored in `src/lib/firebase.ts`. The API key in this file is safe to commit to a public GitHub repo — Firebase API keys are not secret (they identify your project, not authenticate you). Security is handled by the **Database Rules** instead.

---

*Built with React + TypeScript + Vite + Firebase Realtime Database*
