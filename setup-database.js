const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database schema...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241215000000_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`   Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        // Continue with other statements as some errors might be expected (like "already exists")
      }
    }

    // Test the setup by checking if tables exist
    console.log('🔍 Verifying database setup...');

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'applications', 'contacts', 'interviews', 'documents', 'activity_logs']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
    } else {
      console.log('✅ Database setup completed successfully!');
      console.log(`📊 Created ${tables.length} tables:`, tables.map(t => t.table_name).join(', '));
    }

    // Enable RLS on all tables
    console.log('🔒 Enabling Row Level Security...');
    const tables_to_secure = ['profiles', 'applications', 'contacts', 'interviews', 'documents', 'activity_logs'];

    for (const table of tables_to_secure) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });
      if (error && !error.message.includes('already enabled')) {
        console.log(`⚠️  Could not enable RLS on ${table}:`, error.message);
      }
    }

    console.log('🎉 Database setup complete! You can now use the application.');
    console.log('🌐 Visit http://localhost:3001 to start using the job tracker!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Create a simpler version using direct SQL execution
async function setupDatabaseSimple() {
  try {
    console.log('🚀 Setting up database schema...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241215000000_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing database migration...');

    // Execute the full migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('💡 This might be normal if tables already exist. Checking table status...');
    }

    // Check if key tables exist
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('id')
      .limit(1);

    if (!appError) {
      console.log('✅ Database appears to be set up correctly!');
      console.log('🎉 Setup complete! You can now use the application.');
      console.log('🌐 Visit http://localhost:3001 to start tracking job applications!');
    } else {
      console.error('❌ Database setup verification failed:', appError.message);
      console.log('💡 You may need to run the migration manually in the Supabase dashboard.');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('💡 Please try running the migration manually in your Supabase dashboard.');
  }
}

setupDatabaseSimple();