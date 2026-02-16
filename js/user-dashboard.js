// User Dashboard JavaScript - VERSI FINAL

let currentUserId = '';
let currentUserNama = '';

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    currentUserId = sessionStorage.getItem('userId');
    currentUserNama = sessionStorage.getItem('userNama');
    
    if (!currentUserId) {
        window.location.href = 'index.html'; // Kembali ke dashboard
        return;
    }
    
    // Display user name
    document.getElementById('userNameDisplay').textContent = currentUserNama;
    
    // Set max date for input
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal').value = today;
    document.getElementById('tanggal').max = today;
    
    // Check if today is Friday
    if (isFriday()) {
        document.getElementById('jumatSection').style.display = 'block';
    }
    
    // Check if today is Idul Fitri (20 Maret 2026)
    checkIdulFitriDate();
    
    // Initialize form handlers
    initializeFormHandlers();
    
    // Load today's data if exists
    loadTodayData();
    
    // Load riwayat
    loadRiwayat();
});

// Fungsi untuk cek tanggal Idul Fitri
function checkIdulFitriDate() {
    const tanggal = document.getElementById('tanggal').value;
    const idulFitriSection = document.getElementById('idulFitriSection');
    
    if (!idulFitriSection) return;
    
    // Idul Fitri hanya tanggal 20 Maret 2026
    if (tanggal === '2026-03-20') {
        idulFitriSection.style.display = 'block';
        document.getElementById('dateInfo').innerHTML += '<br><strong>📅 Hari ini adalah Hari Raya Idul Fitri 1447 H</strong>';
    } else {
        idulFitriSection.style.display = 'none';
    }
}

// Update fungsi untuk handle perubahan tanggal
function initializeFormHandlers() {
    // Puasa handler
    document.querySelectorAll('input[name="puasa"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const alasanField = document.getElementById('alasanPuasaField');
            alasanField.style.display = this.value === 'tidak' ? 'block' : 'none';
        });
    });
    
    // Shalat handlers
    document.querySelectorAll('.shalat-status').forEach(radio => {
        radio.addEventListener('change', function() {
            const shalat = this.dataset.shalat;
            const detailDiv = document.getElementById(shalat + 'Detail');
            const alasanDiv = document.getElementById(shalat + 'AlasanField');
            
            if (this.value === 'ya') {
                detailDiv.style.display = 'block';
                alasanDiv.style.display = 'none';
            } else {
                detailDiv.style.display = 'none';
                alasanDiv.style.display = 'block';
            }
        });
    });
    
    // Tarawih handler
    document.getElementById('tarawihYa')?.addEventListener('change', function() {
        document.getElementById('tarawihDetail').style.display = 'block';
    });
    document.getElementById('tarawihTidak')?.addEventListener('change', function() {
        document.getElementById('tarawihDetail').style.display = 'none';
    });
    
    // Tadarus handler
    document.getElementById('tadarusYa')?.addEventListener('change', function() {
        document.getElementById('tadarusDetail').style.display = 'block';
    });
    document.getElementById('tadarusTidak')?.addEventListener('change', function() {
        document.getElementById('tadarusDetail').style.display = 'none';
    });
    
    // Jumat handler
    document.querySelectorAll('input[name="jumat_status"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const yaDetail = document.getElementById('jumatYaDetail');
            const tidakAlasan = document.getElementById('jumatTidakAlasan');
            
            if (this.value === 'ya') {
                yaDetail.style.display = 'block';
                tidakAlasan.style.display = 'none';
            } else if (this.value === 'tidak') {
                yaDetail.style.display = 'none';
                tidakAlasan.style.display = 'block';
            } else {
                yaDetail.style.display = 'none';
                tidakAlasan.style.display = 'none';
            }
        });
    });
    
    // Idul Fitri handler
    document.getElementById('idulFitriYa')?.addEventListener('change', function() {
        document.getElementById('idulFitriDetail').style.display = 'block';
        document.getElementById('idulFitriAlasan').style.display = 'none';
    });
    document.getElementById('idulFitriTidak')?.addEventListener('change', function() {
        document.getElementById('idulFitriDetail').style.display = 'none';
        document.getElementById('idulFitriAlasan').style.display = 'block';
    });
    
    // Form submit
    document.getElementById('jurnalForm').addEventListener('submit', saveJurnal);
    
    // Date change
    document.getElementById('tanggal').addEventListener('change', function() {
        loadTodayData();
        checkIdulFitriDate(); // Cek ulang tanggal Idul Fitri
        if (isFriday()) {
            document.getElementById('jumatSection').style.display = 'block';
        } else {
            document.getElementById('jumatSection').style.display = 'none';
        }
    });
}

async function saveJurnal(e) {
    e.preventDefault();
    
    const tanggal = document.getElementById('tanggal').value;
    
    // Validate date
    if (!tanggal) {
        showAlert('Pilih tanggal terlebih dahulu', 'error');
        return;
    }
    
    // Collect data
    const jurnalData = {
        userId: currentUserId,
        tanggal: tanggal,
        puasa: {
            status: document.querySelector('input[name="puasa"]:checked')?.value,
            alasan: document.querySelector('textarea[name="alasanPuasa"]')?.value
        },
        shalat: {},
        tarawih: {
            status: document.querySelector('input[name="tarawih_status"]:checked')?.value,
            tempat: document.querySelector('input[name="tarawih_tempat"]')?.value,
            imam: document.querySelector('input[name="tarawih_imam"]')?.value
        },
        tadarus: {
            status: document.querySelector('input[name="tadarus_status"]:checked')?.value,
            surah: document.querySelector('input[name="tadarus_surah"]')?.value,
            ayat: document.querySelector('input[name="tadarus_ayat"]')?.value
        },
        infaq: document.querySelector('input[name="infaq_status"]:checked')?.value,
        createdAt: new Date().toISOString()
    };
    
    // Collect shalat data
    const shalatTimes = ['subuh', 'dzuhur', 'ashar', 'magrib', 'isya'];
    shalatTimes.forEach(time => {
        jurnalData.shalat[time] = {
            status: document.querySelector(`input[name="${time}_status"]:checked`)?.value,
            jamaah: document.querySelector(`select[name="${time}_jamaah"]`)?.value,
            jam: document.querySelector(`input[name="${time}_jam"]`)?.value,
            alasan: document.querySelector(`textarea[name="${time}_alasan"]`)?.value
        };
    });
    
    // Jumat data if applicable
    if (isFriday()) {
        jurnalData.shalat_jumat = {
            status: document.querySelector('input[name="jumat_status"]:checked')?.value,
            masjid: document.querySelector('input[name="jumat_masjid"]')?.value,
            khotib: document.querySelector('input[name="jumat_khotib"]')?.value,
            alasan: document.querySelector('textarea[name="jumat_alasan"]')?.value
        };
    }
    
    // Idul Fitri data (hanya jika tanggal 20 Maret 2026)
    if (tanggal === '2026-03-20') {
        jurnalData.shalat_idul_fitri = {
            status: document.querySelector('input[name="idul_fitri_status"]:checked')?.value,
            tempat: document.querySelector('input[name="idul_fitri_tempat"]')?.value,
            imam: document.querySelector('input[name="idul_fitri_imam"]')?.value,
            khotib: document.querySelector('input[name="idul_fitri_khotib"]')?.value,
            alasan: document.querySelector('textarea[name="idul_fitri_alasan"]')?.value
        };
    }
    
    // Calculate score
    jurnalData.totalScore = calculateScore(jurnalData);
    
    try {
        // Check if jurnal exists for this date
        const querySnapshot = await jurnalCollection
            .where('userId', '==', currentUserId)
            .where('tanggal', '==', tanggal)
            .get();
        
        if (!querySnapshot.empty) {
            // Update existing
            const docId = querySnapshot.docs[0].id;
            await jurnalCollection.doc(docId).update(jurnalData);
            showAlert('Jurnal berhasil diperbarui!', 'success');
        } else {
            // Create new
            await jurnalCollection.add(jurnalData);
            showAlert('Jurnal berhasil disimpan!', 'success');
        }
        
        // Reload riwayat
        loadRiwayat();
        
    } catch (error) {
        console.error('Error saving jurnal:', error);
        showAlert('Gagal menyimpan jurnal', 'error');
    }
}

function calculateScore(data) {
    let score = 0;
    
    // Puasa score
    if (data.puasa?.status === 'ya') score += 1;
    
    // Shalat scores
    if (data.shalat) {
        Object.values(data.shalat).forEach(shalat => {
            if (shalat.status === 'ya') {
                score += shalat.jamaah === 'berjamaah' ? 2 : 1;
            }
        });
    }
    
    // Tarawih score
    if (data.tarawih?.status === 'ya') score += 1;
    
    // Tadarus score
    if (data.tadarus?.status === 'ya') score += 1;
    
    // Jumat score
    if (data.shalat_jumat?.status === 'ya') score += 1;
    
    // Idul Fitri score (hanya jika tanggalnya tepat)
    if (data.shalat_idul_fitri?.status === 'ya') score += 1;
    
    // Infaq score
    if (data.infaq === 'ya') score += 1;
    
    return score;
}

async function loadTodayData() {
    const tanggal = document.getElementById('tanggal').value;
    
    try {
        const querySnapshot = await jurnalCollection
            .where('userId', '==', currentUserId)
            .where('tanggal', '==', tanggal)
            .get();
        
        // Reset form
        document.getElementById('jurnalForm').reset();
        
        // Sembunyikan semua detail
        document.querySelectorAll('.shalat-detail, .alasan-field, #tarawihDetail, #tadarusDetail, #jumatYaDetail, #jumatTidakAlasan, #idulFitriDetail, #idulFitriAlasan').forEach(el => {
            el.style.display = 'none';
        });
        
        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            populateForm(data);
        } else {
            document.getElementById('dateInfo').textContent = 
                `Mengisi jurnal untuk tanggal ${formatDate(tanggal)}`;
        }
        
        // Cek Idul Fitri
        checkIdulFitriDate();
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function populateForm(data) {
    // Set puasa
    if (data.puasa) {
        setRadioValue('puasa', data.puasa.status);
        if (data.puasa.alasan) {
            document.querySelector('textarea[name="alasanPuasa"]').value = data.puasa.alasan;
            if (data.puasa.status === 'tidak') {
                document.getElementById('alasanPuasaField').style.display = 'block';
            }
        }
    }
    
    // Set shalat
    if (data.shalat) {
        Object.entries(data.shalat).forEach(([time, shalat]) => {
            setRadioValue(`${time}_status`, shalat.status);
            
            if (shalat.status === 'ya') {
                if (shalat.jamaah) {
                    document.querySelector(`select[name="${time}_jamaah"]`).value = shalat.jamaah;
                }
                if (shalat.jam) {
                    document.querySelector(`input[name="${time}_jam"]`).value = shalat.jam;
                }
                document.getElementById(`${time}Detail`).style.display = 'block';
            } else if (shalat.status === 'tidak' && shalat.alasan) {
                document.querySelector(`textarea[name="${time}_alasan"]`).value = shalat.alasan;
                document.getElementById(`${time}AlasanField`).style.display = 'block';
            }
        });
    }
    
    // Set tarawih
    if (data.tarawih) {
        setRadioValue('tarawih_status', data.tarawih.status);
        if (data.tarawih.status === 'ya') {
            document.querySelector('input[name="tarawih_tempat"]').value = data.tarawih.tempat || '';
            document.querySelector('input[name="tarawih_imam"]').value = data.tarawih.imam || '';
            document.getElementById('tarawihDetail').style.display = 'block';
        }
    }
    
    // Set tadarus
    if (data.tadarus) {
        setRadioValue('tadarus_status', data.tadarus.status);
        if (data.tadarus.status === 'ya') {
            document.querySelector('input[name="tadarus_surah"]').value = data.tadarus.surah || '';
            document.querySelector('input[name="tadarus_ayat"]').value = data.tadarus.ayat || '';
            document.getElementById('tadarusDetail').style.display = 'block';
        }
    }
    
    // Set infaq
    setRadioValue('infaq_status', data.infaq);
    
    // Set jumat
    if (data.shalat_jumat) {
        setRadioValue('jumat_status', data.shalat_jumat.status);
        if (data.shalat_jumat.status === 'ya') {
            document.querySelector('input[name="jumat_masjid"]').value = data.shalat_jumat.masjid || '';
            document.querySelector('input[name="jumat_khotib"]').value = data.shalat_jumat.khotib || '';
            document.getElementById('jumatYaDetail').style.display = 'block';
        } else if (data.shalat_jumat.status === 'tidak') {
            document.querySelector('textarea[name="jumat_alasan"]').value = data.shalat_jumat.alasan || '';
            document.getElementById('jumatTidakAlasan').style.display = 'block';
        }
    }
    
    // Set idul fitri (hanya jika ada datanya)
    if (data.shalat_idul_fitri && data.tanggal === '2026-03-20') {
        setRadioValue('idul_fitri_status', data.shalat_idul_fitri.status);
        if (data.shalat_idul_fitri.status === 'ya') {
            document.querySelector('input[name="idul_fitri_tempat"]').value = data.shalat_idul_fitri.tempat || '';
            document.querySelector('input[name="idul_fitri_imam"]').value = data.shalat_idul_fitri.imam || '';
            document.querySelector('input[name="idul_fitri_khotib"]').value = data.shalat_idul_fitri.khotib || '';
            document.getElementById('idulFitriDetail').style.display = 'block';
        } else if (data.shalat_idul_fitri.status === 'tidak') {
            document.querySelector('textarea[name="idul_fitri_alasan"]').value = data.shalat_idul_fitri.alasan || '';
            document.getElementById('idulFitriAlasan').style.display = 'block';
        }
    }
    
    document.getElementById('dateInfo').textContent = 
        `Menampilkan jurnal untuk tanggal ${formatDate(data.tanggal)}`;
}

function setRadioValue(name, value) {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    radios.forEach(radio => {
        if (radio.value === value) {
            radio.checked = true;
        }
    });
}

async function loadRiwayat() {
    try {
        const querySnapshot = await jurnalCollection
            .where('userId', '==', currentUserId)
            .orderBy('tanggal', 'desc')
            .get();
        
        const tbody = document.getElementById('riwayatBody');
        tbody.innerHTML = '';
        
        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Belum ada jurnal</td></tr>';
            return;
        }
        
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const row = createRiwayatRow(doc.id, data);
            tbody.innerHTML += row;
        });
        
    } catch (error) {
        console.error('Error loading riwayat:', error);
    }
}

function createRiwayatRow(id, data) {
    // Hitung jumlah shalat yang dikerjakan
    let shalatCount = 0;
    if (data.shalat) {
        shalatCount = Object.values(data.shalat).filter(s => s.status === 'ya').length;
    }
    
    return `
        <tr>
            <td>${formatDate(data.tanggal)}</td>
            <td>${data.puasa?.status === 'ya' ? '✅' : '❌'}</td>
            <td>${shalatCount}/5</td>
            <td>${data.tarawih?.status === 'ya' ? '✅' : '❌'}</td>
            <td>${data.tadarus?.status === 'ya' ? '✅' : '❌'}</td>
            <td>${data.infaq === 'ya' ? '✅' : '❌'}</td>
            <td><strong>${data.totalScore || 0}</strong></td>
            <td>
                <button class="btn-edit" onclick="loadJurnalForDate('${data.tanggal}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </td>
        </tr>
    `;
}

function loadJurnalForDate(tanggal) {
    document.getElementById('tanggal').value = tanggal;
    loadTodayData();
    checkIdulFitriDate(); // Cek ulang tanggal Idul Fitri
}

function loadExistingData() {
    loadTodayData();
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    
    const cardHeader = document.querySelector('.card-header');
    cardHeader.parentNode.insertBefore(alertDiv, cardHeader.nextSibling);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('id-ID', options);
}

function isFriday() {
    return new Date().getDay() === 5;
}

// Logout function - BALIK KE INDEX.HTML
window.logout = function() {
    sessionStorage.clear();
    window.location.href = 'index.html'; // Kembali ke halaman utama
}