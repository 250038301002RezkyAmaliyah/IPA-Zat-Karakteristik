// assets/js/main.js
import { supabase, getUserRole } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    // Navigasi Otomatis untuk Guru
    const navLogin = document.getElementById('nav-login');
    if (navLogin) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                getUserRole().then(role => {
                    if (role === 'teacher') {
                        navLogin.textContent = '🏠 Dashboard Guru';
                        navLogin.href = 'teacher-dashboard.html';
                    } else {
                        // User non-guru yang login, bisa logout
                        navLogin.textContent = '🚪 Logout';
                        navLogin.href = '#';
                        navLogin.addEventListener('click', async (e) => {
                            e.preventDefault();
                            await supabase.auth.signOut();
                            window.location.href = 'index.html';
                        });
                    }
                });
            }
        });
    }


    // --- Halaman Login Guru (login.html) ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const message = document.getElementById('login-message');
        message.textContent = '';

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            message.textContent = 'Login Gagal: ' + error.message;
            return;
        }

        const role = await getUserRole();
        if (role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else {
            message.textContent = 'Akses ditolak. Akun ini bukan akun Guru.';
            await supabase.auth.signOut(); // Logout user non-guru
        }
    }


    // --- Halaman Kuis (quiz.html) ---
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) {
        quizForm.addEventListener('submit', handleSubmitQuiz);
    }

    // Jawaban Benar (diambil dari SOAL PILIHAN GANDA.docx )
    const CORRECT_ANSWERS = {
        q1: 'B', q2: 'C', q3: 'B', q4: 'C', q5: 'B',
        q6: 'C', q7: 'D', q8: 'A', q9: 'C', q10: 'B',
        q11: 'A', q12: 'C', q13: 'A', q14: 'B', q15: 'B'
    };
    const TOTAL_QUESTIONS = Object.keys(CORRECT_ANSWERS).length;
    const MAX_SCORE = 100;

    async function handleSubmitQuiz(e) {
        e.preventDefault();
        const message = document.getElementById('quiz-message');
        message.textContent = 'Menghitung dan mengirim jawaban...';

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Anda harus login atau mendaftar untuk mengirim kuis (untuk siswa, ini adalah mode anonim, mohon pastikan nama Anda sudah diinput, karena ini contoh)');
            // Untuk skenario siswa anonim (tanpa auth), Anda perlu menambahkan field Nama/Email di form
            // Karena diminta Supabase Auth/RLS, kita asumsikan siswa juga login.
            message.textContent = 'Gagal. Mohon refresh halaman dan pastikan Anda login.';
            return;
        }

        let correctCount = 0;
        const studentAnswers = {};
        for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
            const questionName = `q${i}`;
            const selected = document.querySelector(`input[name="${questionName}"]:checked`);
            const answer = selected ? selected.value : null;
            studentAnswers[questionName] = answer;
            if (answer === CORRECT_ANSWERS[questionName]) {
                correctCount++;
            }
        }

        const score = Math.round((correctCount / TOTAL_QUESTIONS) * MAX_SCORE);

        // Simpan ke Supabase table: quiz_submissions
        const { error } = await supabase
            .from('quiz_submissions')
            .insert([
                { user_id: user.id, user_email: user.email, score: score, answers: studentAnswers }
            ]);

        if (error) {
            message.textContent = 'Gagal mengirim jawaban: ' + error.message;
        } else {
            message.textContent = '✔ Jawaban terkirim. Nilai hanya dapat dilihat oleh guru.';
            document.getElementById('submit-quiz-btn').disabled = true;
        }
    }


    // --- Halaman LKPD (lkpd.html) ---
    window.downloadLKPD = function(format) {
        const form = document.getElementById('lkpd-form');
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        const outputText = `
--- LEMBAR KERJA PESERTA DIDIK ---
Kelompok: ${data['kelompok']}
Kelas: ${data['kelas']}
Anggota: 
${data['anggota']}

--- JAWABAN ---
A. Pengertian Zat dan Karakteristiknya
1. Jawaban: 
${data['jawaban-1']}

B. Hasil Praktikum (Wujud Zat)
2. Benda 2 (${data['benda-2-nama']}): Wujud ${data['benda-2-wujud']}, Ciri: ${data['benda-2-ciri']}
3. Benda 3 (${data['benda-3-nama']}): Wujud ${data['benda-3-wujud']}, Ciri: ${data['benda-3-ciri']}

C. Perubahan Zat
1. Jawaban: 
${data['jawaban-c1']}
        `.trim();

        if (format === 'txt') {
            const blob = new Blob([outputText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LKPD_${data['kelompok'] || 'Kelompok'}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            document.getElementById('lkpd-message').textContent = 'Jawaban berhasil diunduh dalam format TXT!';
        } else if (format === 'pdf' && window.jspdf) {
            // EXPERIMENTAL PDF Export
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Format teks untuk PDF
            const lines = outputText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            doc.setFontSize(12);
            doc.text("LKPD Zat dan Karakteristiknya", 105, 20, null, null, 'center');
            doc.setFontSize(10);
            
            let y = 30;
            lines.forEach(line => {
                const splitText = doc.splitTextToSize(line, 180); // Wrap text at 180mm
                doc.text(splitText, 10, y);
                y += (splitText.length * 5) + 2; // Move down for next line
            });

            doc.save(`LKPD_${data['kelompok'] || 'Kelompok'}.pdf`);
            document.getElementById('lkpd-message').textContent = 'Jawaban berhasil diunduh dalam format PDF!';
        } else {
            document.getElementById('lkpd-message').textContent = 'Format tidak didukung atau pustaka jsPDF belum dimuat.';
        }
    };


    // --- Dashboard Guru (teacher-dashboard.html) ---
    const dashboardStatus = document.getElementById('dashboard-status');
    const dashboardContent = document.getElementById('dashboard-content');
    const quizTableBody = document.querySelector('#quiz-results-table tbody');
    const logoutBtn = document.getElementById('logout-btn');

    if (dashboardContent) {
        checkTeacherAccess();
        if(logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }

    async function handleLogout(e) {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    }

    async function checkTeacherAccess() {
        dashboardStatus.textContent = 'Memverifikasi...';
        const role = await getUserRole();
        
        if (role === 'teacher') {
            dashboardStatus.style.display = 'none';
            dashboardContent.style.display = 'block';
            loadQuizResults();
        } else {
            dashboardStatus.textContent = '❌ Akses Ditolak. Halaman ini hanya untuk Guru.';
            dashboardStatus.style.color = 'red';
            // Redirect non-guru atau yang belum login
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    }

    async function loadQuizResults() {
        const { data, error } = await supabase
            .from('quiz_submissions')
            .select('user_email, score, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading quiz results:', error);
            quizTableBody.innerHTML = '<tr><td colspan="3">Gagal memuat hasil kuis.</td></tr>';
            return;
        }

        quizTableBody.innerHTML = '';
        if (data.length === 0) {
            quizTableBody.innerHTML = '<tr><td colspan="3">Belum ada hasil kuis yang masuk.</td></tr>';
            return;
        }

        data.forEach(submission => {
            const row = quizTableBody.insertRow();
            row.insertCell().textContent = submission.user_email;
            row.insertCell().textContent = submission.score;
            row.insertCell().textContent = new Date(submission.created_at).toLocaleString();
        });
    }

    window.exportCSV = function() {
        const table = document.getElementById('quiz-results-table');
        let csv = [];
        const rows = table.querySelectorAll('tr');
        
        for (let i = 0; i < rows.length; i++) {
            let row = [], cols = rows[i].querySelectorAll('td, th');
            for (let j = 0; j < cols.length; j++) {
                // Tambahkan tanda kutip untuk menghindari masalah koma dalam data
                row.push('"' + cols[j].innerText.replace(/"/g, '""') + '"');
            }
            csv.push(row.join(','));
        }

        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hasil_kuis_ipa_zat_karakteristik.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
});