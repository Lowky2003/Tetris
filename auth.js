// Authentication and Firebase Management

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userHighScore = 0;
        this.initEventListeners();
        this.waitForFirebase();
    }

    waitForFirebase() {
        let attempts = 0;
        const maxAttempts = 50; // Wait up to 5 seconds

        const checkFirebase = () => {
            attempts++;

            if (window.firebaseAuth && window.firebaseDB && window.firebaseModules) {
                this.auth = window.firebaseAuth;
                this.db = window.firebaseDB;
                this.loadFirebaseModules();
            } else if (attempts < maxAttempts) {
                setTimeout(checkFirebase, 100);
            } else {
                console.error('Firebase failed to initialize after 5 seconds');
                alert('Failed to connect to Firebase. Please refresh the page.');
            }
        };
        checkFirebase();
    }

    async loadFirebaseModules() {
        try {
            // Get Firebase functions from the modules already loaded in index.html
            const authModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            this.authFunctions = authModule;
            this.firestoreFunctions = firestoreModule;

            console.log('Firebase modules loaded successfully');

            // Now setup auth state listener
            this.setupAuthStateListener();
        } catch (error) {
            console.error('Error loading Firebase modules:', error);
            alert('Failed to load Firebase modules. Please refresh the page.');
        }
    }

    initEventListeners() {
        // Modal controls
        document.getElementById('openLoginBtn').addEventListener('click', () => this.openLoginModal());
        document.getElementById('loginToPlayBtn').addEventListener('click', () => this.openLoginModal());
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGameManually());
        document.getElementById('viewLeaderboardBtn').addEventListener('click', () => this.openLeaderboard());
        document.getElementById('viewLeaderboardLoggedIn').addEventListener('click', () => this.openLeaderboard());
        document.getElementById('viewLeaderboardGameOver').addEventListener('click', () => this.openLeaderboard());
        document.querySelector('.close-login-modal').addEventListener('click', () => this.closeLoginModal());
        document.querySelector('.close-register-modal').addEventListener('click', () => this.closeRegisterModal());
        document.querySelector('.close-leaderboard').addEventListener('click', () => this.closeLeaderboard());

        // Form switching
        document.getElementById('showRegister').addEventListener('click', () => this.switchToRegister());
        document.getElementById('showLogin').addEventListener('click', () => this.switchToLogin());

        // Auth actions
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('registerBtn').addEventListener('click', () => this.register());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Enter key support
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('registerPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.register();
        });

        // Close modals on background click
        document.getElementById('loginModal').addEventListener('click', (e) => {
            if (e.target.id === 'loginModal') this.closeLoginModal();
        });
        document.getElementById('registerModal').addEventListener('click', (e) => {
            if (e.target.id === 'registerModal') this.closeRegisterModal();
        });
        document.getElementById('leaderboardModal').addEventListener('click', (e) => {
            if (e.target.id === 'leaderboardModal') this.closeLeaderboard();
        });
    }

    setupAuthStateListener() {
        if (!this.authFunctions) {
            console.error('Auth functions not available');
            return;
        }

        console.log('Setting up auth state listener...');

        this.authFunctions.onAuthStateChanged(this.auth, async (user) => {
            if (user) {
                console.log('User logged in:', user.email);
                this.currentUser = user;
                await this.loadUserData(user.uid);
                this.showUserProfile();
                this.startGameIfReady();
            } else {
                console.log('User logged out');
                this.currentUser = null;
                this.showGuestSection();
                this.stopGame();
            }
        });
    }

    startGameIfReady() {
        // Show start button instead of auto-starting
        if (this.currentUser && window.game) {
            document.getElementById('loginGate').classList.add('hidden');
            document.getElementById('startGameGate').classList.remove('hidden');
        }
    }

    startGameManually() {
        // Start the game when user clicks the start button
        if (window.game) {
            document.getElementById('startGameGate').classList.add('hidden');
            window.game.startGame();
        }
    }

    stopGame() {
        // Show login gate if user logs out
        if (window.game) {
            window.game.isStarted = false;
            window.game.gameOver = true; // Stop the game loop
            document.getElementById('loginGate').classList.remove('hidden');
        }
    }

    async loadUserData(uid) {
        if (!this.firestoreFunctions) {
            console.error('Firestore functions not available yet');
            // Set default values
            document.getElementById('displayUsername').textContent = this.currentUser?.displayName || 'Player';
            document.getElementById('displayHighScore').textContent = '0';
            return;
        }

        console.log('Loading user data for:', uid);

        try {
            const { doc, getDoc } = this.firestoreFunctions;
            const userDoc = await getDoc(doc(this.db, 'users', uid));

            if (userDoc.exists()) {
                const data = userDoc.data();
                this.userHighScore = data.highScore || 0;
                document.getElementById('displayUsername').textContent = data.username || 'Player';
                document.getElementById('displayHighScore').textContent = this.userHighScore;
            } else {
                // If user document doesn't exist, display basic info
                document.getElementById('displayUsername').textContent = this.currentUser.displayName || 'Player';
                document.getElementById('displayHighScore').textContent = '0';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Show basic info even if loading fails
            document.getElementById('displayUsername').textContent = this.currentUser?.displayName || 'Player';
            document.getElementById('displayHighScore').textContent = '0';
        }
    }

    async register() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        if (!username || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        if (!this.authFunctions || !this.firestoreFunctions) {
            alert('Firebase is still loading. Please wait a moment and try again.');
            return;
        }

        const registerBtn = document.getElementById('registerBtn');
        const originalText = registerBtn.textContent;
        registerBtn.textContent = 'Registering...';
        registerBtn.disabled = true;

        try {
            const { createUserWithEmailAndPassword, updateProfile } = this.authFunctions;
            const { doc, setDoc } = this.firestoreFunctions;

            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            await updateProfile(userCredential.user, { displayName: username });

            // Create user document in Firestore
            await setDoc(doc(this.db, 'users', userCredential.user.uid), {
                username: username,
                email: email,
                highScore: 0,
                createdAt: new Date().toISOString()
            });

            this.closeRegisterModal();
            this.clearForms();
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);
        } finally {
            registerBtn.textContent = originalText;
            registerBtn.disabled = false;
        }
    }

    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        if (!this.authFunctions) {
            alert('Firebase is still loading. Please wait a moment and try again.');
            return;
        }

        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn.textContent;
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;

        try {
            const { signInWithEmailAndPassword } = this.authFunctions;
            await signInWithEmailAndPassword(this.auth, email, password);

            this.closeLoginModal();
            this.clearForms();
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        } finally {
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    }

    async logout() {
        if (!this.authFunctions) {
            return;
        }

        try {
            const { signOut } = this.authFunctions;
            await signOut(this.auth);
            // Refresh the page after logout
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed: ' + error.message);
        }
    }

    async saveHighScore(score) {
        if (!this.currentUser || !this.firestoreFunctions) return;

        if (score > this.userHighScore) {
            try {
                const { doc, updateDoc } = this.firestoreFunctions;
                await updateDoc(doc(this.db, 'users', this.currentUser.uid), {
                    highScore: score,
                    lastUpdated: new Date().toISOString()
                });

                this.userHighScore = score;
                document.getElementById('displayHighScore').textContent = score;
                console.log('High score saved:', score);
            } catch (error) {
                console.error('Error saving high score:', error);
            }
        }
    }

    async openLeaderboard() {
        document.getElementById('leaderboardModal').classList.remove('hidden');
        await this.loadLeaderboard();
    }

    async loadLeaderboard() {
        const listEl = document.getElementById('leaderboardList');
        listEl.innerHTML = '<p class="loading">Loading...</p>';

        if (!this.firestoreFunctions) {
            listEl.innerHTML = '<p class="loading">Firebase is loading...</p>';
            return;
        }

        try {
            const { collection, query, orderBy, limit, getDocs } = this.firestoreFunctions;

            const leaderboardQuery = query(
                collection(this.db, 'users'),
                orderBy('highScore', 'desc'),
                limit(10)
            );

            const snapshot = await getDocs(leaderboardQuery);

            if (snapshot.empty) {
                listEl.innerHTML = '<p class="loading">No scores yet. Be the first!</p>';
                return;
            }

            let html = '';
            let rank = 1;
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.highScore > 0) {
                    html += `
                        <div class="leaderboard-item">
                            <span class="leaderboard-rank">#${rank}</span>
                            <span class="leaderboard-username">${data.username}</span>
                            <span class="leaderboard-score">${data.highScore}</span>
                        </div>
                    `;
                    rank++;
                }
            });

            listEl.innerHTML = html || '<p class="loading">No scores yet. Be the first!</p>';
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            listEl.innerHTML = '<p class="loading">Error loading leaderboard</p>';
        }
    }

    closeLeaderboard() {
        document.getElementById('leaderboardModal').classList.add('hidden');
    }

    openLoginModal() {
        document.getElementById('loginModal').classList.remove('hidden');
    }

    closeLoginModal() {
        document.getElementById('loginModal').classList.add('hidden');
    }

    openRegisterModal() {
        document.getElementById('registerModal').classList.remove('hidden');
    }

    closeRegisterModal() {
        document.getElementById('registerModal').classList.add('hidden');
    }

    switchToRegister() {
        this.closeLoginModal();
        this.openRegisterModal();
    }

    switchToLogin() {
        this.closeRegisterModal();
        this.openLoginModal();
    }

    showUserProfile() {
        document.getElementById('userProfile').classList.remove('hidden');
        document.getElementById('guestSection').classList.add('hidden');
    }

    showGuestSection() {
        document.getElementById('guestSection').classList.remove('hidden');
        document.getElementById('userProfile').classList.add('hidden');
    }

    clearForms() {
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
    }
}

// Initialize auth manager
let authManager;
window.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
    // Make authManager available globally for game.js
    window.authManager = authManager;
});
