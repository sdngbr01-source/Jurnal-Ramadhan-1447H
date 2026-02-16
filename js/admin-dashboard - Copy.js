// Admin Dashboard JavaScript - LENGKAP

// Global variables
let currentAdmin = '';
let charts = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is logged in
    currentAdmin = sessionStorage.getItem('adminUsername');
    if (!currentAdmin) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display admin name
    document.getElementById('adminName').textContent = currentAdmin;
    
    // Load initial data
    loadDashboardData();
    loadUsers();
    
    // Setup event listeners
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    // Search user
    document.getElementById('searchUser')?.addEventListener('input', debounce(loadUsers, 500));
    
    // Filter kelas
    document.getElementById('filterKelas')?.addEventListener('change', loadUsers);
    document.getElementById('filterKelasData')?.addEventListener('change', loadDataTable);
    
    // Sort data
    document.getElementById('sortData')?.addEventListener('change', loadDataTable);
    
    // Search nama
    document.getElementById('searchNama')?.addEventListener('input', debounce(loadDataTable, 500));
    
    // Filter tanggal
    document.getElementById('filterTanggal')?.addEventListener('change', loadDataTable);
    
    // File upload preview
    document.getElementById('excelFile')?.addEventListener('change', previewExcel);
}

// Show section function
window.showSection = function(section) {
    // Update active class in sidebar
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        li.classList.remove('active');
    });
    event.target.closest('li').classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'Management User',
        'data': 'Management Data',
        'export': 'Export Data'
    };
    document.getElementById('pageTitle').textContent = titles[section];
    
    // Show selected section
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });
    document.getElementById(section + 'Section').classList.add('active');
    
    // Load data if needed
    if (section === 'data') {
        loadDataTable();
    } else if (section === 'users') {
        loadUsers();
    }
};

// ===== DASHBOARD FUNCTIONS =====
async function loadDashboardData() {
    try {
        showLoading('dashboardSection');
        
        // Get total users
        const usersSnapshot = await usersCollection.get();
        document.getElementById('totalUsers').textContent = usersSnapshot.size;
        
        // Get total admins
        const adminsSnapshot = await adminCollection.get();
        document.getElementById('totalAdmins').textContent = adminsSnapshot.size;
        
        // Get total jurnal
        const jurnalSnapshot = await jurnalCollection.get();
        document.getElementById('totalJurnal').textContent = jurnalSnapshot.size;
        
        // Calculate scores
        let totalScore = 0;
        let skorPuasa = 0;
        let skorSholatWajib = 0;
        let skorTarawih = 0;
        let skorTadarus = 0;
        let skorJumat = 0;
        let skorInfaq = 0;
        
        jurnalSnapshot.forEach(doc => {
            const data = doc.data();
            totalScore += data.totalScore || 0;
            
            // Puasa
            if (data.puasa?.status === 'ya') skorPuasa += 1;
            
            // Shalat wajib
            if (data.shalat) {
                Object.values(data.shalat).forEach(shalat => {
                    if (shalat?.status === 'ya') {
                        skorSholatWajib += shalat.jamaah === 'berjamaah' ? 2 : 1;
                    }
                });
            }
            
            // Tarawih
            if (data.tarawih?.status === 'ya') skorTarawih += 1;
            
            // Tadarus
            if (data.tadarus?.status === 'ya') skorTadarus += 1;
            
            // Jumat
            if (data.shalat_jumat?.status === 'ya') skorJumat += 1;
            
            // Infaq
            if (data.infaq === 'ya') skorInfaq += 1;
        });
        
        document.getElementById('totalScore').textContent = totalScore;
        document.getElementById('skorPuasa').textContent = skorPuasa;
        document.getElementById('skorSholatWajib').textContent = skorSholatWajib;
        document.getElementById('skorTarawih').textContent = skorTarawih;
        document.getElementById('skorTadarus').textContent = skorTadarus;
        document.getElementById('skorJumat').textContent = skorJumat;
        document.getElementById('skorInfaq').textContent = skorInfaq;
        
        // Initialize charts
        initCharts({
            puasa: skorPuasa,
            sholatWajib: skorSholatWajib,
            tarawih: skorTarawih,
            tadarus: skorTadarus,
            jumat: skorJumat,
            infaq: skorInfaq
        });
        
        hideLoading('dashboardSection');
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Gagal memuat dashboard', 'error');
        hideLoading('dashboardSection');
    }
}

function initCharts(data) {
    // Destroy existing charts
    if (charts.ibadah) charts.ibadah.destroy();
    if (charts.kehadiran) charts.kehadiran.destroy();
    
    // Ibadah Chart
    const ctx1 = document.getElementById('ibadahChart')?.getContext('2d');
    if (ctx1) {
        charts.ibadah = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Puasa', 'Sholat Wajib', 'Tarawih', 'Tadarus', 'Jumat', 'Infaq'],
                datasets: [{
                    label: 'Total Skor',
                    data: [
                        data.puasa,
                        data.sholatWajib,
                        data.tarawih,
                        data.tadarus,
                        data.jumat,
                        data.infaq
                    ],
                    backgroundColor: [
                        '#1e3c72',
                        '#2a5298',
                        '#ffd700',
                        '#4CAF50',
                        '#ff9800',
                        '#e91e63'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Kehadiran Chart
    const ctx2 = document.getElementById('kehadiranChart')?.getContext('2d');
    if (ctx2) {
        const total = data.puasa + data.sholatWajib + data.tarawih + data.tadarus + data.jumat + data.infaq;
        const maxPossible = total * 2; // Approximate
        const hadir = total;
        const tidakHadir = maxPossible - total;
        
        charts.kehadiran = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Hadir', 'Tidak Hadir'],
                datasets: [{
                    data: [hadir, tidakHadir > 0 ? tidakHadir : 0],
                    backgroundColor: ['#4CAF50', '#ff4757'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '60%'
            }
        });
    }
}

// ===== USER MANAGEMENT FUNCTIONS =====
async function loadUsers() {
    try {
        const searchTerm = document.getElementById('searchUser')?.value.toLowerCase() || '';
        const kelasFilter = document.getElementById('filterKelas')?.value || '';
        
        const snapshot = await usersCollection.get();
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Loading data...</td></tr>';
        
        let no = 1;
        let hasData = false;
        let html = '';
        
        for (const doc of snapshot.docs) {
            const user = doc.data();
            
            // Filter by search term
            if (searchTerm && !user.nama.toLowerCase().includes(searchTerm)) {
                continue;
            }
            
            // Filter by kelas
            if (kelasFilter && user.kelas !== kelasFilter) {
                continue;
            }
            
            hasData = true;
            
            // Get user's jurnal count and total score
            const jurnalSnapshot = await jurnalCollection
                .where('userId', '==', doc.id)
                .get();
            
            let totalSkor = 0;
            jurnalSnapshot.forEach(j => {
                totalSkor += j.data().totalScore || 0;
            });
            
            html += `
                <tr>
                    <td>${no++}</td>
                    <td>${user.nama}</td>
                    <td>${user.kelas || '-'}</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>${user.lastLogin ? formatDateTime(user.lastLogin) : '-'}</td>
                    <td>${jurnalSnapshot.size}</td>
                    <td>${totalSkor}</td>
                    <td>
                        <button class="btn-edit" onclick="editUser('${doc.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteUser('${doc.id}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
        
        if (!hasData) {
            html = '<tr><td colspan="8" style="text-align: center;">Tidak ada data user</td></tr>';
        }
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Gagal memuat data user', 'error');
    }
}

// Show add user modal
window.showAddUserModal = function() {
    document.getElementById('modalTitle').textContent = 'Tambah User Baru';
    document.getElementById('userNama').value = '';
    document.getElementById('userKelas').value = '';
    document.getElementById('userForm').dataset.userId = '';
    document.getElementById('userModal').style.display = 'block';
};

// Edit user
window.editUser = async function(userId) {
    try {
        const userDoc = await usersCollection.doc(userId).get();
        const user = userDoc.data();
        
        document.getElementById('modalTitle').textContent = 'Edit User';
        document.getElementById('userNama').value = user.nama;
        document.getElementById('userKelas').value = user.kelas || '';
        document.getElementById('userForm').dataset.userId = userId;
        
        document.getElementById('userModal').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading user:', error);
        showAlert('Gagal memuat data user', 'error');
    }
};

// Delete user
window.deleteUser = async function(userId) {
    if (!confirm('Yakin ingin menghapus user ini? Semua jurnal user ini juga akan terhapus.')) return;
    
    try {
        // Delete user's jurnal first
        const jurnalSnapshot = await jurnalCollection
            .where('userId', '==', userId)
            .get();
        
        const batch = db.batch();
        jurnalSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Delete user
        batch.delete(usersCollection.doc(userId));
        
        await batch.commit();
        
        showAlert('User berhasil dihapus', 'success');
        loadUsers();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Gagal menghapus user', 'error');
    }
};

// Form submit for user
document.getElementById('userForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nama = document.getElementById('userNama').value.toLowerCase().trim();
    const kelas = document.getElementById('userKelas').value;
    const userId = this.dataset.userId;
    
    if (!nama || !kelas) {
        showAlert('Nama dan kelas harus diisi', 'error');
        return;
    }
    
    try {
        if (userId) {
            // Update existing user
            await usersCollection.doc(userId).update({
                nama: nama,
                kelas: kelas,
                updatedAt: new Date().toISOString()
            });
            showAlert('User berhasil diperbarui', 'success');
        } else {
            // Check if user already exists
            const existingUser = await usersCollection
                .where('nama', '==', nama)
                .get();
            
            if (!existingUser.empty) {
                showAlert('User dengan nama tersebut sudah ada', 'error');
                return;
            }
            
            // Create new user
            await usersCollection.add({
                nama: nama,
                kelas: kelas,
                createdAt: new Date().toISOString(),
                lastLogin: null
            });
            showAlert('User berhasil ditambahkan', 'success');
        }
        
        closeModal('userModal');
        loadUsers();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error saving user:', error);
        showAlert('Gagal menyimpan user', 'error');
    }
});

// ===== UPLOAD EXCEL FUNCTIONS =====
window.showUploadModal = function() {
    document.getElementById('excelFile').value = '';
    document.getElementById('previewData').innerHTML = '<p class="text-muted">Belum ada file dipilih</p>';
    document.getElementById('uploadModal').style.display = 'block';
};

function previewExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // Preview first 5 rows
            let preview = '<table class="table table-sm">';
            for (let i = 0; i < Math.min(rows.length, 6); i++) {
                preview += '<tr>';
                for (let j = 0; j < Math.min(rows[i].length, 2); j++) {
                    if (i === 0) {
                        preview += `<th>${rows[i][j] || 'Kolom ' + (j+1)}</th>`;
                    } else {
                        preview += `<td>${rows[i][j] || '-'}</td>`;
                    }
                }
                preview += '</tr>';
            }
            preview += '</table>';
            preview += `<p>Total data: ${rows.length - 1} baris</p>`;
            
            document.getElementById('previewData').innerHTML = preview;
            
        } catch (error) {
            console.error('Error previewing Excel:', error);
            document.getElementById('previewData').innerHTML = '<p class="text-error">Gagal membaca file</p>';
        }
    };
    reader.readAsArrayBuffer(file);
}

window.downloadTemplate = function() {
    const data = [
        ['Nama Lengkap', 'Kelas'],
        ['Ahmad Fauzi', '1A'],
        ['Siti Aminah', '1B'],
        ['Budi Santoso', '2A']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template User');
    XLSX.writeFile(workbook, 'template_user_ramadhan.xlsx');
};

document.getElementById('uploadForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const file = document.getElementById('excelFile').files[0];
    if (!file) {
        showAlert('Pilih file Excel terlebih dahulu', 'error');
        return;
    }
    
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                // Skip header row
                const users = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row.length >= 2 && row[0] && row[1]) {
                        users.push({
                            nama: row[0].toString().toLowerCase().trim(),
                            kelas: row[1].toString().trim(),
                            createdAt: new Date().toISOString(),
                            lastLogin: null
                        });
                    }
                }
                
                if (users.length === 0) {
                    showAlert('Tidak ada data valid dalam file', 'error');
                    return;
                }
                
                // Upload to Firestore
                const batch = db.batch();
                let successCount = 0;
                
                for (const user of users) {
                    // Check if user already exists
                    const existingUser = await usersCollection
                        .where('nama', '==', user.nama)
                        .get();
                    
                    if (existingUser.empty) {
                        const docRef = usersCollection.doc();
                        batch.set(docRef, user);
                        successCount++;
                    }
                }
                
                if (successCount > 0) {
                    await batch.commit();
                    showAlert(`Berhasil menambahkan ${successCount} user baru`, 'success');
                } else {
                    showAlert('Tidak ada user baru yang ditambahkan (semua sudah ada)', 'warning');
                }
                
                closeModal('uploadModal');
                loadUsers();
                loadDashboardData();
                
            } catch (error) {
                console.error('Error processing Excel:', error);
                showAlert('Gagal memproses file Excel', 'error');
            }
        };
        reader.readAsArrayBuffer(file);
        
    } catch (error) {
        console.error('Error uploading:', error);
        showAlert('Gagal upload file', 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload';
    }
});

// ===== DATA MANAGEMENT FUNCTIONS =====
async function loadDataTable() {
    try {
        const sortBy = document.getElementById('sortData')?.value || 'tertinggi';
        const kelasFilter = document.getElementById('filterKelasData')?.value || '';
        const searchNama = document.getElementById('searchNama')?.value.toLowerCase() || '';
        const tanggalFilter = document.getElementById('filterTanggal')?.value || '';
        
        let query = jurnalCollection;
        
        if (tanggalFilter) {
            query = query.where('tanggal', '==', tanggalFilter);
        }
        
        const snapshot = await query.get();
        const data = [];
        
        // Get user data for each jurnal
        for (const doc of snapshot.docs) {
            const jurnal = doc.data();
            
            // Get user info
            const userDoc = await usersCollection.doc(jurnal.userId).get();
            if (!userDoc.exists) continue;
            
            const user = userDoc.data();
            
            // Apply kelas filter
            if (kelasFilter && user.kelas !== kelasFilter) {
                continue;
            }
            
            // Apply search filter
            if (searchNama && !user.nama.toLowerCase().includes(searchNama)) {
                continue;
            }
            
            data.push({
                id: doc.id,
                ...jurnal,
                userName: user.nama,
                userKelas: user.kelas
            });
        }
        
        // Sort data
        sortData(data, sortBy);
        
        // Display data
        displayDataTable(data);
        
    } catch (error) {
        console.error('Error loading data table:', error);
        showAlert('Gagal memuat data jurnal', 'error');
    }
}

function sortData(data, sortBy) {
    switch(sortBy) {
        case 'tertinggi':
            data.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
            break;
        case 'terendah':
            data.sort((a, b) => (a.totalScore || 0) - (b.totalScore || 0));
            break;
        case 'az':
            data.sort((a, b) => a.userName.localeCompare(b.userName));
            break;
        case 'za':
            data.sort((a, b) => b.userName.localeCompare(a.userName));
            break;
    }
}

function displayDataTable(data) {
    const tbody = document.getElementById('dataTableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="26" style="text-align: center;">Tidak ada data jurnal</td></tr>';
        return;
    }
    
    let html = '';
    data.forEach((item, index) => {
        html += createDataRow(item, index + 1);
    });
    
    tbody.innerHTML = html;
}

function createDataRow(data, no) {
    const shalat = data.shalat || {};
    
    return `
        <tr>
            <td>${no}</td>
            <td>${formatDate(data.tanggal)}</td>
            <td>${data.userName}</td>
            <td>${data.userKelas || '-'}</td>
            
            <!-- Puasa -->
            <td>${data.puasa?.status || '-'}</td>
            <td>${data.puasa?.status === 'ya' ? 1 : 0}</td>
            
            <!-- Subuh -->
            <td>${shalat.subuh?.status || '-'}</td>
            <td>${shalat.subuh?.jam || '-'}</td>
            <td>${getShalatScore(shalat.subuh)}</td>
            
            <!-- Dzuhur -->
            <td>${shalat.dzuhur?.status || '-'}</td>
            <td>${shalat.dzuhur?.jam || '-'}</td>
            <td>${getShalatScore(shalat.dzuhur)}</td>
            
            <!-- Ashar -->
            <td>${shalat.ashar?.status || '-'}</td>
            <td>${shalat.ashar?.jam || '-'}</td>
            <td>${getShalatScore(shalat.ashar)}</td>
            
            <!-- Magrib -->
            <td>${shalat.magrib?.status || '-'}</td>
            <td>${shalat.magrib?.jam || '-'}</td>
            <td>${getShalatScore(shalat.magrib)}</td>
            
            <!-- Isya -->
            <td>${shalat.isya?.status || '-'}</td>
            <td>${shalat.isya?.jam || '-'}</td>
            <td>${getShalatScore(shalat.isya)}</td>
            
            <td>${data.tarawih?.status === 'ya' ? '✅' : '❌'}</td>
            <td>${data.tadarus?.status === 'ya' ? '✅' : '❌'}</td>
            <td>${data.shalat_jumat?.status === 'ya' ? '✅' : (data.shalat_jumat?.status === 'perempuan' ? '👩' : '❌')}</td>
            <td>${data.infaq === 'ya' ? '✅' : '❌'}</td>
            <td><strong>${data.totalScore || 0}</strong></td>
        </tr>
    `;
}

function getShalatScore(shalat) {
    if (!shalat || shalat.status !== 'ya') return 0;
    return shalat.jamaah === 'berjamaah' ? 2 : 1;
}

// ===== EXPORT FUNCTIONS =====
window.exportToExcel = async function() {
    const kelas = document.getElementById('exportKelas')?.value || '';
    
    try {
        showAlert('Menyiapkan data untuk export...', 'info');
        
        const snapshot = await jurnalCollection.get();
        const data = [];
        
        for (const doc of snapshot.docs) {
            const jurnal = doc.data();
            const userDoc = await usersCollection.doc(jurnal.userId).get();
            
            if (!userDoc.exists) continue;
            
            const user = userDoc.data();
            
            if (kelas && user.kelas !== kelas) continue;
            
            const shalat = jurnal.shalat || {};
            
            data.push({
                'Tanggal': jurnal.tanggal,
                'Nama': user.nama,
                'Kelas': user.kelas,
                'Puasa': jurnal.puasa?.status || '-',
                'Skor Puasa': jurnal.puasa?.status === 'ya' ? 1 : 0,
                
                'Subuh Status': shalat.subuh?.status || '-',
                'Subuh Jam': shalat.subuh?.jam || '-',
                'Skor Subuh': getShalatScore(shalat.subuh),
                
                'Dzuhur Status': shalat.dzuhur?.status || '-',
                'Dzuhur Jam': shalat.dzuhur?.jam || '-',
                'Skor Dzuhur': getShalatScore(shalat.dzuhur),
                
                'Ashar Status': shalat.ashar?.status || '-',
                'Ashar Jam': shalat.ashar?.jam || '-',
                'Skor Ashar': getShalatScore(shalat.ashar),
                
                'Magrib Status': shalat.magrib?.status || '-',
                'Magrib Jam': shalat.magrib?.jam || '-',
                'Skor Magrib': getShalatScore(shalat.magrib),
                
                'Isya Status': shalat.isya?.status || '-',
                'Isya Jam': shalat.isya?.jam || '-',
                'Skor Isya': getShalatScore(shalat.isya),
                
                'Tarawih': jurnal.tarawih?.status === 'ya' ? 'Ya' : 'Tidak',
                'Tadarus': jurnal.tadarus?.status === 'ya' ? 'Ya' : 'Tidak',
                'Jumat': jurnal.shalat_jumat?.status === 'ya' ? 'Ya' : 
                         (jurnal.shalat_jumat?.status === 'perempuan' ? 'Perempuan' : 'Tidak'),
                'Infaq': jurnal.infaq === 'ya' ? 'Ya' : 'Tidak',
                'Total Skor': jurnal.totalScore || 0
            });
        }
        
        if (data.length === 0) {
            showAlert('Tidak ada data untuk diexport', 'warning');
            return;
        }
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Jurnal Ramadhan");
        
        const fileName = `jurnal_ramadhan_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        showAlert('Data berhasil diexport', 'success');
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showAlert('Gagal export data', 'error');
    }
};

window.exportUsersJSON = async function() {
    try {
        const snapshot = await usersCollection.get();
        const users = [];
        
        snapshot.forEach(doc => {
            users.push({
                id: doc.id,
                nama: doc.data().nama,
                kelas: doc.data().kelas,
                createdAt: doc.data().createdAt,
                lastLogin: doc.data().lastLogin
            });
        });
        
        const jsonStr = JSON.stringify(users, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showAlert('Data user berhasil diexport', 'success');
        
    } catch (error) {
        console.error('Error exporting users:', error);
        showAlert('Gagal export data user', 'error');
    }
};

window.exportAllJurnalJSON = async function() {
    try {
        const snapshot = await jurnalCollection.get();
        const jurnals = [];
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const userDoc = await usersCollection.doc(data.userId).get();
            const user = userDoc.data();
            
            jurnals.push({
                id: doc.id,
                ...data,
                userName: user?.nama,
                userKelas: user?.kelas
            });
        }
        
        const jsonStr = JSON.stringify(jurnals, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `all_jurnal_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showAlert('Data jurnal berhasil diexport', 'success');
        
    } catch (error) {
        console.error('Error exporting jurnal:', error);
        showAlert('Gagal export data jurnal', 'error');
    }
};

// ===== UTILITY FUNCTIONS =====
window.closeModal = function(modalId) {
    document.getElementById(modalId).style.display = 'none';
};

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : (type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle')}"></i>
        <span>${message}</span>
    `;
    
    const adminContent = document.querySelector('.admin-content');
    adminContent.insertBefore(alertDiv, adminContent.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function showLoading(sectionId) {
    const section = document.getElementById(sectionId + 'Section');
    if (section) {
        section.style.opacity = '0.6';
        section.style.pointerEvents = 'none';
    }
}

function hideLoading(sectionId) {
    const section = document.getElementById(sectionId + 'Section');
    if (section) {
        section.style.opacity = '1';
        section.style.pointerEvents = 'auto';
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Logout function
window.logout = function() {
    sessionStorage.clear();
    window.location.href = 'login.html';
};

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};