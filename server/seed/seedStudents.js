require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const SupabaseStudentRepository = require('../repositories/supabaseStudentRepository');

const studentRepo = new SupabaseStudentRepository();
const CSV_PATH = path.join(__dirname, 'students.csv');

async function seed() {
  console.log('🌱 Seeding Students into Supabase PostgreSQL Database...');
  const students = [];

  fs.createReadStream(CSV_PATH)
    .pipe(csv())
    .on('data', (row) => {
      students.push({
        registration_number: (row.registration_number || row.reg_number || '').trim().toUpperCase(),
        name: (row.name || '').trim(),
        email: (row.email || '').trim().toLowerCase(),
        class: (row.class || '').trim(),
        section: (row.section || '').trim(),
        parent_name: (row.parent_name || '').trim(),
        parent_email: (row.parent_email || '').trim().toLowerCase(),
        status: 'active',
      });
    })
    .on('end', async () => {
      console.log(`📋 Found ${students.length} students in CSV`);
      let inserted = 0;
      let skipped = 0;

      for (const s of students) {
        if (!s.registration_number || !s.name) {
          console.warn(`⚠️  Skipping row — missing required fields: ${JSON.stringify(s)}`);
          skipped++;
          continue;
        }
        try {
          await studentRepo.upsertStudent(s);
          inserted++;
        } catch (err) {
          console.error(`❌ Error inserting ${s.registration_number}:`, err.message);
          skipped++;
        }
      }

      console.log(`✅ Seeding complete — ${inserted} inserted/updated, ${skipped} skipped`);
      process.exit(0);
    });
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
