/**
 * ip.js — Détection de l'adresse IP locale du PC sur le réseau Wi-Fi
 *
 * On utilise l'API native Node.js `os.networkInterfaces()` plutôt que
 * le package `ip` pour éviter une dépendance superflue et avoir plus
 * de contrôle sur la sélection de l'interface réseau.
 */

const os = require('os');

/**
 * Retourne la première adresse IPv4 non-loopback trouvée sur les interfaces réseau.
 * Privilégie les interfaces Wi-Fi (en0, wlan0, Wi-Fi) mais accepte toutes
 * les interfaces actives si aucune interface Wi-Fi n'est détectée.
 *
 * @returns {string} L'adresse IP locale (ex: "192.168.1.42")
 * @throws {Error} Si aucune IP valide n'est trouvée
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();

  // Noms d'interfaces Wi-Fi communs sur macOS, Linux, Windows
  const wifiPrefixes = ['en0', 'en1', 'wlan0', 'wlan1', 'Wi-Fi', 'wlp'];

  // Première passe : chercher une interface Wi-Fi
  for (const prefix of wifiPrefixes) {
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!name.startsWith(prefix)) continue;
      const ipv4 = findIPv4(addrs);
      if (ipv4) return ipv4;
    }
  }

  // Deuxième passe : accepter n'importe quelle interface non-loopback
  for (const addrs of Object.values(interfaces)) {
    const ipv4 = findIPv4(addrs);
    if (ipv4) return ipv4;
  }

  throw new Error(
    "Impossible de détecter l'IP locale. " +
    "Vérifiez que vous êtes bien connecté à un réseau Wi-Fi."
  );
}

/**
 * Filtre une liste d'adresses réseau pour retourner la première IPv4 non-loopback.
 *
 * @param {os.NetworkInterfaceInfo[]} addrs
 * @returns {string|null}
 */
function findIPv4(addrs) {
  if (!addrs) return null;
  for (const addr of addrs) {
    if (addr.family === 'IPv4' && !addr.internal) {
      return addr.address;
    }
  }
  return null;
}

module.exports = { getLocalIP };