// Authentication and Firebase Management

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userHighScore = 0;
        this.initEventListeners();
        this.waitForFirebase();
    }

    waitForFirebase() {
        const checkFirebase = () => {
            if (window.firebaseAuth && window.firebaseDB) {
                this.auth = window.firebaseAuth;
                this.db = window.firebaseDB;
                this.setupAuthStateListener();
                this.loadFirebaseModules();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }

    async loadFirebaseModules() {
        try {
            const authModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            this.authFunctions = authModule;
            this.firestoreFunctions = firestoreModule;

            console.log('Firebase modules loaded');
        } catch (error) {
            console.error('Error loading Firebase modules:', error);
        }
    }

    initEventListeners() {
        // Modal controls
        document.getElementById('openLoginBtn').addEventListener('click', () => this.openAuthModal());
        document.getElementById('loginToPlayBtn').addEventListener('click', () => this.openAuthModal());
        document.getElementById('viewLeaderboardBtn').addEventListener('click', () => this.openLeaderboard());
        document.getElementById('viewLeaderboardGameOver').addEventListener('click', () => this.openLeaderboard());
        document.querySelector('.close-modal').addEventListener('click', () => this.closeAuthModal());
        document.querySelector('.close-leaderboard').addEventListener('click', () => this.closeLeaderboard());

        // Form switching
        document.getElementById('showRegister').addEventListener('click', () => this.showRegisterForm());
        document.getElementById('showLogin').addEventListener('click', () => this.showLoginForm());

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
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') this.closeAuthModal();
        });
        document.getElementById('leaderboardModal').addEventListener('click', (e) => {
            if (e.target.id === 'leaderboardModal') this.closeLeaderboard();
        });
    }

    setupAuthStateListener() {
        if (!this.authFunctions) {
            setTimeout(() => this.setupAuthStateListener(), 100);
            return;
        }

        this.authFunctions.onAuthStateChanged(this.auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData(user.uid);
                this.showUserProfile();
                this.startGameIfReady();
            } else {
                this.currentUser = null;
                this.showGuestSection();
                this.stopGame();
            }
        });
    }

    startGameIfReady() {
        // Start the game if user is logged in and game is available
        if (this.currentUser && window.game) {
            window.game.startGame();
        }
    }

    stopGame() {
        // Show login gate if user logs out
        if (window.game) {
            window.game.isStarted = false;
            document.getElementById('loginGate').classList.remove('hidden');
        }
    }

    async loadUserData(uid) {
        try {
            const { doc, getDoc } = this.firestoreFunctions;
            const userDoc = await getDoc(doc(this.db, 'users', uid));

            if (userDoc.exists()) {
                const data = userDoc.data();
                this.userHighScore = data.highScore || 0;
                document.getElementById('displayUsername').textContent = data.username || 'Player';
                document.getElementById('displayHighScore').textContent = this.userHighScore;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
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

            alert('Registration successful!');
            this.closeAuthModal();
            this.clearForms();
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);
        }
    }

    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const { signInWithEmailAndPassword } = this.authFunctions;
            await signInWithEmailAndPassword(this.auth, email, password);

            alert('Login successful!');
            this.closeAuthModal();
            this.clearForms();
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        }
    }

    async logout() {
        try {
            const { signOut } = this.authFunctions;
            await signOut(this.auth);
            alert('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed: ' + error.message);
        }
    }

    async saveHighScore(score) {
        if (!this.currentUser) return;

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

    openAuthModal() {
        document.getElementById('authModal').classList.remove('hidden');
        this.showLoginForm();
    }

    closeAuthModal() {
        document.getElementById('authModal').classList.add('hidden');
    }

    showLoginForm() {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
    }

    showRegisterForm() {
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('loginForm').classList.add('hidden');
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
