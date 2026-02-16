// Firebase Configuration
// GANTI dengan konfigurasi Firebase Anda yang ASLI dari Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAdH3y5Vm6xrO9gvCv47J94u9WUqxotSlI",
    authDomain: "jurnal-ramadhan-1447.firebaseapp.com",
    projectId: "jurnal-ramadhan-1447",
    storageBucket: "jurnal-ramadhan-1447.firebasestorage.app",
    messagingSenderId: "19421027338",
    appId: "1:19421027338:web:a6f8094dbfa1e9038693f3"
};

// Initialize Firebase (hanya sekali)
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized');
} catch (error) {
    console.log('Firebase already initialized');
}

// Initialize services
const db = firebase.firestore();

// Atur pengaturan Firestore
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true
});

// Enable offline persistence
db.enablePersistence({
    synchronizeTabs: true
})
    .then(() => {
        console.log('✅ Offline persistence enabled');
    })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('ℹ️ Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.log('ℹ️ Persistence not supported');
        }
    });

// Collections
const usersCollection = db.collection('users');
const jurnalCollection = db.collection('jurnal');
const adminCollection = db.collection('admins');

// Fungsi untuk cek koneksi Firestore
window.checkFirestoreConnection = async function() {
    try {
        const testDoc = await usersCollection.limit(1).get();
        console.log('✅ Firestore connected successfully');
        showAlert('✅ Terhubung ke database', 'success');
        return true;
    } catch (error) {
        console.error('❌ Firestore connection failed:', error);
        
        if (error.code === 'permission-denied') {
            showAlert('❌ Permission denied! Atur security rules Firestore terlebih dahulu.', 'error');
        } else {
            showAlert('❌ Gagal terhubung ke database: ' + error.message, 'error');
        }
        return false;
    }
};

// Export untuk digunakan di file lain
window.db = db;
window.usersCollection = usersCollection;
window.jurnalCollection = jurnalCollection;
window.adminCollection = adminCollection;

console.log('Firebase initialized with project:', firebaseConfig.projectId);