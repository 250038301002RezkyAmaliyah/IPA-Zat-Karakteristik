// assets/js/supabase.js

// Pastikan nilai di bawah ini adalah kunci Anda yang sebenarnya!
const SUPABASE_URL = 'https://abcdefg12345.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz...'; 

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;

/**
 * Mengambil role pengguna dari metadata.
 * Memerlukan RLS diaktifkan dan metadata 'role' diatur di Supabase Auth.
 * @returns {string} 'teacher' atau 'student' (default).
 */
async function getUserRole() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        // Asumsi: role disimpan di user_metadata -> role
        return user?.user_metadata?.role || 'student'; // Default ke 'student'
    } catch (e) {
        console.error("Error fetching user role:", e.message);
        return 'student';
    }
}

/**
 * Mengambil sesi pengguna.
 * @returns {object} Sesi pengguna atau null.
 */
async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Ekspor objek dan fungsi yang diperlukan
export { supabase, getUserRole, getSession };