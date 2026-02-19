import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://glfcxeaxztqymagxjvra.supabase.co';
const supabaseKey = 'sb_publishable_QXMEsXIn4F5KwVdkZdvkPw_h6zLz21u';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Listing tables...');
    // We can't easily list tables with just the client unless we have access to information_schema or a specific function.
    // But we can try to query common tables to see if they exist.
    const tablesToCheck = ['leads', 'events', 'financial', 'profiles'];

    for (const table of tablesToCheck) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`Table '${table}': Not found or error: ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`Table '${table}': Found!`);
        }
    }
}

listTables();
