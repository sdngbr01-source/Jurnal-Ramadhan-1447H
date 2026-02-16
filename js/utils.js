// Utility Functions

// Format date to Indonesian format
function formatDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(date).toLocaleDateString('id-ID', options);
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Check if today is Friday
function isFriday() {
    return new Date().getDay() === 5; // 5 = Friday
}

// Calculate score for shalat
function calculateShalatScore(jamaah) {
    if (jamaah === 'berjamaah') return 2;
    if (jamaah === 'sendirian') return 1;
    return 0;
}

// Calculate total score
function calculateTotalScore(jurnal) {
    let total = 0;
    
    // Puasa score
    if (jurnal.puasa === 'ya') total += 1;
    
    // Shalat wajib scores
    const shalatTimes = ['subuh', 'dzuhur', 'ashar', 'magrib', 'isya'];
    shalatTimes.forEach(time => {
        if (jurnal[`shalat_${time}`]?.status === 'ya') {
            total += calculateShalatScore(jurnal[`shalat_${time}`]?.jamaah);
        }
    });
    
    // Tarawih score
    if (jurnal.tarawih?.status === 'ya') total += 1;
    
    // Tadarus score
    if (jurnal.tadarus?.status === 'ya') total += 1;
    
    // Shalat Jumat score (if applicable)
    if (jurnal.shalat_jumat?.status === 'ya') total += 1;
    
    // Infaq score
    if (jurnal.infaq?.status === 'ya') total += 1;
    
    return total;
}

// Export to Excel
function exportToExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Download JSON
function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// Show loading spinner
function showLoading(container) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-spinner';
    loadingDiv.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
    container.innerHTML = '';
    container.appendChild(loadingDiv);
}

// Hide loading
function hideLoading(container) {
    const spinner = container.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// Debounce function
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

// Validate date
function isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// Get date range for Ramadhan
function getRamadhanDates(year) {
    // This is simplified - in production, use actual Ramadhan dates
    const start = new Date(year, 2, 10); // Approximate
    const end = new Date(year, 3, 10); // Approximate
    return { start, end };
}

// Check if date is within Ramadhan
function isWithinRamadhan(date) {
    // Simplified - implement actual Ramadhan date checking
    const { start, end } = getRamadhanDates(date.getFullYear());
    return date >= start && date <= end;
}