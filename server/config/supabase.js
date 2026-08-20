const dotenv = require('dotenv');
dotenv.config();

const supabaseConfig = {
  url: process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
  bucket: process.env.SUPABASE_STORAGE_BUCKET || 'project-assets',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
};

module.exports = supabaseConfig;
