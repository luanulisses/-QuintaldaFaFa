import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://glfcxeaxztqymagxjvra.supabase.co';
const supabaseKey = 'sb_publishable_QXMEsXIn4F5KwVdkZdvkPw_h6zLz21u';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing connection to:', supabaseUrl);
    try {
        // Just checking if we can get the session or a simple query
        // Since we might not have tables, let's try auth.getSession() which is safe
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Connection failed:', error.message);
        } else {
            console.log('Connection successful! Session retrieved (even if null).');
            console.log('Supabase client is configured correctly.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
