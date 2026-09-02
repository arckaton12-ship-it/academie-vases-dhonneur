const https = require('https');
const env = require('./env.cjs');

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SERVICE_ROLE_KEY || !env.MANAGEMENT_TOKEN) {
  console.error('Clés manquantes : Lance avec `node --env-file=.env tests/setup-test-accounts.cjs`');
  process.exit(1);
}

const HOST = env.SUPABASE_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''); // svocfsftkskhcysspima.supabase.co
const PROJECT_REF = HOST.split('.')[0];
const SERVICE_ROLE = env.SERVICE_ROLE_KEY;
const MGMT_TOKEN = env.MANAGEMENT_TOKEN;

async function createUser(email, password, firstName, lastName, role) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      email, password, email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName, role }
    });
    const opts = {
      hostname: HOST,
      path: '/auth/v1/admin/users', method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE,
        'Authorization': 'Bearer ' + SERVICE_ROLE,
        'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { console.log(`  [${email}] Auth: ${res.statusCode}`); resolve(JSON.parse(data)); });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sql(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const opts = {
      hostname: 'api.supabase.com',
      path: '/v1/projects/' + PROJECT_REF + '/database/query', method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + MGMT_TOKEN,
        'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { console.log(`  [SQL] ${res.statusCode}`); resolve(JSON.parse(data)); });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Creating test accounts...');

  // 1. Moderator for Class 1
  await createUser('moderator@acvha.org', 'AcVh2026!', 'Mod', 'Testeur', 'MODERATEUR');
  const modUser = await sql(`SELECT id FROM auth.users WHERE email = 'moderator@acvha.org'`);
  const modId = modUser.value?.[0]?.id;
  if (modId) {
    await sql(`INSERT INTO profiles (id, email, first_name, last_name, role, active, class_id)
      VALUES ('${modId}', 'moderator@acvha.org', 'Mod', 'Testeur', 'MODERATEUR', true, '980b1f42-0cf1-4990-9ec1-685240ccc396')
      ON CONFLICT (id) DO UPDATE SET role = 'MODERATEUR'`);
    await sql(`INSERT INTO moderator_classes (moderator_id, class_id)
      VALUES ('${modId}', '980b1f42-0cf1-4990-9ec1-685240ccc396')
      ON CONFLICT DO NOTHING`);
    console.log(`  Moderator created: ${modId}`);
  }

  // 2. Admin de classe for Class 1 only
  await createUser('adminclasse@acvha.org', 'AcVh2026!', 'AdminC', 'Testeur', 'ADMIN_CLASSE');
  const acUser = await sql(`SELECT id FROM auth.users WHERE email = 'adminclasse@acvha.org'`);
  const acId = acUser.value?.[0]?.id;
  if (acId) {
    await sql(`INSERT INTO profiles (id, email, first_name, last_name, role, active, class_id)
      VALUES ('${acId}', 'adminclasse@acvha.org', 'AdminC', 'Testeur', 'ADMIN_CLASSE', true, '980b1f42-0cf1-4990-9ec1-685240ccc396')
      ON CONFLICT (id) DO UPDATE SET role = 'ADMIN_CLASSE'`);
    await sql(`INSERT INTO admin_class_classes (admin_id, class_id)
      VALUES ('${acId}', '980b1f42-0cf1-4990-9ec1-685240ccc396')
      ON CONFLICT DO NOTHING`);
    console.log(`  Admin Classe created: ${acId}`);
  }

  // 3. Student in Class 2 (different from moderator's Class 1)
  await createUser('test2@acvha.org', 'AcVh2026!', 'Test2', 'Etudiant2', 'ETUDIANT');
  const s2User = await sql(`SELECT id FROM auth.users WHERE email = 'test2@acvha.org'`);
  const s2Id = s2User.value?.[0]?.id;
  if (s2Id) {
    await sql(`INSERT INTO profiles (id, email, first_name, last_name, role, active, class_id)
      VALUES ('${s2Id}', 'test2@acvha.org', 'Test2', 'Etudiant2', 'ETUDIANT', true, '193612cc-dec7-43fe-8f8b-70e1ee6eec29')
      ON CONFLICT (id) DO UPDATE SET role = 'ETUDIANT', class_id = '193612cc-dec7-43fe-8f8b-70e1ee6eec29'`);
    console.log(`  Student 2 created: ${s2Id}`);
  }

  console.log('\nDone!');
}

main().catch(console.error);
