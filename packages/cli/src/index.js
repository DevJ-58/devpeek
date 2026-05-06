/**
 * index.js — Logique principale de DevPeek CLI
 *
 * Orchestre la détection IP, l'affichage du QR code,
 * et lance automatiquement le serveur PWA avec live reload.
 */

const path = require('path');
const chalk = require('chalk');
const httpServer = require('http-server');
const { getLocalIP } = require('./ip');
const { displayQR } = require('./qr');

/**
 * Point d'entrée principal du CLI DevPeek.
 *
 * @param {object} options
 * @param {number} options.port - Port du dev server à prévisualiser
 */
async function run({ port }) {
  // --- Bannière d'accueil ---
  console.log('');
  console.log(chalk.bold.greenBright('  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'));
  console.log(chalk.bold.greenBright('  ┃         DevPeek v0.2.0      ┃'));
  console.log(chalk.bold.greenBright('  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'));
  console.log('');

  // --- Détection de l'IP locale ---
  let localIP;
  try {
    localIP = getLocalIP();
  } catch (err) {
    console.error(chalk.red('✖ ' + err.message));
    process.exit(1);
  }

  const pwaUrl = `http://${localIP}:8765`;
  const devServerUrl = `http://${localIP}:${port}`;

  console.log(chalk.green('✓') + '  IP détectée        : ' + chalk.cyan(localIP));
  console.log(chalk.green('✓') + '  PWA DevPeek ready  : ' + chalk.bold.cyan(pwaUrl));
  console.log(chalk.green('✓') + '  Serveur projet     : ' + chalk.bold.cyan(devServerUrl));
  console.log('');

  const pwaServer = httpServer.createServer({
    root: path.resolve(__dirname, '../../../'),
    cors: true,
    cache: -1
  });

  pwaServer.listen(8765, '0.0.0.0', () => {
    // serveur démarré
  });

  // --- Affichage du QR code ---
  console.log(chalk.bold('  Scannez ce QR code depuis DevPeek :'));
  console.log('');
  try {
    await displayQR(pwaUrl);
  } catch (err) {
    console.error(chalk.yellow('⚠') + '  Erreur QR code:', err.message);
  }
  console.log('');

  // --- Instructions ---
  console.log(chalk.dim('  ────────────────────────────────────────'));
  console.log(chalk.green('▶') + '  Ouvrez DevPeek sur votre téléphone');
  console.log(chalk.green('▶') + '  Scannez le QR ou ouvrez : ' + chalk.cyan(pwaUrl));
  console.log(chalk.dim('  ────────────────────────────────────────'));
  console.log('');
  console.log(chalk.dim('  Appuyez sur Ctrl+C pour arrêter'));
  console.log('');

  process.on('SIGINT', () => {
    console.log('');
    pwaServer.close(() => {
      console.log(chalk.dim('  DevPeek arrêté. À bientôt !'));
      process.exit(0);
    });
  });
}

module.exports = { run };
