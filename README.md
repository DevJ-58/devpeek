# DevPeek 👁

> Prévisualisez votre dev server local sur votre vrai téléphone en 30 secondes, avec un seul scan QR.

**English** | [Français](#français)

---

## What it does

When building a web app, you want to see it on a real phone — not the DevTools simulator. DevPeek creates a direct bridge over your local Wi-Fi:

1. Run `npx devpeek --port 3000` in your terminal
2. Scan the QR code with your phone
3. Your dev server appears in a fullscreen PWA on your real device
4. Hot reload (Vite HMR, Next.js, etc.) works natively

No tunnels. No configuration. No internet required.

## Requirements

- **PC**: Node.js ≥ 18
- **Phone**: Any modern browser (Chrome, Safari)
- **Network**: Both devices on the same Wi-Fi

## Usage

```bash
# With npx (no install required)
npx devpeek --port 3000

# Positional argument also works
npx devpeek 3000

# With a global install
npm install -g devpeek
devpeek --port 3000
```

### Framework setup

Your dev server must be exposed on the local network (not just localhost):

```bash
# Vite
vite --host

# Next.js — add to next.config.js:
# experimental: { hostname: '0.0.0.0' }

# CRA
HOST=0.0.0.0 react-scripts start

# Vue CLI
vue-cli-service serve --host 0.0.0.0
```

## Architecture

```
[PC - Dev Server :3000 (Vite / Next / etc.)]
          ↓
    [CLI DevPeek]
     - Detects local IP (192.168.x.x)
     - Starts PWA server :8765
     - Opens WebSocket :8765 (Socket.IO)
     - Shows QR code in terminal
          ↓ same Wi-Fi network
    [Phone]
     - Scans QR (once)
     - Opens PWA in browser
     - iframe → 192.168.x.x:3000
     - Hot reload works natively
```

## Limitations (v0.1)

- HTTP only (no HTTPS on local network in MVP)
- Same Wi-Fi network required
- Some sites block iframe embedding (X-Frame-Options) — local dev servers don't

---

## Français

DevPeek est un outil open-source en deux parties :

1. **Un CLI Node.js** qui détecte votre IP locale, génère un QR code et sert une PWA
2. **Une PWA mobile** qui charge votre dev server dans un iframe plein écran

### Installation

```bash
npx devpeek --port 3000
```

### Configuration des frameworks

Votre dev server doit écouter sur le réseau local :

```bash
# Vite
vite --host

# Next.js — dans next.config.js :
# experimental: { hostname: '0.0.0.0' }
```

## License

MIT © Kouadio Fréjus