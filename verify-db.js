import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://glfcxeaxztqymagxjvra.supabase.co';
const supabaseKey = 'sb_publishable_QXMEsXIn4F5KwVdkZdvkPw_h6zLz21u';

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
    'profiles',
    'leads',
    'events',
    'financial_movements',
    'clients',
    'packages',
    'suppliers',
    'contracts',
    'receipt_logs',
    'site_content',
    'gallery'
];

async function checkDatabase() {
    console.log('--- Database Connection and Tables Check ---');
    
    for (const table of tablesToCheck) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                if (error.code === 'PGRST116' || error.code === '42P01') {
                    console.error(`❌ Table "${table}": NOT FOUND or NOT ACCESSIBLE`);
                } else {
                    console.error(`❌ Table "${table}": Error - ${error.message} (Code: ${error.code})`);
                }
            } else {
                console.log(`✅ Table "${table}": OK (Records: ${count})`);
            }
        } catch (err) {
            console.error(`❌ Table "${table}": Unexpected error - ${err.message}`);
        }
    }
    console.log('-------------------------------------------');
}

checkDatabase();
