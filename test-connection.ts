import { supabase } from './lib/supabase';

async function testConnection() {
    try {
        const { data, error } = await supabase.from('test_table').select('*').limit(1);
        if (error) {
            console.error('Error connecting to Supabase:', error.message);
        } else {
            console.log('Successfully connected to Supabase!');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
