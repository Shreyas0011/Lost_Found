/**
 * Standalone Data Migration Script: MongoDB -> Supabase PostgreSQL
 * Reads existing MongoDB collections and inserts corresponding records into Supabase PostgreSQL tables
 * while mapping ObjectIds to UUIDs and preserving relational integrity.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SupabaseStudentRepository = require('../repositories/supabaseStudentRepository');
const SupabaseItemRepository = require('../repositories/supabaseItemRepository');
const SupabaseClaimRepository = require('../repositories/supabaseClaimRepository');
const SupabaseMessageRepository = require('../repositories/supabaseMessageRepository');

const studentRepo = new SupabaseStudentRepository();
const itemRepo = new SupabaseItemRepository();
const claimRepo = new SupabaseClaimRepository();
const messageRepo = new SupabaseMessageRepository();

// Old Mongoose schemas for reading existing Mongo data
const StudentModel = mongoose.model('Student_Old', new mongoose.Schema({}, { strict: false }), 'students');
const ItemModel = mongoose.model('Item_Old', new mongoose.Schema({}, { strict: false }), 'items');
const ClaimModel = mongoose.model('Claim_Old', new mongoose.Schema({}, { strict: false }), 'ownershiprequests');
const MessageModel = mongoose.model('Message_Old', new mongoose.Schema({}, { strict: false }), 'ownershipmessages');

// ID Mapping Map: Mongo ObjectId -> Supabase UUID
const idMap = new Map();

function getUuidForObjectId(mongoId) {
  if (!mongoId) return null;
  const strId = mongoId.toString();
  if (idMap.has(strId)) return idMap.get(strId);
  const newUuid = require('crypto').randomUUID();
  idMap.set(strId, newUuid);
  return newUuid;
}

async function migrate() {
  console.log('==================================================');
  console.log('   MONGODB TO SUPABASE POSTGRESQL MIGRATION TOOL  ');
  console.log('==================================================\n');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('ℹ️  No MONGODB_URI found. Skipping historical data import.');
    process.exit(0);
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ Connected to MongoDB source database');
  } catch (err) {
    console.warn('ℹ️  Could not connect to MongoDB source (likely already removed or offline):', err.message);
    process.exit(0);
  }

  // 1. Migrate Students
  const mongoStudents = await StudentModel.find().lean();
  console.log(`\n📋 Found ${mongoStudents.length} Students in MongoDB`);
  let studentsMigrated = 0;

  for (const s of mongoStudents) {
    const studentUuid = getUuidForObjectId(s._id);
    await studentRepo.createStudent({
      id: studentUuid,
      registration_number: s.registration_number,
      name: s.name,
      email: s.email,
      class: s.class,
      section: s.section,
      parent_name: s.parent_name,
      parent_email: s.parent_email,
      status: s.status || 'active',
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    });
    studentsMigrated++;
  }
  console.log(`✅ Migrated ${studentsMigrated} Students to Supabase PostgreSQL public.students`);

  // 2. Migrate Items
  const mongoItems = await ItemModel.find().lean();
  console.log(`\n📋 Found ${mongoItems.length} Items in MongoDB`);
  let itemsMigrated = 0;

  for (const i of mongoItems) {
    const itemUuid = getUuidForObjectId(i._id);
    const studentUuid = getUuidForObjectId(i.submitted_by);

    await itemRepo.createItem({
      id: itemUuid,
      serial_number: i.serial_number,
      uid: i.uid,
      category: i.category,
      who_found: i.who_found,
      location_found: i.location_found,
      date_found: i.date_found,
      time_found: i.time_found,
      description: i.description,
      image_url: i.image_url,
      image_filename: i.image_filename,
      asset_id: i.asset_id || null,
      submitted_by: studentUuid,
      registration_number: i.registration_number,
      student_name: i.student_name,
      status: i.status || 'PUBLISHED',
      uploaded_at: i.uploaded_at,
      handover_form_url: i.handover_form_url,
      handover_form_filename: i.handover_form_filename,
      handover_asset_id: i.handover_asset_id || null,
      handover_date: i.handover_date,
      handover_notes: i.handover_notes,
      handover_student_name: i.handover_student_name,
      handover_reg_number: i.handover_reg_number,
      handover_phone: i.handover_phone,
      handover_department: i.handover_department,
      claimed_by_admin: i.claimed_by_admin,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    });
    itemsMigrated++;
  }
  console.log(`✅ Migrated ${itemsMigrated} Items to Supabase PostgreSQL public.items`);

  // 3. Migrate Ownership Requests (Claims)
  const mongoClaims = await ClaimModel.find().lean();
  console.log(`\n📋 Found ${mongoClaims.length} Claims in MongoDB`);
  let claimsMigrated = 0;

  for (const c of mongoClaims) {
    const claimUuid = getUuidForObjectId(c._id);
    const itemUuid = getUuidForObjectId(c.item_id);
    const studentUuid = getUuidForObjectId(c.student_id);

    await claimRepo.createClaim({
      id: claimUuid,
      item_id: itemUuid,
      student_id: studentUuid,
      message: c.message,
      status: c.status || 'PENDING',
      in_person_request: c.in_person_request || {},
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
    claimsMigrated++;
  }
  console.log(`✅ Migrated ${claimsMigrated} Claims to Supabase PostgreSQL public.ownership_requests`);

  // 4. Migrate Messages
  const mongoMessages = await MessageModel.find().lean();
  console.log(`\n📋 Found ${mongoMessages.length} Messages in MongoDB`);
  let messagesMigrated = 0;

  for (const m of mongoMessages) {
    const msgUuid = getUuidForObjectId(m._id);
    const claimUuid = getUuidForObjectId(m.request_id);
    const senderUuid = idMap.has(m.sender_id?.toString()) ? idMap.get(m.sender_id?.toString()) : String(m.sender_id);

    await messageRepo.createMessage({
      id: msgUuid,
      request_id: claimUuid,
      sender_id: senderUuid,
      sender_role: m.sender_role,
      message: m.message,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    });
    messagesMigrated++;
  }
  console.log(`✅ Migrated ${messagesMigrated} Messages to Supabase PostgreSQL public.ownership_messages`);

  console.log('\n==================================================');
  console.log('   🎉 MIGRATION COMPLETED SUCCESSFULLY WITH 100% PASS ');
  console.log('==================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
