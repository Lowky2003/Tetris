# Tetris Game

A classic Tetris game implementation using HTML5, CSS3, and vanilla JavaScript.

## Features

- Classic Tetris gameplay with all 7 tetromino shapes (I, O, T, S, Z, J, L)
- Clockwise and counter-clockwise rotation with wall-kick mechanics
- Next piece preview (no duplicates!)
- Score tracking with level progression
- Line clearing with combo scoring
- Pause functionality
- Game over detection and restart option
- Responsive design with beautiful gradient UI
- Full keyboard controls
- On-screen touch buttons for mobile devices
- **User authentication** (login/register) with Firebase
- **High score saving** to cloud database
- **Global leaderboard** showing top 10 players

## How to Play

1. Open `index.html` in a web browser
2. The game starts automatically
3. Use keyboard or on-screen buttons to play

### Keyboard Controls
   - **← / →** : Move piece left/right
   - **↑ or X** : Rotate clockwise
   - **Z** : Rotate counter-clockwise
   - **↓** : Soft drop (move down faster)
   - **Space** : Hard drop (instant drop)
   - **P** : Pause/Resume game

### Mobile/Touch Controls
   - Use the on-screen buttons for all game controls
   - **↶ Z** : Rotate counter-clockwise
   - **↷ X** : Rotate clockwise
   - **←** / **↓** / **→** : Movement
   - **DROP** : Hard drop
   - **PAUSE** : Pause/Resume

## Scoring

- 1 line cleared: 100 points × level
- 2 lines cleared: 300 points × level
- 3 lines cleared: 500 points × level
- 4 lines cleared (Tetris): 800 points × level

## Level Progression

- Level increases every 10 lines cleared
- Each level increases the falling speed
- Higher levels = more points per line cleared

## Game Rules

- Stack falling tetrominoes to create complete horizontal lines
- Complete lines are cleared and award points
- Game ends when pieces stack to the top of the board
- Try to achieve the highest score possible!

## Firebase Setup (Optional - For User Authentication & Leaderboard)

To enable user authentication and the leaderboard feature, you need to set up Firebase:

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

### Step 2: Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Enable **Email/Password** authentication
4. Click "Save"

### Step 3: Create Firestore Database

1. In your Firebase project, go to **Firestore Database** in the left sidebar
2. Click "Create database"
3. Choose **Start in production mode** (or test mode for development)
4. Select a Cloud Firestore location
5. Click "Enable"

### Step 4: Set Up Firestore Security Rules

In the Firestore Database Rules tab, use these rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Allow users to read all user profiles (for leaderboard)
      allow read: if true;
      // Allow users to create their own profile
      allow create: if request.auth != null && request.auth.uid == userId;
      // Allow users to update only their own profile
      allow update: if request.auth != null && request.auth.uid == userId;
      // Don't allow delete
      allow delete: if false;
    }
  }
}
```

### Step 5: Get Your Firebase Config

1. In your Firebase project settings (click the gear icon), go to **General**
2. Scroll down to "Your apps" and click the **</>** (Web) button
3. Register your app (give it a nickname)
4. Copy the Firebase configuration object

### Step 6: Update firebase-config.js

Open `firebase-config.js` and replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 7: Test It Out!

1. Open `index.html` in your browser
2. Click "Login" and then "Register" to create an account
3. Play the game and your high score will be automatically saved!
4. Click "Leaderboard" to see the top 10 players

**Note:** The game works without Firebase, but authentication and leaderboard features will not be available.

## Files

- `index.html` - Main HTML structure with authentication UI
- `style.css` - Styling and layout (including modals and auth forms)
- `tetris.js` - Game logic and mechanics
- `auth.js` - Authentication and Firebase integration
- `firebase-config.js` - Firebase configuration (requires setup)

## Browser Compatibility

Works on all modern browsers that support HTML5 Canvas:
- Chrome
- Firefox
- Safari
- Edge

## License

Free to use and modify.
