# Tetris Game

A classic Tetris game implementation using HTML5, CSS3, and vanilla JavaScript.

## Features

- Classic Tetris gameplay with all 7 tetromino shapes (I, O, T, S, Z, J, L)
- Smooth piece rotation with wall-kick mechanics
- Next piece preview
- Score tracking with level progression
- Line clearing with combo scoring
- Pause functionality
- Game over detection and restart option
- Responsive design with beautiful gradient UI
- Keyboard controls

## How to Play

1. Open `index.html` in a web browser
2. The game starts automatically
3. Use keyboard controls to play:
   - **← / →** : Move piece left/right
   - **↑** : Rotate piece
   - **↓** : Soft drop (move down faster)
   - **Space** : Hard drop (instant drop)
   - **P** : Pause/Resume game

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

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling and layout
- `tetris.js` - Game logic and mechanics

## Browser Compatibility

Works on all modern browsers that support HTML5 Canvas:
- Chrome
- Firefox
- Safari
- Edge

## License

Free to use and modify.
