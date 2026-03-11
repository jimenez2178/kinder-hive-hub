
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gwigjfkabmgigvzkfwgi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3aWdqZmthYm1naWd2emtmd2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjA2NTcsImV4cCI6MjA4ODUzNjY1N30.NeOwmrQiexs0dbGa5cnZx7UCN0MSiiMNuBmcS6JIpdU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPerfiles() {
    console.log('--- PERFILES ---');
    const { data, error } = await supabase.from('perfiles').select('*');
    if (error) console.error('Error Perfiles:', error);
    else console.log('Perfiles:', JSON.stringify(data, null, 2));

    console.log('--- ESTUDIANTES ---');
    const { data: est, error: errEst } = await supabase.from('estudiantes').select('*');
    if (errEst) console.error('Error Estudiantes:', errEst);
    else console.log('Estudiantes:', JSON.stringify(est, null, 2));
}

checkPerfiles();
