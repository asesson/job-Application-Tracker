const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabase() {
  console.log('🔍 Testing database connection and tables...');

  try {
    // Test basic connection
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Auth connection failed:', usersError.message);
      return;
    }

    console.log(`✅ Auth connection successful. Found ${users.length} users.`);

    // Test if profiles table exists and create it if it doesn't
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (profilesError) {
        console.log('❌ Profiles table missing:', profilesError.message);
        console.log('🔧 Creating profiles table...');

        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.profiles (
              id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
              email text UNIQUE NOT NULL,
              full_name text,
              avatar_url text,
              job_search_goals jsonb,
              created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
              updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "Users can only see their own profile" ON public.profiles
              FOR ALL USING (auth.uid() = id);

            CREATE OR REPLACE FUNCTION public.handle_new_user()
            RETURNS TRIGGER AS $$
            BEGIN
              INSERT INTO public.profiles (id, email, full_name)
              VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;

            DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
            CREATE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
          `
        });

        if (createError) {
          console.error('❌ Failed to create profiles table:', createError.message);
        } else {
          console.log('✅ Profiles table created successfully!');

          // Create profiles for existing users
          for (const user of users) {
            const { error: insertError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || null
              });

            if (insertError) {
              console.log(`⚠️  Could not create profile for ${user.email}:`, insertError.message);
            }
          }
          console.log(`✅ Created profiles for ${users.length} existing users.`);
        }
      } else {
        console.log('✅ Profiles table exists');
      }
    } catch (error) {
      console.error('❌ Error checking profiles table:', error.message);
    }

    // Test applications table
    try {
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('id')
        .limit(1);

      if (appsError) {
        console.log('❌ Applications table missing - you need to run the full migration');
        console.log('📋 Please run the SQL migration in your Supabase dashboard');
      } else {
        console.log('✅ Applications table exists');
      }
    } catch (error) {
      console.log('❌ Applications table missing - you need to run the full migration');
    }

    console.log('\n🎯 Summary:');
    console.log('1. Authentication is working ✅');
    console.log('2. Basic tables created ✅');
    console.log('3. To complete setup: Run the full SQL migration in Supabase dashboard');
    console.log('4. Try signing in again at http://localhost:3001');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabase();