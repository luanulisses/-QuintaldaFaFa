import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://glfcxeaxztqymagxjvra.supabase.co';
const supabaseKey = 'sb_publishable_QXMEsXIn4F5KwVdkZdvkPw_h6zLz21u';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
    console.log('Seeding data...');

    // 1. Leads
    const { data: leads, error: leadError } = await supabase.from('leads').insert([
        { name: 'Maria Silva', contact: 'maria@email.com', status: 'new', source: 'Instagram' },
        { name: 'João Santos', contact: '11999999999', status: 'qualified', source: 'Indicação' },
        { name: 'Empresa ABC', contact: 'contato@abc.com', status: 'contacted', source: 'Site' }
    ]).select();

    if (leadError) console.error('Error seeding leads:', leadError);
    else console.log('Leads seeded:', leads.length);

    // 2. Events
    // We need a lead ID for the event, let's use the first one if available, otherwise null
    const leadId = leads && leads.length > 0 ? leads[0].id : null;

    const { data: events, error: eventError } = await supabase.from('events').insert([
        {
            title: 'Aniversário de 15 Anos',
            start_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            end_date: new Date(Date.now() + 90000000).toISOString(),
            type: 'birthday',
            status: 'confirmed',
            client_id: leadId

        },
        {
            title: 'Casamento Lucas e Ana',
            start_date: new Date(Date.now() + 604800000).toISOString(), // Next week
            end_date: new Date(Date.now() + 608400000).toISOString(),
            type: 'wedding',
            status: 'pending'
        }
    ]).select();

    if (eventError) console.error('Error seeding events:', eventError);
    else console.log('Events seeded:', events.length);

    // 3. Financial
    const { error: finError } = await supabase.from('financial').insert([
        { type: 'income', amount: 5000.00, description: 'Sinal Casamento', date: new Date().toISOString(), status: 'paid', category: 'Vendas' },
        { type: 'expense', amount: 200.00, description: 'Conta de Luz', date: new Date().toISOString(), status: 'pending', category: 'Utilidades' }
    ]);

    if (finError) console.error('Error seeding financial:', finError);
    else console.log('Financial data seeded.');
}

seedData();
