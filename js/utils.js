// Auth Management - VERSI DENGAN VALIDASI DATABASE

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    window.switchTab = function(tab) {
        const tabs = document.querySelectorAll('.tab-btn');
        const forms = document.querySelectorAll('.login-form');
        
        tabs.forEach(btn => btn.classList.remove('active'));
        forms.forEach(form => form.classList.remove('active'));
        
        document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
        document.getElementById(`${tab}LoginForm`).classList.add('active');
    };

    // User Login - HARUS TERDAFTAR DI DATABASE
    document.getElementById('userLoginForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nama = document.getElementById('userNama').value.toLowerCase().trim();
        
        if (!nama) {
            showAlert('Silakan masukkan nama lengkap', 'error');
            return;
        }

        try {
            // CEK APAKAH USER TERDAFTAR DI FIRESTORE
            const userQuery = await usersCollection.where('nama', '==', nama).get();
            
            if (userQuery.empty) {
                // User TIDAK ditemukan di database
                showAlert('Maaf, nama anda tidak terdaftar. Silakan hubungi admin.', 'error');
                return;
            }

            // User ditemukan, ambil data
            const userDoc = userQuery.docs[0];
            const userId = userDoc.id;
            const userData = userDoc.data();
            
            // Update last login
            await usersCollection.doc(userId).update({
                lastLogin: new Date().toISOString()
            });

            // Store user info in session
            sessionStorage.setItem('userId', userId);
            sessionStorage.setItem('userNama', nama);
            sessionStorage.setItem('userRole', 'user');

            showAlert('Login berhasil! Selamat datang ' + userData.nama, 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard-user.html';
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            showAlert('Terjadi kesalahan. Silakan coba lagi.', 'error');
        }
    });

    // Admin Login
    document.getElementById('adminLoginForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();

        if (!username || !password) {
            showAlert('Username dan password harus diisi', 'error');
            return;
        }

        try {
            // Check admin in Firestore
            const adminDoc = await adminCollection.doc(username).get();
            
            if (adminDoc.exists && adminDoc.data().password === password) {
                // Admin authenticated
                sessionStorage.setItem('adminUsername', username);
                sessionStorage.setItem('userRole', 'admin');
                
                showAlert('Login admin berhasil! Mengalihkan...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                showAlert('Username atau password salah', 'error');
            }
        } catch (error) {
            console.error('Admin login error:', error);
            showAlert('Terjadi kesalahan. Silakan coba lagi.', 'error');
        }
    });

    // Show alert function
    function showAlert(message, type) {
        // Remove existing alert
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        
        let icon = '';
        if (type === 'success') icon = 'check-circle';
        else if (type === 'error') icon = 'exclamation-circle';
        else icon = 'info-circle';
        
        alertDiv.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        // Insert at the top of form
        const activeForm = document.querySelector('.login-form.active');
        activeForm.insertBefore(alertDiv, activeForm.firstChild);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // Check if user is already logged in
    if (window.location.pathname.includes('login.html')) {
        const userRole = sessionStorage.getItem('userRole');
        if (userRole === 'user') {
            window.location.href = 'dashboard-user.html';
        } else if (userRole === 'admin') {
            window.location.href = 'admin.html';
        }
    }
});

// Logout function - BALIK KE INDEX.HTML
window.logout = function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
};
