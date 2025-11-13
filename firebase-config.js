// Firebase Configuration
// IMPORTANT: Replace these values with your own Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > Firebase SDK snippet

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase (will be called from index.html after modules load)
let app, auth, db;

// Wait for Firebase modules to be available
function initializeFirebase() {
    if (window.firebaseModules) {
        try {
            const { initializeApp, getAuth, getFirestore } = window.firebaseModules;
            app = initializeApp(firebaseConfig);

            // Make auth and db available globally
            window.firebaseAuth = getAuth(app);
            window.firebaseDB = getFirestore(app);

            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            console.log('Please update firebase-config.js with your Firebase credentials');
        }
    }
}

// Try to initialize immediately or wait for modules
if (window.firebaseModules) {
    initializeFirebase();
} else {
    // Wait for modules to load
    setTimeout(initializeFirebase, 100);
}
