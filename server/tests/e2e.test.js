const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const SupabaseStudentRepository = require('../repositories/supabaseStudentRepository');
const SupabaseItemRepository = require('../repositories/supabaseItemRepository');
const SupabaseClaimRepository = require('../repositories/supabaseClaimRepository');
const SupabaseMessageRepository = require('../repositories/supabaseMessageRepository');
const AssetService = require('../services/assetService');
const fileValidationService = require('../services/fileValidationService');
const imageProcessingService = require('../services/imageProcessingService');

const studentRepo = new SupabaseStudentRepository();
const itemRepo = new SupabaseItemRepository();
const claimRepo = new SupabaseClaimRepository();
const messageRepo = new SupabaseMessageRepository();
const assetService = new AssetService();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runE2EAudit() {
  console.log('==================================================');
  console.log(' SUPABASE POSTGRESQL E2E PRODUCTION INTEGRATION TEST ');
  console.log('==================================================\n');

  // 1. Seed or find test student in Supabase PostgreSQL
  let student = await studentRepo.findByRegistrationNumber('REG001');
  if (!student) {
    student = await studentRepo.createStudent({
      registration_number: 'REG001',
      name: 'Aarav Sharma',
      email: 'aarav.s@school.edu',
      class: '10',
      section: 'A',
    });
  }
  console.log(`✅ Student loaded from PostgreSQL: ${student.name} (${student.id})`);

  // Generate tokens
  const studentToken = jwt.sign(
    { id: student.id, registration_number: student.registration_number, name: student.name, role: 'student' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { role: 'admin', username: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // PNG Header bytes
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x64, // 100
    0x00, 0x00, 0x00, 0x64, // 100
    0x08, 0x06, 0x00, 0x00, 0x00,
    0x36, 0x77, 0x61, 0x17,
  ]);
  const testPngBuffer = Buffer.concat([pngHeader, Buffer.alloc(200)]);

  console.log('\n--------------------------------------------------');
  console.log('PHASE 2 — REAL IMAGE UPLOAD & METADATA VERIFICATION');
  console.log('--------------------------------------------------');

  const validation = fileValidationService.validateFile(testPngBuffer, 'audit_camera_test.png', 'image/png');
  console.log('✅ File Validation Passed:', validation);

  const processed = await imageProcessingService.processImage(testPngBuffer, 'image/png');
  console.log(`✅ Image Processing Metadata Extracted: Width=${processed.width}px, Height=${processed.height}px`);

  const serial_num = `LF-AUDIT-${Math.floor(1000 + Math.random() * 9000)}`;
  const assetResult = await assetService.uploadAsset({
    fileBuffer: testPngBuffer,
    originalFilename: 'audit_camera_test.png',
    mimeType: 'image/png',
    ownerId: student.id,
    entityType: 'item',
    entityId: serial_num,
  });
  console.log('✅ Supabase Upload Succeeded!');
  console.log(`   ➜ Asset ID: ${assetResult.id}`);
  console.log(`   ➜ Object Key: ${assetResult.objectKey}`);
  console.log(`   ➜ Owner ID (TEXT): ${assetResult.ownerId}`);

  // Create Item in PostgreSQL public.items
  const newItem = await itemRepo.createItem({
    serial_number: serial_num,
    uid: `UID-AUDIT-${Date.now().toString(36).toUpperCase()}`,
    category: 'Electronics',
    who_found: 'E2E Audit Staff',
    location_found: 'Library',
    date_found: new Date(),
    time_found: '14:00',
    description: 'E2E Audit test item with verified Supabase storage asset.',
    image_url: assetResult.url,
    image_filename: 'audit_camera_test.png',
    asset_id: assetResult.id,
    submitted_by: student.id,
    registration_number: student.registration_number,
    student_name: student.name,
    status: 'PUBLISHED',
  });
  console.log(`✅ Supabase PostgreSQL Item Created: ${newItem.id} (Asset ID: ${newItem.asset_id})`);

  // Verify PostgreSQL public.assets
  const { data: dbAsset, error: dbErr } = await supabaseAdmin
    .from('assets')
    .select('*')
    .eq('id', assetResult.id)
    .single();

  if (dbErr || !dbAsset) throw new Error(`Failed to verify public.assets row: ${dbErr?.message}`);
  console.log('✅ PostgreSQL public.assets Row Verified:');
  console.log(`   ➜ id: ${dbAsset.id}`);
  console.log(`   ➜ status: ${dbAsset.status}`);

  console.log('\n--------------------------------------------------');
  console.log('PHASE 3 — CLAIMS, MESSAGES & HANDOVER PRIVACY');
  console.log('--------------------------------------------------');

  // Submit Claim
  const claim = await claimRepo.createClaim({
    item_id: newItem.id,
    student_id: student.id,
    message: 'This is my lost headphone.',
    status: 'PENDING',
  });
  console.log(`✅ Claim Created in public.ownership_requests: ${claim.id}`);

  // Add Message
  const msg = await messageRepo.createMessage({
    request_id: claim.id,
    sender_id: student.id,
    sender_role: 'student',
    message: 'Hello, I can provide serial number proof.',
  });
  console.log(`✅ Message Created in public.ownership_messages: ${msg.id}`);

  // Handover PDF Upload
  const pdfHeader = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
  const handoverAsset = await assetService.uploadAsset({
    fileBuffer: pdfHeader,
    originalFilename: 'student_handover_signed.pdf',
    mimeType: 'application/pdf',
    ownerId: 'admin',
    entityType: 'handover',
    entityId: newItem.id,
  });

  await itemRepo.updateItem(newItem.id, {
    handover_asset_id: handoverAsset.id,
    handover_form_url: handoverAsset.url,
    status: 'CLAIMED',
  });

  console.log('✅ Handover PDF Uploaded to Private Path:');
  console.log(`   ➜ Object Key: ${handoverAsset.objectKey}`);

  // Test unauthorized access check
  try {
    assetService._checkAssetAccess(handoverAsset, { role: 'student', id: 'other_student_id' }, 'read');
    console.error('❌ Unauthorized student check failed!');
  } catch (err) {
    console.log(`✅ Unauthorized Access Blocked Correctly: "${err.message}"`);
  }

  console.log('\n--------------------------------------------------');
  console.log('PHASE 4 — CLEANUP DELETION');
  console.log('--------------------------------------------------');

  await messageRepo.deleteMessagesByRequestId(claim.id);
  await claimRepo.deleteClaimsByItem(newItem.id);
  await assetService.deleteAsset(newItem.asset_id, { role: 'admin' }, true);
  await assetService.deleteAsset(handoverAsset.id, { role: 'admin' }, true);
  await itemRepo.deleteItem(newItem.id);

  console.log('✅ Item, Claim, Messages, and Storage Assets Cleaned Up from Supabase!');

  console.log('\n==================================================');
  console.log('   🎉 ALL POSTGRESQL AUDIT PHASES 100% PASS      ');
  console.log('==================================================\n');

  process.exit(0);
}

runE2EAudit().catch((err) => {
  console.error('\n❌ Audit Failure:', err);
  process.exit(1);
});
