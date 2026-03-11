
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwigjfkabmgigvzkfwgi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3aWdqZmthYm1naWd2emtmd2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjA2NTcsImV4cCI6MjA4ODUzNjY1N30.NeOwmrQiexs0dbGa5cnZx7UCN0MSiiMNuBmcS6JIpdU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
    // This probably won't work with Anon key, but let's try a safe update first
    console.log('Testing connection...');
    const { data, error } = await supabase.from('estudiantes').select('id').limit(1);
    if (error) {
        console.error('Connection failed:', error);
        return;
    }
    console.log('Connection OK. Attempting to add column via RPC if available or just logging...');
    
    // Since we don't have SQL access easily, let's see if we can use an RPC for SQL
    // (If the user has one set up)
    
    console.log('If this fails, we will try to use the profile "nombre" as the link.');
}

runSQL();
