#!/usr/bin/env node

const { program } = require('commander');
const { run } = require('../src/index');

program
  .name('devpeek')
  .description('Prévisualisez votre dev server local sur votre vrai téléphone en 30 secondes')
  .version('0.2.0')
  .option('-p, --port <port>', 'Port du dev server à prévisualiser (défaut: 3000)', '3000')
  .action((options) => {
    const port = parseInt(options.port, 10);

    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('Erreur : le port doit être un nombre entre 1 et 65535');
      process.exit(1);
    }

    run({ port }).catch((err) => {
      console.error('Erreur fatale :', err.message);
      process.exit(1);
    });
  });

program.parse(process.argv);