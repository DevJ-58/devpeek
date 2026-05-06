/**
 * ip.js — Détection de l'adresse IP locale du PC sur le réseau Wi-Fi
 *
 * On utilise l'API native Node.js `os.networkInterfaces()` pour détecter
 * l'adresse IPv4 du PC sans dépendances externes.
 */

const os = require('os');

/**
 * Retourne la première adresse IPv4 non-loopback trouvée sur les interfaces réseau.
 * Privilégie les interfaces Wi-Fi (en0, wlan0, Wi-Fi, etc.)
 * Exclut les interfaces virtuelles (VMnet, VirtualBox, docker0, etc.)
 *
 * @returns {string} L'adresse IP locale (ex: "192.168.1.42")
 * @throws {Error} Si aucune IP valide n'est trouvée
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();

  // Noms d'interfaces Wi-Fi/Ethernet communs sur macOS, Linux, Windows
  const preferredPrefixes = ['en0', 'en1', 'wlan0', 'wlan1', 'Wi-Fi', 'wlp', 'eth0', 'Ethernet'];
  
  // Interfaces virtuelles à exclure
  const excludedPrefixes = ['VMnet', 'vboxnet', 'docker', 'veth', 'br-', 'lo', 'virbr'];

  // Fonction pour vérifier si une interface est virtuelle
  function isVirtual(name) {
    return excludedPrefixes.some(prefix => name.startsWith(prefix));
  }

  // Fonction pour extraire une IPv4 non-loopback d'une liste d'adresses
  function findIPv4(addrs) {
    return addrs.find(addr => 
      addr.family === 'IPv4' && 
      !addr.internal && 
      addr.address !== '127.0.0.1'
    )?.address;
  }

  // Première passe : chercher une interface Wi-Fi préférée
  for (const prefix of preferredPrefixes) {
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (name.startsWith(prefix) && !isVirtual(name)) {
        const ipv4 = findIPv4(addrs);
        if (ipv4) return ipv4;
      }
    }
  }

  // Deuxième passe : accepter n'importe quelle interface physique (pas virtuelle)
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!isVirtual(name)) {
      const ipv4 = findIPv4(addrs);
      if (ipv4) return ipv4;
    }
  }

  throw new Error(
    "Impossible de détecter l'IP locale. " +
    "Vérifiez que vous êtes bien connecté à un réseau Wi-Fi ou Ethernet."
  );
}

module.exports = { getLocalIP };

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