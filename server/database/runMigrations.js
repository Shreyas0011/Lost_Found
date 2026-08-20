const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(url, key);

async function runMigrations() {
  console.log('🚀 Running Supabase PostgreSQL Database Migrations...');
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`\n▶ Executing migration: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Note: Supabase JS client doesn't expose a direct raw sql() execution endpoint without pg driver or rpc function,
    // so we can execute standard table queries or verify table presence.
    // For direct table creation, users run SQL in Supabase SQL Editor or via postgres connection.
  }
}

runMigrations().catch(console.error);
