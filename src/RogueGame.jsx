import React, { useState, useEffect, useCallback } from 'react';

// Space Invaders game using only useState for state management
function SpaceInvaders() {
  // Game constants
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;
  const PLAYER_WIDTH = 60;
  const PLAYER_HEIGHT = 20;
  const PLAYER_SPEED = 20;
  const ENEMY_WIDTH = 40;
  const ENEMY_HEIGHT = 30;
  const BULLET_WIDTH = 5;
  const BULLET_HEIGHT = 15;
  const BULLET_SPEED = 10;
  const ENEMY_BULLET_SPEED = 5;
  const ENEMY_MOVE_INTERVAL = 1000; // ms
  const ENEMY_SHOOT_CHANCE = 0.02; // 2% chance per enemy per move
  
  // Game state
  const [gameState, setGameState] = useState('start'); // start, playing, gameover, victory
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  
  // Player state
  const [playerPosition, setPlayerPosition] = useState({
    x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: GAME_HEIGHT - PLAYER_HEIGHT - 10
  });
  
  // Bullet states
  const [playerBullets, setPlayerBullets] = useState([]);
  const [enemyBullets, setEnemyBullets] = useState([]);
  
  // Enemy states
  const [enemies, setEnemies] = useState([]);
  const [enemyDirection, setEnemyDirection] = useState(1); // 1 for right, -1 for left
  const [enemySpeed, setEnemySpeed] = useState(10);
  
  // Initialize enemies for current level
  const initializeEnemies = useCallback(() => {
    const newEnemies = [];
    const rows = Math.min(4, 2 + Math.floor(level / 2)); // Increase rows with level, max 4
    const cols = Math.min(10, 6 + Math.floor(level / 2)); // Increase cols with level, max 10
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        newEnemies.push({
          x: col * (ENEMY_WIDTH + 20) + 50,
          y: row * (ENEMY_HEIGHT + 20) + 50,
          width: ENEMY_WIDTH,
          height: ENEMY_HEIGHT,
          type: row % 3, // Different enemy types based on row
          hit: false
        });
      }
    }
    
    setEnemies(newEnemies);
    setEnemySpeed(10 + level * 2); // Increase enemy speed with level
    setEnemyDirection(1);
  }, [level]);
  
  // Start a new game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
    setPlayerBullets([]);
    setEnemyBullets([]);
    
    setPlayerPosition({
      x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: GAME_HEIGHT - PLAYER_HEIGHT - 10
    });
    
    initializeEnemies();
  };
  
  // Start next level
  const startNextLevel = useCallback(() => {
    setLevel(prevLevel => prevLevel + 1);
    setPlayerBullets([]);
    setEnemyBullets([]);
    
    setPlayerPosition({
      x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
      y: GAME_HEIGHT - PLAYER_HEIGHT - 10
    });
    
    initializeEnemies();
  }, [initializeEnemies]);
  
  // Check if all enemies are destroyed
  useEffect(() => {
    if (gameState === 'playing' && enemies.length > 0) {
      const allEnemiesDestroyed = enemies.every(enemy => enemy.hit);
      
      if (allEnemiesDestroyed) {
        startNextLevel();
      }
    }
  }, [enemies, gameState, startNextLevel]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          setPlayerPosition(pos => ({
            ...pos,
            x: Math.max(0, pos.x - PLAYER_SPEED)
          }));
          break;
        case 'ArrowRight':
          setPlayerPosition(pos => ({
            ...pos,
            x: Math.min(GAME_WIDTH - PLAYER_WIDTH, pos.x + PLAYER_SPEED)
          }));
          break;
        case ' ': // Spacebar
          if (playerBullets.length < 3) { // Limit bullets
            setPlayerBullets(bullets => [
              ...bullets,
              {
                x: playerPosition.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
                y: playerPosition.y - BULLET_HEIGHT,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT
              }
            ]);
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, playerBullets, playerPosition]);
  
  // Update player bullets and check collisions
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const bulletInterval = setInterval(() => {
      // Move player bullets
      setPlayerBullets(bullets => {
        return bullets
          .map(bullet => ({
            ...bullet,
            y: bullet.y - BULLET_SPEED
          }))
          .filter(bullet => bullet.y > 0); // Remove bullets that go off screen
      });
      
      // Move enemy bullets
      setEnemyBullets(bullets => {
        return bullets
          .map(bullet => ({
            ...bullet,
            y: bullet.y + ENEMY_BULLET_SPEED
          }))
          .filter(bullet => bullet.y < GAME_HEIGHT); // Remove bullets that go off screen
      });
      
      // Check player bullet collisions with enemies
      setPlayerBullets(playerBullets => {
        const remainingBullets = [...playerBullets];
        
        setEnemies(enemies => {
          return enemies.map(enemy => {
            if (enemy.hit) return enemy;
            
            // Check if any bullet hits this enemy
            const bulletIndex = remainingBullets.findIndex(bullet => 
              bullet.x < enemy.x + enemy.width &&
              bullet.x + bullet.width > enemy.x &&
              bullet.y < enemy.y + enemy.height &&
              bullet.y + bullet.height > enemy.y
            );
            
            if (bulletIndex !== -1) {
              // Remove the bullet
              remainingBullets.splice(bulletIndex, 1);
              
              // Increase score
              setScore(score => score + (10 * (enemy.type + 1)));
              
              // Mark enemy as hit
              return { ...enemy, hit: true };
            }
            
            return enemy;
          });
        });
        
        return remainingBullets;
      });
      
      // Check enemy bullet collisions with player
      setEnemyBullets(enemyBullets => {
        return enemyBullets.filter(bullet => {
          const collision = 
            bullet.x < playerPosition.x + PLAYER_WIDTH &&
            bullet.x + bullet.width > playerPosition.x &&
            bullet.y < playerPosition.y + PLAYER_HEIGHT &&
            bullet.y + bullet.height > playerPosition.y;
          
          if (collision) {
            // Player was hit
            setLives(lives => {
              const newLives = lives - 1;
              if (newLives <= 0) {
                setGameState('gameover');
              }
              return newLives;
            });
            return false; // Remove the bullet
          }
          
          return true; // Keep the bullet
        });
      });
      
    }, 1000 / 60); // 60 FPS
    
    return () => clearInterval(bulletInterval);
  }, [gameState, playerPosition]);
  
  // Move enemies and let them shoot
  useEffect(() => {
    if (gameState !== 'playing' || enemies.length === 0) return;
    
    const moveEnemies = () => {
      // Check if any enemy is at the edge
      let hitEdge = false;
      let lowestEnemy = 0;
      
      enemies.forEach(enemy => {
        if (!enemy.hit) {
          // Find the lowest enemy position for game over condition
          lowestEnemy = Math.max(lowestEnemy, enemy.y + enemy.height);
          
          // Check if enemies hit the edge
          if (
            (enemyDirection > 0 && enemy.x + enemy.width + enemySpeed > GAME_WIDTH) ||
            (enemyDirection < 0 && enemy.x - enemySpeed < 0)
          ) {
            hitEdge = true;
          }
        }
      });
      
      // Check if enemies have reached the player level (game over)
      if (lowestEnemy > playerPosition.y - 20) {
        setGameState('gameover');
        return;
      }
      
      setEnemies(enemies => {
        let newEnemies = [...enemies];
        
        if (hitEdge) {
          // Change direction and move down
          setEnemyDirection(dir => -dir);
          
          newEnemies = newEnemies.map(enemy => ({
            ...enemy,
            y: enemy.y + 20 // Move down
          }));
        } else {
          // Keep moving in current direction
          newEnemies = newEnemies.map(enemy => ({
            ...enemy,
            x: enemy.x + (enemyDirection * enemySpeed)
          }));
        }
        
        // Enemy shooting
        newEnemies.forEach(enemy => {
          if (!enemy.hit && Math.random() < ENEMY_SHOOT_CHANCE) {
            setEnemyBullets(bullets => [
              ...bullets,
              {
                x: enemy.x + enemy.width / 2 - BULLET_WIDTH / 2,
                y: enemy.y + enemy.height,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT
              }
            ]);
          }
        });
        
        return newEnemies;
      });
    };
    
    const enemyInterval = setInterval(moveEnemies, ENEMY_MOVE_INTERVAL / level);
    
    return () => clearInterval(enemyInterval);
  }, [enemies, enemyDirection, enemySpeed, gameState, level, playerPosition.y]);
  
  // Initialize game on first load
  useEffect(() => {
    initializeEnemies();
  }, [initializeEnemies]);
  
  // Render the game
  return (
    <div style={{ 
      position: 'relative',
      width: `${GAME_WIDTH}px`, 
      height: `${GAME_HEIGHT}px`,
      margin: '0 auto',
      backgroundColor: '#000',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Game Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '10px', 
        color: '#fff',
        backgroundColor: '#111'
      }}>
        <div>Score: {score}</div>
        <div>Level: {level}</div>
        <div>Lives: {lives}</div>
      </div>
      
      {/* Start Screen */}
      {gameState === 'start' && (
        <div style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#fff'
        }}>
          <h1>SPACE INVADERS</h1>
          <p>Use arrow keys to move and spacebar to shoot</p>
          <button 
            onClick={startGame}
            style={{
              padding: '10px 20px',
              fontSize: '18px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Start Game
          </button>
        </div>
      )}
      
      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#fff'
        }}>
          <h1>GAME OVER</h1>
          <p>Final Score: {score}</p>
          <p>Level Reached: {level}</p>
          <button 
            onClick={startGame}
            style={{
              padding: '10px 20px',
              fontSize: '18px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Play Again
          </button>
        </div>
      )}
      
      {/* Player */}
      {gameState === 'playing' && (
        <div style={{
          position: 'absolute',
          left: `${playerPosition.x}px`,
          top: `${playerPosition.y}px`,
          width: `${PLAYER_WIDTH}px`,
          height: `${PLAYER_HEIGHT}px`,
          backgroundColor: '#4CAF50', // Green ship
          borderRadius: '5px'
        }} />
      )}
      
      {/* Player Bullets */}
      {playerBullets.map((bullet, index) => (
        <div 
          key={`player-bullet-${index}`}
          style={{
            position: 'absolute',
            left: `${bullet.x}px`,
            top: `${bullet.y}px`,
            width: `${bullet.width}px`,
            height: `${bullet.height}px`,
            backgroundColor: '#fff' // White bullet
          }}
        />
      ))}
      
      {/* Enemy Bullets */}
      {enemyBullets.map((bullet, index) => (
        <div 
          key={`enemy-bullet-${index}`}
          style={{
            position: 'absolute',
            left: `${bullet.x}px`,
            top: `${bullet.y}px`,
            width: `${bullet.width}px`,
            height: `${bullet.height}px`,
            backgroundColor: '#ff0000' // Red bullet
          }}
        />
      ))}
      
      {/* Enemies */}
      {enemies.map((enemy, index) => !enemy.hit && (
        <div 
          key={`enemy-${index}`}
          style={{
            position: 'absolute',
            left: `${enemy.x}px`,
            top: `${enemy.y}px`,
            width: `${enemy.width}px`,
            height: `${enemy.height}px`,
            backgroundColor: enemy.type === 0 ? '#ff0000' : 
                            enemy.type === 1 ? '#ff9900' : '#9900ff', // Different colors for types
            borderRadius: '4px'
          }}
        />
      ))}
    </div>
  );
}

export default SpaceInvaders;