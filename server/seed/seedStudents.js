require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Student = require('../models/Student');

const connectDB = require('../config/db');

const CSV_PATH = path.join(__dirname, 'students.csv');

async function seed() {
  await connectDB();

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
          await Student.updateOne(
            { registration_number: s.registration_number },
            { $setOnInsert: s },
            { upsert: true }
          );
          inserted++;
        } catch (err) {
          console.error(`❌ Error inserting ${s.registration_number}:`, err.message);
          skipped++;
        }
      }

      console.log(`✅ Seeding complete — ${inserted} inserted/updated, ${skipped} skipped`);
      await mongoose.disconnect();
    });
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
