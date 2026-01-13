
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function diagnose() {
  console.log('--- DB DIAGNOSTICS ---');
  
  // 1. Check all credentials
  const { data: creds, error: credError } = await supabase
    .from('api_credentials')
    .select('id, user_id, provider, environment, is_active, masked_key');
    
  if (credError) {
    console.error('Error fetching credentials:', credError);
  } else {
    console.log(`Found ${creds?.length || 0} credentials in total.`);
    creds?.forEach(c => {
      console.log(`- User: ${c.user_id}, Provider: ${c.provider}, Env: ${c.environment}, Active: ${c.is_active}, Key: ${c.masked_key}`);
    });
  }

  // 2. Check users
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error fetching users:', userError);
  } else {
    console.log(`Found ${users.users?.length || 0} users.`);
    users.users?.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}`);
    });
  }
}

diagnose();
