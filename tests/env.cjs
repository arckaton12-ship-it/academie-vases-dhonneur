// Chargement central des secrets pour les tests.
// Lit les clés depuis le fichier .env à la racine du projet (aucune valeur en dur ici).
// Usage : require('./env') avant d'utiliser process.env.*, puis lance avec
//   node --env-file=.env tests/xxx.cjs
// ou bien ce module charge lui-même .env si absent de l'environnement.

const fs = require('fs');
const path = require('path');

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const rootDotEnv = path.join(__dirname, '..', '.env');
loadDotEnv(rootDotEnv);

module.exports = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE,
  MANAGEMENT_TOKEN: process.env.SUPABASE_MANAGEMENT_TOKEN,
  GOOGLE_SHEETS_URL: process.env.VITE_GOOGLE_SHEETS_URL,
};
