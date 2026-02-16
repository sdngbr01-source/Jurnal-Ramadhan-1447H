// Firebase Configuration
const firebaseConfig = {
   apiKey: "AIzaSyAdH3y5Vm6xrO9gvCv47J94u9WUqxotSlI",
  authDomain: "jurnal-ramadhan-1447.firebaseapp.com",
  projectId: "jurnal-ramadhan-1447",
  storageBucket: "jurnal-ramadhan-1447.firebasestorage.app",
  messagingSenderId: "19421027338",
  appId: "1:19421027338:web:a6f8094dbfa1e9038693f3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();

// Collections
const usersCollection = db.collection('users');
const jurnalCollection = db.collection('jurnal');
const adminCollection = db.collection('admins');

// Default admin (run this once to set up)
async function setupDefaultAdmin() {
    try {
        const adminDoc = await adminCollection.doc('admin').get();
        if (!adminDoc.exists) {
            await adminCollection.doc('admin').set({
                username: 'admin',
                password: 'admin123', // In production, use hashed password
                role: 'superadmin',
                createdAt: new Date().toISOString()
            });
            console.log('Default admin created');
        }
    } catch (error) {
        console.error('Error setting up admin:', error);
    }
}

// Call setup
setupDefaultAdmin();

// Export for use in other files
window.db = db;
window.auth = auth;
window.usersCollection = usersCollection;
window.jurnalCollection = jurnalCollection;
window.adminCollection = adminCollection;