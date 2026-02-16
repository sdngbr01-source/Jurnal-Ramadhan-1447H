// Admin Dashboard JavaScript - VERSI FINAL

// Global variables
let currentAdmin = '';
let charts = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin dashboard loaded');
    
    // Check if admin is logged in
    currentAdmin = sessionStorage.getItem('adminUsername');
    if (!currentAdmin) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display admin name
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        adminNameEl.textContent = currentAdmin;
    }
    
    // Tambahkan tombol Test Connection
    addTestConnectionButton();
    
    // Load initial data
    await loadDashboardData();
    await loadUsers();
    
    // Setup event listeners
    setupEventListeners();
});

// Tambah tombol test connection
function addTestConnectionButton() {
    const adminInfo = document.querySelector('.admin-info');
    if (adminInfo) {
        const testBtn = document.createElement('button');
        testBtn.className = 'btn-success';
        testBtn.style.marginLeft = '10px';
        testBtn.innerHTML = '<i class="fas fa-plug"></i> Test DB';
        testBtn.onclick = checkFirestoreConnection;
        adminInfo.appendChild(testBtn);
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Search user
    const searchUser = document.getElementById('searchUser');
    if (searchUser) {
        searchUser.addEventListener('input', debounce(loadUsers, 500));
    }
    
    // Filter kelas
    const filterKelas = document.getElementById('filterKelas');
    if (filterKelas) {
        filterKelas.addEventListener('change', loadUsers);
    }
    
    const filterKelasData = document.getElementById('filterKelasData');
    if (filterKelasData) {
        filterKelasData.addEventListener('change', loadDataTable);
    }
    
    // Sort data
    const sortData = document.getElementById('sortData');
    if (sortData) {
        sortData.addEventListener('change', loadDataTable);
    }
    
    // Search nama
    const searchNama = document.getElementById('searchNama');
    if (searchNama) {
        searchNama.addEventListener('input', debounce(loadDataTable, 500));
    }
    
    // Filter tanggal
    const filterTanggal = document.getElementById('filterTanggal');
    if (filterTanggal) {
        filterTanggal.addEventListener('change', loadDataTable);
    }
    
    // File upload preview
    const excelFile = document.getElementById('excelFile');
    if (excelFile) {
        excelFile.addEventListener('change', previewExcel);
    }
}

// Show section function
window.showSection = function(section) {
    // Update active class in sidebar
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Find the clicked link and add active class to its parent li
    const activeLink = event.target.closest('a');
    if (activeLink) {
        activeLink.closest('li').classList.add('active');
    }
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'Management User',
        'data': 'Management Data',
        'export': 'Export Data'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[section] || 'Dashboard';
    }
    
    // Show selected section
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });
    
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
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
        console.log('Loading dashboard data...');
        
        // Get total users
        const usersSnapshot = await usersCollection.get();
        const totalUsers = document.getElementById('totalUsers');
        if (totalUsers) totalUsers.textContent = usersSnapshot.size;
        
        // Get total admins
        const adminsSnapshot = await adminCollection.get();
        const totalAdmins = document.getElementById('totalAdmins');
        if (totalAdmins) totalAdmins.textContent = adminsSnapshot.size;
        
        // Get total jurnal
        const jurnalSnapshot = await jurnalCollection.get();
        const totalJurnal = document.getElementById('totalJurnal');
        if (totalJurnal) totalJurnal.textContent = jurnalSnapshot.size;
        
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
        
        const totalScoreEl = document.getElementById('totalScore');
        if (totalScoreEl) totalScoreEl.textContent = totalScore;
        
        const skorPuasaEl = document.getElementById('skorPuasa');
        if (skorPuasaEl) skorPuasaEl.textContent = skorPuasa;
        
        const skorSholatWajibEl = document.getElementById('skorSholatWajib');
        if (skorSholatWajibEl) skorSholatWajibEl.textContent = skorSholatWajib;
        
        const skorTarawihEl = document.getElementById('skorTarawih');
        if (skorTarawihEl) skorTarawihEl.textContent = skorTarawih;
        
        const skorTadarusEl = document.getElementById('skorTadarus');
        if (skorTadarusEl) skorTadarusEl.textContent = skorTadarus;
        
        const skorJumatEl = document.getElementById('skorJumat');
        if (skorJumatEl) skorJumatEl.textContent = skorJumat;
        
        const skorInfaqEl = document.getElementById('skorInfaq');
        if (skorInfaqEl) skorInfaqEl.textContent = skorInfaq;
        
        // Initialize charts
        initCharts({
            puasa: skorPuasa,
            sholatWajib: skorSholatWajib,
            tarawih: skorTarawih,
            tadarus: skorTadarus,
            jumat: skorJumat,
            infaq: skorInfaq
        });
        
        console.log('Dashboard data loaded successfully');
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        
        if (error.code === 'permission-denied') {
            showAlert('Permission denied! Atur security rules Firestore terlebih dahulu.', 'error');
        } else {
            showAlert('Gagal memuat dashboard: ' + error.message, 'error');
        }
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
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Kehadiran Chart
    const ctx2 = document.getElementById('kehadiranChart')?.getContext('2d');
    if (ctx2) {
        const total = data.puasa + data.sholatWajib + data.tarawih + data.tadarus + data.jumat + data.infaq;
        const hadir = total;
        const tidakHadir = Math.max(0, total * 2 - total); // Simple calculation
        
        charts.kehadiran = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Hadir', 'Tidak Hadir'],
                datasets: [{
                    data: [hadir, tidakHadir],
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
                }
            }
        });
    }
}

// ===== USER MANAGEMENT FUNCTIONS =====
async function loadUsers() {
    try {
        console.log('Loading users...');
        
        const searchTerm = document.getElementById('searchUser')?.value.toLowerCase() || '';
        const kelasFilter = document.getElementById('filterKelas')?.value || '';
        
        const snapshot = await usersCollection.get();
        const tbody = document.getElementById('usersTableBody');
        
        if (!tbody) {
            console.error('usersTableBody not found');
            return;
        }
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Belum ada data user. Silakan tambah user baru.</td></tr>';
            return;
        }
        
        let no = 1;
        let html = '';
        
        for (const doc of snapshot.docs) {
            const user = doc.data();
            const userId = doc.id;
            
            // Filter by search term
            if (searchTerm && !user.nama?.toLowerCase().includes(searchTerm)) {
                continue;
            }
            
            // Filter by kelas
            if (kelasFilter && user.kelas !== kelasFilter) {
                continue;
            }
            
            // Get user's jurnal count and total score
            let jurnalCount = 0;
            let totalSkor = 0;
            
            try {
                const jurnalSnapshot = await jurnalCollection
                    .where('userId', '==', userId)
                    .get();
                
                jurnalCount = jurnalSnapshot.size;
                jurnalSnapshot.forEach(j => {
                    totalSkor += j.data().totalScore || 0;
                });
            } catch (error) {
                console.error('Error loading jurnal for user:', error);
            }
            
            html += `
                <tr>
                    <td>${no++}</td>
                    <td>${user.nama || '-'}</td>
                    <td>${user.kelas || '-'}</td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>${user.lastLogin ? formatDateTime(user.lastLogin) : '-'}</td>
                    <td>${jurnalCount}</td>
                    <td>${totalSkor}</td>
                    <td>
                        <button class="btn-edit" onclick="editUser('${userId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteUser('${userId}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
        
        if (html === '') {
            html = '<tr><td colspan="8" style="text-align: center;">Tidak ada data sesuai filter</td></tr>';
        }
        
        tbody.innerHTML = html;
        console.log('Users loaded successfully');
        
    } catch (error) {
        console.error('Error loading users:', error);
        
        if (error.code === 'permission-denied') {
            showAlert('Permission denied! Atur security rules Firestore terlebih dahulu.', 'error');
            document.getElementById('usersTableBody').innerHTML = 
                '<tr><td colspan="8" style="text-align: center; color: red;">Error: Permission denied. Hubungi administrator.</td></tr>';
        } else {
            showAlert('Gagal memuat data user: ' + error.message, 'error');
        }
    }
}

// Show add user modal
window.showAddUserModal = function() {
    console.log('Showing add user modal');
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Tambah User Baru';
    }
    
    const userNama = document.getElementById('userNama');
    if (userNama) userNama.value = '';
    
    const userKelas = document.getElementById('userKelas');
    if (userKelas) userKelas.value = '';
    
    const userForm = document.getElementById('userForm');
    if (userForm) delete userForm.dataset.userId;
    
    const modal = document.getElementById('userModal');
    if (modal) modal.style.display = 'block';
};

// Edit user
window.editUser = async function(userId) {
    console.log('Editing user:', userId);
    
    try {
        const userDoc = await usersCollection.doc(userId).get();
        
        if (!userDoc.exists) {
            showAlert('User tidak ditemukan', 'error');
            return;
        }
        
        const user = userDoc.data();
        
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Edit User';
        }
        
        const userNama = document.getElementById('userNama');
        if (userNama) userNama.value = user.nama || '';
        
        const userKelas = document.getElementById('userKelas');
        if (userKelas) userKelas.value = user.kelas || '';
        
        const userForm = document.getElementById('userForm');
        if (userForm) userForm.dataset.userId = userId;
        
        const modal = document.getElementById('userModal');
        if (modal) modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading user:', error);
        showAlert('Gagal memuat data user: ' + error.message, 'error');
    }
};

// Delete user
window.deleteUser = async function(userId) {
    console.log('Deleting user:', userId);
    
    if (!confirm('Yakin ingin menghapus user ini? Semua jurnal user ini juga akan terhapus.')) {
        return;
    }
    
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
        await loadUsers();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Gagal menghapus user: ' + error.message, 'error');
    }
};

// Form submit for user
const userForm = document.getElementById('userForm');
if (userForm) {
    userForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nama = document.getElementById('userNama')?.value.toLowerCase().trim();
        const kelas = document.getElementById('userKelas')?.value;
        const userId = this.dataset.userId;
        
        console.log('Saving user:', { nama, kelas, userId });
        
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
            await loadUsers();
            await loadDashboardData();
            
        } catch (error) {
            console.error('Error saving user:', error);
            
            if (error.code === 'permission-denied') {
                showAlert('Permission denied! Atur security rules Firestore terlebih dahulu.', 'error');
            } else {
                showAlert('Gagal menyimpan user: ' + error.message, 'error');
            }
        }
    });
}

// ===== UPLOAD EXCEL FUNCTIONS =====
window.showUploadModal = function() {
    console.log('Showing upload modal');
    
    const excelFile = document.getElementById('excelFile');
    if (excelFile) excelFile.value = '';
    
    const previewData = document.getElementById('previewData');
    if (previewData) previewData.innerHTML = '<p class="text-muted">Belum ada file dipilih</p>';
    
    const modal = document.getElementById('uploadModal');
    if (modal) modal.style.display = 'block';
};

function previewExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('Previewing file:', file.name);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // Preview first 5 rows
            let preview = '<table class="table table-sm" style="width:100%; font-size:12px;">';
            for (let i = 0; i < Math.min(rows.length, 6); i++) {
                preview += '<tr>';
                for (let j = 0; j < Math.min(rows[i].length, 2); j++) {
                    if (i === 0) {
                        preview += `<th style="padding:5px; background:#1e3c72; color:white;">${rows[i][j] || 'Kolom ' + (j+1)}</th>`;
                    } else {
                        preview += `<td style="padding:5px; border-bottom:1px solid #ddd;">${rows[i][j] || '-'}</td>`;
                    }
                }
                preview += '</tr>';
            }
            preview += '</table>';
            preview += `<p>Total data: ${rows.length - 1} baris</p>`;
            
            const previewData = document.getElementById('previewData');
            if (previewData) previewData.innerHTML = preview;
            
        } catch (error) {
            console.error('Error previewing Excel:', error);
            const previewData = document.getElementById('previewData');
            if (previewData) previewData.innerHTML = '<p class="text-error">Gagal membaca file: ' + error.message + '</p>';
        }
    };
    reader.readAsArrayBuffer(file);
}

window.downloadTemplate = function() {
    console.log('Downloading template');
    
    const data = [
        ['Nama Lengkap', 'Kelas'],
        ['ahmad fauzi', '1A'],
        ['siti aminah', '1B'],
        ['budi santoso', '2A']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template User');
    XLSX.writeFile(workbook, 'template_user_ramadhan.xlsx');
};

// Upload form submit
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const file = document.getElementById('excelFile')?.files[0];
        if (!file) {
            showAlert('Pilih file Excel terlebih dahulu', 'error');
            return;
        }
        
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        }
        
        try {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                    
                    console.log('Processing rows:', rows.length);
                    
                    // Skip header row
                    const users = [];
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (row && row.length >= 2 && row[0] && row[1]) {
                            // Validasi kelas
                            const kelas = row[1].toString().trim();
                            const validKelas = ['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'];
                            
                            if (!validKelas.includes(kelas)) {
                                showAlert(`Kelas tidak valid di baris ${i+1}: ${kelas}`, 'warning');
                                continue;
                            }
                            
                            users.push({
                                nama: row[0].toString().toLowerCase().trim(),
                                kelas: kelas,
                                createdAt: new Date().toISOString(),
                                lastLogin: null
                            });
                        }
                    }
                    
                    console.log('Valid users:', users.length);
                    
                    if (users.length === 0) {
                        showAlert('Tidak ada data valid dalam file', 'error');
                        return;
                    }
                    
                    // Upload to Firestore
                    let successCount = 0;
                    let skipCount = 0;
                    
                    for (const user of users) {
                        try {
                            // Check if user already exists
                            const existingUser = await usersCollection
                                .where('nama', '==', user.nama)
                                .get();
                            
                            if (existingUser.empty) {
                                await usersCollection.add(user);
                                successCount++;
                            } else {
                                skipCount++;
                            }
                        } catch (error) {
                            console.error('Error adding user:', error);
                        }
                    }
                    
                    if (successCount > 0) {
                        showAlert(`Berhasil menambahkan ${successCount} user baru (${skipCount} duplikat)`, 'success');
                    } else {
                        showAlert('Tidak ada user baru yang ditambahkan (semua sudah ada)', 'warning');
                    }
                    
                    closeModal('uploadModal');
                    await loadUsers();
                    await loadDashboardData();
                    
                } catch (error) {
                    console.error('Error processing Excel:', error);
                    
                    if (error.code === 'permission-denied') {
                        showAlert('Permission denied! Atur security rules Firestore terlebih dahulu.', 'error');
                    } else {
                        showAlert('Gagal memproses file Excel: ' + error.message, 'error');
                    }
                }
            };
            reader.readAsArrayBuffer(file);
            
        } catch (error) {
            console.error('Error uploading:', error);
            showAlert('Gagal upload file: ' + error.message, 'error');
        } finally {
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload';
            }
        }
    });
}

// ===== DATA MANAGEMENT FUNCTIONS =====
async function loadDataTable() {
    try {
        console.log('Loading data table...');
        
        const sortBy = document.getElementById('sortData')?.value || 'tertinggi';
        const kelasFilter = document.getElementById('filterKelasData')?.value || '';
        const searchNama = document.getElementById('searchNama')?.value.toLowerCase() || '';
        const tanggalFilter = document.getElementById('filterTanggal')?.value || '';
        
        let query = jurnalCollection;
        
        if (tanggalFilter) {
            query = query.where('tanggal', '==', tanggalFilter);
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            document.getElementById('dataTableBody').innerHTML = 
                '<tr><td colspan="26" style="text-align: center;">Belum ada data jurnal</td></tr>';
            return;
        }
        
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
        
        console.log('Data table loaded:', data.length, 'records');
        
    } catch (error) {
        console.error('Error loading data table:', error);
        
        if (error.code === 'permission-denied') {
            showAlert('Permission denied! Atur security rules Firestore terlebih dahulu.', 'error');
        } else {
            showAlert('Gagal memuat data jurnal: ' + error.message, 'error');
        }
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
            data.sort((a, b) => (a.userName || '').localeCompare(b.userName || ''));
            break;
        case 'za':
            data.sort((a, b) => (b.userName || '').localeCompare(a.userName || ''));
            break;
    }
}

function displayDataTable(data) {
    const tbody = document.getElementById('dataTableBody');
    if (!tbody) return;
    
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
            <td>${data.userName || '-'}</td>
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
        showAlert('Gagal export data: ' + error.message, 'error');
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
        showAlert('Gagal export data user: ' + error.message, 'error');
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
        showAlert('Gagal export data jurnal: ' + error.message, 'error');
    }
};

// ===== UTILITY FUNCTIONS =====
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
};

function showAlert(message, type) {
    console.log('Alert:', message, type);
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    alertDiv.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    const adminContent = document.querySelector('.admin-content');
    if (adminContent) {
        adminContent.insertBefore(alertDiv, adminContent.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return '-';
    }
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
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