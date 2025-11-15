// Firebase Configuration
// IMPORTANT: Replace these values with your own Firebase project credentials
// Get these from: Firebase Console > Project Settings > General > Your apps > Firebase SDK snippet

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB5yT1PxEjKeweyTw_6rj8On9j0JeRAnzk",
  authDomain: "tetris-23d22.firebaseapp.com",
  projectId: "tetris-23d22",
  storageBucket: "tetris-23d22.firebasestorage.app",
  messagingSenderId: "400627508566",
  appId: "1:400627508566:web:5b9ba899e5a8866b6de2f7",
  measurementId: "G-Y0EDP30LP8"
};
// Initialize Firebase (will be called from index.html after modules load)
let app, auth, db;

// Wait for Firebase modules to be available
function initializeFirebase() {
    let attempts = 0;
    const maxAttempts = 30; // Try for 3 seconds

    const tryInit = () => {
        attempts++;

        if (window.firebaseModules) {
            try {
                const { initializeApp, getAuth, getFirestore } = window.firebaseModules;
                app = initializeApp(firebaseConfig);

                // Make auth and db available globally
                window.firebaseAuth = getAuth(app);
                window.firebaseDB = getFirestore(app);

                console.log('Firebase initialized successfully');
                console.log('Auth:', window.firebaseAuth);
                console.log('DB:', window.firebaseDB);
            } catch (error) {
                console.error('Error initializing Firebase:', error);
                alert('Error initializing Firebase: ' + error.message);
            }
        } else if (attempts < maxAttempts) {
            console.log(`Waiting for Firebase modules... attempt ${attempts}/${maxAttempts}`);
            setTimeout(tryInit, 100);
        } else {
            console.error('Firebase modules failed to load after 3 seconds');
            alert('Failed to load Firebase. Please check your internet connection and refresh the page.');
        }
    };

    tryInit();
}

// Start initialization
initializeFirebase();
