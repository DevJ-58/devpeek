# Contributing to DevPeek

Merci de contribuer à DevPeek ! Voici comment démarrer.

## Structure du projet

```
devpeek/
├── packages/
│   ├── cli/      ← Node.js CLI (npm package)
│   └── pwa/      ← Mobile PWA (Vanilla JS)
├── README.md
└── CONTRIBUTING.md
```

## Développement local

```bash
# Cloner le repo
git clone https://github.com/your-org/devpeek
cd devpeek

# Installer les dépendances
cd packages/cli
npm install

# Lancer le CLI en mode dev
node bin/devpeek.js --port 3000
```

## Guidelines

- **Commentaires** en français
- **Noms de variables** en anglais
- **Pas de TypeScript** en v0.x (on garde ça simple)
- CommonJS pour le CLI (compatibilité max Node.js)
- Vanilla JS pour la PWA (légèreté)

## Ouvrir une issue

Décrivez le bug ou la feature avec :
- OS et version de Node.js
- Navigateur mobile
- Étapes pour reproduire

## Pull Requests

1. Fork le repo
2. Créez une branche : `git checkout -b feat/ma-feature`
3. Commitez : `git commit -m 'feat: description'`
4. Push : `git push origin feat/ma-feature`
5. Ouvrez une PR

## Roadmap

Voir les milestones GitHub pour les versions v0.2, v0.3 et v1.0.