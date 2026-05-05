/**
 * qr.js — Génération et affichage du QR code dans le terminal
 */

const qrcode = require('qrcode-terminal');

/**
 * Affiche le QR code d'une URL dans le terminal.
 * Utilise un QR "small" pour tenir dans la plupart des terminaux.
 * Affiche également l'URL en texte en fallback.
 *
 * @param {string} url - L'URL à encoder dans le QR code
 * @returns {Promise<void>}
 */
function displayQR(url) {
  return new Promise((resolve) => {
    // `small: true` génère un QR code plus compact avec des demi-blocs Unicode
    qrcode.generate(url, { small: true }, (qrString) => {
      console.log(qrString);
      resolve();
    });
  });
}

module.exports = { displayQR };