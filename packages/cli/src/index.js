/**
 * index.js — Logique principale de DevPeek
 *
 * Orchestre la détection IP, le démarrage du serveur et l'affichage du QR code.
 */

const chalk = require('chalk');
const { getLocalIP } = require('./ip');
const { displayQR } = require('./qr');
const { createDevPeekServer } = require('./server');

const PWA_PORT = 8765;

/**
 * Point d'entrée principal du CLI DevPeek.
 *
 * @param {object} options
 * @param {number} options.port - Port du dev server à prévisualiser
 */
async function run({ port }) {
console.log('DEBUG port reçu:', port); // ← ajoutez ici
  // --- Bannière d'accueil ---
  console.log('');
  console.log(chalk.bold.blueBright('  ██████╗ ███████╗██╗   ██╗██████╗ ███████╗███████╗██╗  ██╗'));
  console.log(chalk.bold.blueBright('  ██╔══██╗██╔════╝██║   ██║██╔══██╗██╔════╝██╔════╝██║ ██╔╝'));
  console.log(chalk.bold.blueBright('  ██║  ██║█████╗  ██║   ██║██████╔╝█████╗  █████╗  █████╔╝ '));
  console.log(chalk.bold.blueBright('  ██║  ██║██╔══╝  ╚██╗ ██╔╝██╔═══╝ ██╔══╝  ██╔══╝  ██╔═██╗ '));
  console.log(chalk.bold.blueBright('  ██████╔╝███████╗ ╚████╔╝ ██║     ███████╗███████╗██║  ██╗'));
  console.log(chalk.bold.blueBright('  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝'));
  console.log('');
  console.log(chalk.dim('  Prévisualisez votre dev server sur votre vrai téléphone'));
  console.log('');

  // --- Détection de l'IP locale ---
  let localIP;
  try {
    localIP = getLocalIP();
  } catch (err) {
    console.error(chalk.red('✖ ' + err.message));
    process.exit(1);
  }

  const devServerUrl = chalk.cyan(`http://${localIP}:${port}`);
  const pwaUrl       = chalk.cyan(`http://${localIP}:${PWA_PORT}`);

  console.log(chalk.green('✔') + '  IP locale détectée   : ' + devServerUrl);
  console.log(chalk.green('✔') + '  PWA servie sur       : ' + pwaUrl);
  console.log('');

  // --- Démarrage du serveur ---
  let connectedClients = 0;

  createDevPeekServer({
    pwaPort: PWA_PORT,
    localIP,
    devPort: port,
    onConnect: (id) => {
      connectedClients++;
      console.log('');
      console.log(chalk.green('▶') + chalk.bold('  Téléphone connecté !') + chalk.dim(` (client ${id.slice(0, 6)})`));
      console.log(chalk.dim('  Le dev server est maintenant visible sur votre téléphone.'));
      console.log('');
    },
    onDisconnect: (id) => {
      connectedClients = Math.max(0, connectedClients - 1);
      if (connectedClients === 0) {
        console.log(chalk.yellow('◌') + chalk.dim('  Téléphone déconnecté. En attente...'));
      }
    }
  });

  // --- Affichage du QR code ---
  const rawPwaUrl = `http://${localIP}:${PWA_PORT}`;

  console.log(chalk.bold('  Scannez ce QR code avec votre téléphone :'));
  console.log('');
  await displayQR(rawPwaUrl);
  console.log('');
  console.log(chalk.dim('  Ou ouvrez manuellement : ') + chalk.underline(rawPwaUrl));
  console.log('');
  console.log(chalk.dim('  ─────────────────────────────────────────────'));
  console.log(chalk.yellow('◌') + '  En attente de connexion mobile...');
  console.log(chalk.dim('  Appuyez sur Ctrl+C pour arrêter'));
  console.log('');

  // Garder le processus actif
  process.on('SIGINT', () => {
    console.log('');
    console.log(chalk.dim('  DevPeek arrêté. À bientôt !'));
    process.exit(0);
  });
}

module.exports = { run };