import React, { useState } from 'react';

// Space Explorer - A compact roguelike space adventure game built entirely with useState
function SpaceExplorer() {
  // Game state
  const [gameState, setGameState] = useState('start'); // start, play, station, combat, event, gameover
  const [playerName, setPlayerName] = useState('');
  const [notification, setNotification] = useState(null);
  
  // Player stats & inventory
  const [ship, setShip] = useState({
    name: 'The Wanderer',
    hull: 100,
    maxHull: 100,
    shields: 50,
    maxShields: 50,
    energy: 100,
    maxEnergy: 100,
    fuel: 25,
    maxFuel: 25,
    credits: 500,
    weapons: [{ name: 'Laser Cannon', damage: 15, energyCost: 10, chance: 0.8 }],
    cargo: []
  });
  
  // Game world
  const [currentSector, setCurrentSector] = useState({ x: 5, y: 5 });
  const [distanceToCenter, setDistanceToCenter] = useState(7);
  const [currentSystem, setCurrentSystem] = useState(null);
  const [exploredSystems, setExploredSystems] = useState({});
  const [logs, setLogs] = useState([]);
  
  // Combat
  const [enemy, setEnemy] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  
  // Event
  const [currentEvent, setCurrentEvent] = useState(null);
  
  // Station
  const [stationInventory, setStationInventory] = useState([]);
  
  // =====================
  // GAME INITIALIZATION
  // =====================
  
  const startGame = () => {
    if (!playerName) {
      setNotification("Please enter your name, captain!");
      return;
    }
    
    // Generate starting system
    const firstSystem = generateStarSystem(currentSector.x, currentSector.y);
    
    // Track explored systems
    const newExplored = {};
    newExplored[`${currentSector.x},${currentSector.y}`] = firstSystem;
    
    setCurrentSystem(firstSystem);
    setExploredSystems(newExplored);
    setGameState('play');
    setLogs([`Day 1: Launched from Centauri Station. Destination: the Galactic Core.`]);
    calculateDistanceToCenter();
  };
  
  // Calculate distance to center (win condition)
  const calculateDistanceToCenter = () => {
    const distance = Math.sqrt(Math.pow(currentSector.x, 2) + Math.pow(currentSector.y, 2));
    setDistanceToCenter(Math.round(distance));
    
    // Check win condition
    if (distance < 1) {
      setGameState('gameover');
      setNotification("You've reached the galactic core! Victory!");
    }
  };
  
  // =====================
  // STAR SYSTEM GENERATION
  // =====================
  
  // Generate a star system based on coordinates
  const generateStarSystem = (x, y) => {
    // Use coordinates as seed for pseudo-random generation
    const seed = x * 1000 + y;
    const rng = createSeededRandom(seed);
    
    // Star types
    const starTypes = [
      {type: 'Yellow Star', color: '#FFF266', probability: 0.4},
      {type: 'Red Dwarf', color: '#FF6B66', probability: 0.3},
      {type: 'Blue Giant', color: '#66AFFF', probability: 0.15},
      {type: 'White Dwarf', color: '#FFFFFF', probability: 0.1},
      {type: 'Neutron Star', color: '#C6EEFF', probability: 0.05}
    ];
    
    // Select star type
    let selectedStar = starTypes[0];
    const roll = rng();
    let cumulativeProbability = 0;
    
    for (const star of starTypes) {
      cumulativeProbability += star.probability;
      if (roll <= cumulativeProbability) {
        selectedStar = star;
        break;
      }
    }
    
    // Generate name
    const prefix = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
    const suffix = ['Centauri', 'Proxima', 'Cygni', 'Eridani', 'Orionis', 'Draconis'];
    const systemName = prefix[Math.floor(rng() * prefix.length)] + ' ' + 
                      Math.floor(rng() * 999) + ' ' + 
                      suffix[Math.floor(rng() * suffix.length)];
    
    // System details
    const planetCount = Math.floor(rng() * 5);
    const hasStation = rng() < 0.4;
    const threatLevel = Math.max(0, 1 - (Math.sqrt(x*x + y*y) / 10)) + (rng() * 0.3);
    
    // Resources
    const resources = [];
    if (rng() < 0.7) {
      const resourceTypes = ['Fuel', 'Minerals', 'Tech Components', 'Exotic Matter'];
      resources.push({
        type: resourceTypes[Math.floor(rng() * resourceTypes.length)],
        amount: Math.floor(rng() * 30) + 10
      });
    }
    
    return {
      name: systemName,
      sector: {x, y},
      star: selectedStar,
      planets: planetCount,
      hasStation: hasStation,
      stationName: hasStation ? `${systemName} Station` : null,
      threatLevel: threatLevel,
      resources: resources,
      description: `A ${selectedStar.type.toLowerCase()} system with ${planetCount} planets.${hasStation ? ' There is a space station in orbit.' : ''}`
    };
  };
  
  // Create a seeded random number generator
  const createSeededRandom = (seed) => {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };
  
  // =====================
  // NAVIGATION ACTIONS
  // =====================
  
  // Navigate to a new system
  const navigateToSystem = (x, y) => {
    // Check fuel
    if (ship.fuel < 1) {
      setNotification("Not enough fuel!");
      return;
    }
    
    // Update fuel and position
    setShip(prev => ({...prev, fuel: prev.fuel - 1}));
    setCurrentSector({ x, y });
    
    // Check if we've already explored this system
    const systemKey = `${x},${y}`;
    if (exploredSystems[systemKey]) {
      setCurrentSystem(exploredSystems[systemKey]);
    } else {
      // Generate a new system
      const newSystem = generateStarSystem(x, y);
      setExploredSystems(prev => ({...prev, [systemKey]: newSystem}));
      setCurrentSystem(newSystem);
    }
    
    // Update logs
    setLogs(prev => [...prev, `Jumped to a new star system at coordinates ${x},${y}.`]);
    calculateDistanceToCenter();
    
    // Random encounter (30% chance)
    if (Math.random() < 0.3) {
      triggerRandomEncounter();
    }
    
    // Game over if out of fuel
    if (ship.fuel <= 0) {
      setGameState('gameover');
      setNotification("Your ship has run out of fuel. You drift endlessly through the void...");
    }
  };
  
  // Scan the system
  const scanSystem = () => {
    if (ship.energy < 10) {
      setNotification("Not enough energy for scan!");
      return;
    }
    
    setShip(prev => ({...prev, energy: prev.energy - 10}));
    
    if (currentSystem.resources.length > 0) {
      const resource = currentSystem.resources[0];
      setNotification(`Scan complete! Detected ${resource.amount} units of ${resource.type}.`);
    } else {
      setNotification("Scan complete! No significant resources detected.");
    }
  };
  
  // Collect resources
  const collectResources = () => {
    if (currentSystem.resources.length === 0) {
      setNotification("No resources to collect!");
      return;
    }
    
    if (ship.energy < 20) {
      setNotification("Not enough energy!");
      return;
    }
    
    setShip(prev => ({...prev, energy: prev.energy - 20}));
    
    const resource = currentSystem.resources[0];
    
    if (resource.type === 'Fuel') {
      const fuelGained = Math.min(resource.amount, ship.maxFuel - ship.fuel);
      setShip(prev => ({...prev, fuel: prev.fuel + fuelGained}));
      setNotification(`Collected ${fuelGained} units of fuel!`);
    } else {
      const value = resource.type === 'Exotic Matter' ? 180 : 
                    resource.type === 'Tech Components' ? 90 : 45;
      
      setShip(prev => ({
        ...prev,
        cargo: [...prev.cargo, {
          name: resource.type,
          description: `Collected from ${currentSystem.name}`,
          sellPrice: value
        }]
      }));
      
      setNotification(`Added ${resource.type} to cargo!`);
    }
    
    // Remove the resource
    setCurrentSystem(prev => ({...prev, resources: []}));
  };
  
  // Visit space station
  const visitStation = () => {
    if (!currentSystem.hasStation) {
      setNotification("There is no station in this system!");
      return;
    }
    
    generateStationInventory();
    setGameState('station');
    setNotification(`Docked at ${currentSystem.stationName}.`);
  };
  
  // Generate station inventory
  const generateStationInventory = () => {
    const inventory = [
      { type: 'service', name: 'Ship Repairs', price: 5, unit: 'per hull point' },
      { type: 'service', name: 'Refuel', price: 10, unit: 'per fuel unit' }
    ];
    
    // Random items
    const possibleItems = [
      { type: 'weapon', name: 'Heavy Laser', price: 800, effect: {damage: 25, energyCost: 15, chance: 0.75} },
      { type: 'weapon', name: 'Plasma Cannon', price: 1500, effect: {damage: 40, energyCost: 20, chance: 0.7} },
      { type: 'upgrade', name: 'Shield Booster', price: 600, effect: {stat: 'maxShields', value: 25} },
      { type: 'upgrade', name: 'Hull Reinforcement', price: 750, effect: {stat: 'maxHull', value: 30} },
      { type: 'upgrade', name: 'Energy Capacitor', price: 500, effect: {stat: 'maxEnergy', value: 20} },
      { type: 'cargo', name: 'Minerals', price: 50, sellPrice: 45 },
      { type: 'cargo', name: 'Tech Components', price: 100, sellPrice: 90 },
      { type: 'cargo', name: 'Exotic Matter', price: 200, sellPrice: 180 }
    ];
    
    // Add 3-5 random items
    const itemCount = Math.floor(Math.random() * 3) + 3;
    const shuffled = [...possibleItems].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < itemCount; i++) {
      if (i < shuffled.length) {
        inventory.push(shuffled[i]);
      }
    }
    
    setStationInventory(inventory);
  };
  
  // Repair ship
  const repairShip = (amount) => {
    const cost = amount * 5;
    
    if (ship.credits < cost) {
      setNotification("Not enough credits!");
      return;
    }
    
    setShip(prev => ({
      ...prev,
      hull: Math.min(prev.hull + amount, prev.maxHull),
      credits: prev.credits - cost
    }));
    
    setNotification(`Repaired ${amount} hull points for ${cost} credits.`);
  };
  
  // Refuel ship
  const refuelShip = (amount) => {
    const cost = amount * 10;
    
    if (ship.credits < cost) {
      setNotification("Not enough credits!");
      return;
    }
    
    setShip(prev => ({
      ...prev,
      fuel: Math.min(prev.fuel + amount, prev.maxFuel),
      credits: prev.credits - cost
    }));
    
    setNotification(`Added ${amount} fuel for ${cost} credits.`);
  };
  
  // Purchase item
  const purchaseItem = (item) => {
    if (ship.credits < item.price) {
      setNotification("Not enough credits!");
      return;
    }
    
    if (item.type === 'weapon') {
      // Check if we already have this weapon
      if (ship.weapons.some(w => w.name === item.name)) {
        setNotification("You already have this weapon!");
        return;
      }
      
      setShip(prev => ({
        ...prev,
        weapons: [...prev.weapons, {
          name: item.name,
          damage: item.effect.damage,
          energyCost: item.effect.energyCost,
          chance: item.effect.chance
        }],
        credits: prev.credits - item.price
      }));
    } 
    else if (item.type === 'upgrade') {
      const upgradedShip = {...ship};
      upgradedShip[item.effect.stat] += item.effect.value;
      upgradedShip.credits -= item.price;
      
      setShip(upgradedShip);
    }
    else if (item.type === 'cargo') {
      setShip(prev => ({
        ...prev,
        cargo: [...prev.cargo, {
          name: item.name,
          description: item.description,
          sellPrice: item.sellPrice
        }],
        credits: prev.credits - item.price
      }));
    }
    
    setNotification(`Purchased ${item.name}!`);
  };
  
  // Sell cargo item
  const sellItem = (index) => {
    const item = ship.cargo[index];
    
    setShip(prev => {
      const newCargo = [...prev.cargo];
      newCargo.splice(index, 1);
      
      return {
        ...prev,
        cargo: newCargo,
        credits: prev.credits + item.sellPrice
      };
    });
    
    setNotification(`Sold ${item.name} for ${item.sellPrice} credits.`);
  };
  
  // Recharge shields
  const rechargeShields = () => {
    const energyNeeded = ship.maxShields - ship.shields;
    const energyToUse = Math.min(energyNeeded, ship.energy);
    
    setShip(prev => ({
      ...prev,
      shields: prev.shields + energyToUse,
      energy: prev.energy - energyToUse
    }));
    
    setNotification(`Recharged shields using ${energyToUse} energy.`);
  };
  
  // =====================
  // ENCOUNTERS
  // =====================
  
  // Trigger a random encounter
  const triggerRandomEncounter = () => {
    const encounterType = Math.random();
    
    if (encounterType < 0.6) {
      // Combat encounter (60% chance)
      startCombat();
    } else {
      // Random event (40% chance)
      triggerEvent();
    }
  };
  
  // Combat system
  const startCombat = () => {
    // Generate enemy based on threat level
    const threatLevel = currentSystem.threatLevel;
    const enemyTypes = [
      { name: 'Pirate Scout', baseHull: 50, damage: 8, credits: 100 },
      { name: 'Pirate Fighter', baseHull: 80, damage: 12, credits: 150 },
      { name: 'Pirate Cruiser', baseHull: 120, damage: 18, credits: 250 },
      { name: 'Alien Scout', baseHull: 70, damage: 15, credits: 200 },
      { name: 'Alien Warship', baseHull: 150, damage: 25, credits: 350 }
    ];
    
    // Select enemy type based on threat
    let enemyIndex = 0;
    if (threatLevel > 0.3) enemyIndex = 1;
    if (threatLevel > 0.5) enemyIndex = 2;
    if (threatLevel > 0.7) enemyIndex = 3;
    if (threatLevel > 0.9) enemyIndex = 4;
    
    // Allow some randomness
    if (Math.random() < 0.3 && enemyIndex > 0) enemyIndex--;
    if (Math.random() < 0.3 && enemyIndex < enemyTypes.length - 1) enemyIndex++;
    
    const enemyType = enemyTypes[enemyIndex];
    
    // Scale with threat
    const scaledHull = Math.round(enemyType.baseHull * (0.8 + (threatLevel * 0.5)));
    const scaledDamage = Math.round(enemyType.damage * (0.8 + (threatLevel * 0.5)));
    const scaledCredits = Math.round(enemyType.credits * (0.8 + (threatLevel * 0.5)));
    
    // Create enemy
    const newEnemy = {
      name: enemyType.name,
      hull: scaledHull,
      maxHull: scaledHull,
      damage: scaledDamage,
      credits: scaledCredits,
      chanceToHit: 0.7
    };
    
    setEnemy(newEnemy);
    setCombatLog([`A ${newEnemy.name} approaches and opens fire!`]);
    setGameState('combat');
  };
  
  // Player attacks in combat
  const attackEnemy = (weaponIndex) => {
    const weapon = ship.weapons[weaponIndex];
    
    // Check energy
    if (ship.energy < weapon.energyCost) {
      setCombatLog(prev => [...prev, `Not enough energy to fire ${weapon.name}!`]);
      return;
    }
    
    // Use energy
    setShip(prev => ({...prev, energy: prev.energy - weapon.energyCost}));
    
    // Attack hits?
    const attackHits = Math.random() < weapon.chance;
    
    if (attackHits) {
      // Update enemy health
      const newEnemyHull = Math.max(0, enemy.hull - weapon.damage);
      setEnemy(prev => ({...prev, hull: newEnemyHull}));
      
      setCombatLog(prev => [...prev, `Your ${weapon.name} hits for ${weapon.damage} damage!`]);
      
      // Check if enemy is destroyed
      if (newEnemyHull <= 0) {
        endCombat(true);
        return;
      }
    } else {
      setCombatLog(prev => [...prev, `Your ${weapon.name} misses!`]);
    }
    
    // Enemy's turn
    enemyAttack();
  };
  
  // Enemy attacks
  const enemyAttack = () => {
    // Hit or miss?
    const attackHits = Math.random() < enemy.chanceToHit;
    
    if (attackHits) {
      // Calculate damage
      let damage = enemy.damage;
      
      // Shields absorb 50% of damage
      if (ship.shields > 0) {
        const shieldAbsorption = Math.min(ship.shields, damage * 0.5);
        damage = Math.max(0, damage - shieldAbsorption);
        
        setShip(prev => ({...prev, shields: Math.max(0, prev.shields - shieldAbsorption)}));
        setCombatLog(prev => [...prev, `Shields absorb ${shieldAbsorption.toFixed(1)} damage!`]);
      }
      
      // Apply damage to hull
      setShip(prev => ({...prev, hull: Math.max(0, prev.hull - damage)}));
      
      setCombatLog(prev => [...prev, `Enemy hits for ${damage.toFixed(1)} hull damage!`]);
      
      // Check if player is destroyed
      if (ship.hull <= 0) {
        endCombat(false);
      }
    } else {
      setCombatLog(prev => [...prev, `Enemy attack misses!`]);
    }
  };
  
  // Try to escape from combat
  const tryToEscape = () => {
    if (Math.random() < 0.5) {
      setCombatLog(prev => [...prev, `You successfully escape!`]);
      setGameState('play');
      setEnemy(null);
    } else {
      setCombatLog(prev => [...prev, `Escape failed!`]);
      enemyAttack();
    }
  };
  
  // End combat
  const endCombat = (playerWon) => {
    if (playerWon) {
      // Player won
      setCombatLog(prev => [...prev, `You destroyed the ${enemy.name}!`]);
      
      // Award credits
      setShip(prev => ({...prev, credits: prev.credits + enemy.credits}));
      
      // Chance for energy recharge
      if (Math.random() < 0.7) {
        const energyGained = Math.floor(Math.random() * 30) + 20;
        setShip(prev => ({
          ...prev,
          energy: Math.min(prev.energy + energyGained, prev.maxEnergy)
        }));
        setCombatLog(prev => [...prev, `Recovered ${energyGained} energy from debris.`]);
      }
      
      // Add to log
      setLogs(prev => [...prev, `Defeated a ${enemy.name} in the ${currentSystem.name} system.`]);
      
      setTimeout(() => {
        setGameState('play');
        setEnemy(null);
        setNotification(`Victory! Earned ${enemy.credits} credits.`);
      }, 2000);
    } else {
      // Player lost
      setCombatLog(prev => [...prev, `Your ship has been destroyed!`]);
      setGameState('gameover');
      setNotification(`Game Over! Your ship was destroyed by a ${enemy.name}.`);
    }
  };
  
  // Random events system
  const triggerEvent = () => {
    const events = [
      {
        title: "Distress Signal",
        description: "You pick up a distress signal from a nearby ship.",
        options: [
          { text: "Investigate", outcome: () => {
            if (Math.random() < 0.6) {
              setShip(prev => ({...prev, credits: prev.credits + 200}));
              setNotification("You rescue a merchant who rewards you with 200 credits!");
            } else {
              setShip(prev => ({...prev, hull: Math.max(0, prev.hull - 15)}));
              setNotification("It's a trap! Pirates ambush your ship, causing 15 hull damage!");
              if (ship.hull <= 0) {
                setGameState('gameover');
              }
            }
          }},
          { text: "Ignore", outcome: () => {
            setNotification("You avoid what sensors later confirm was a trap. Smart move!");
          }}
        ]
      },
      {
        title: "Asteroid Field",
        description: "You encounter a dense asteroid field blocking your path.",
        options: [
          { text: "Navigate carefully", outcome: () => {
            if (Math.random() < 0.7) {
              setShip(prev => ({
                ...prev,
                cargo: [...prev.cargo, {
                  name: "Rare Minerals",
                  description: "Valuable minerals from an asteroid field",
                  sellPrice: 150
                }]
              }));
              setNotification("You discover valuable minerals worth 150 credits!");
            } else {
              setShip(prev => ({...prev, hull: Math.max(0, prev.hull - 10)}));
              setNotification("A small asteroid impacts your ship. 10 hull damage.");
              if (ship.hull <= 0) {
                setGameState('gameover');
              }
            }
          }},
          { text: "Blast through", outcome: () => {
            if (Math.random() < 0.4) {
              setShip(prev => ({
                ...prev,
                energy: Math.min(prev.energy + 30, prev.maxEnergy)
              }));
              setNotification("Your weapons make short work of the asteroids!");
            } else {
              setShip(prev => ({...prev, hull: Math.max(0, prev.hull - 25)}));
              setNotification("Your aggressive approach results in multiple impacts. 25 hull damage!");
              if (ship.hull <= 0) {
                setGameState('gameover');
              }
            }
          }}
        ]
      },
      {
        title: "Nebula Cloud",
        description: "A strange nebula cloud with unusual energy readings appears ahead.",
        options: [
          { text: "Enter the nebula", outcome: () => {
            if (Math.random() < 0.5) {
              setShip(prev => ({
                ...prev,
                energy: prev.maxEnergy,
                shields: prev.maxShields
              }));
              setNotification("The nebula's energy recharges your systems completely!");
            } else {
              setShip(prev => ({
                ...prev,
                energy: Math.max(0, prev.energy - 40),
                shields: Math.max(0, prev.shields - 30)
              }));
              setNotification("The nebula interferes with your systems, draining energy and shields!");
            }
          }},
          { text: "Go around", outcome: () => {
            if (Math.random() < 0.5) {
              setShip(prev => ({...prev, credits: prev.credits + 50}));
              setNotification("You gather useful data about the phenomenon.");
            } else {
              setShip(prev => ({...prev, fuel: Math.max(0, prev.fuel - 2)}));
              setNotification("Going around costs extra fuel.");
              if (ship.fuel <= 0) {
                setGameState('gameover');
              }
            }
          }}
        ]
      }
    ];
    
    // Select random event
    const selectedEvent = events[Math.floor(Math.random() * events.length)];
    setCurrentEvent(selectedEvent);
    setGameState('event');
  };
  
  // Select event option
  const selectEventOption = (index) => {
    if (currentEvent && currentEvent.options[index]) {
      currentEvent.options[index].outcome();
      setGameState('play');
      setCurrentEvent(null);
    }
  };
  
  // RENDERING UI
  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#e1e1e1',
      backgroundColor: '#101020',
      minHeight: '100vh'
    }}>
      <h1 style={{ textAlign: 'center', color: '#3498db' }}>SPACE EXPLORER</h1>
      
      {/* Start Screen */}
      {gameState === 'start' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Begin Your Journey to the Galactic Core</h2>
          <div style={{ margin: '20px 0' }}>
            <input 
              type="text" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your captain name"
              style={{ padding: '8px', marginRight: '10px' }}
            />
            <button 
              onClick={startGame}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Start Game
            </button>
          </div>
          {notification && <div style={{ color: '#e74c3c', margin: '10px 0' }}>{notification}</div>}
        </div>
      )}
      
      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div style={{ textAlign: 'center' }}>
          <h2>Game Over</h2>
          <p>{notification}</p>
          <button 
            onClick={() => {
              setGameState('start');
              setPlayerName('');
              setShip({
                name: 'The Wanderer',
                hull: 100,
                maxHull: 100,
                shields: 50,
                maxShields: 50,
                energy: 100,
                maxEnergy: 100,
                fuel: 25,
                maxFuel: 25,
                credits: 500,
                weapons: [{ name: 'Laser Cannon', damage: 15, energyCost: 10, chance: 0.8 }],
                cargo: []
              });
              setCurrentSector({ x: 5, y: 5 });
              setDistanceToCenter(7);
            }}
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            New Game
          </button>
        </div>
      )}
      
      {/* Main Game Screen */}
      {(gameState === 'play' || gameState === 'station' || gameState === 'combat' || gameState === 'event') && (
        <div>
          {/* Ship Status Bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '10px',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <div>
              <span style={{ color: ship.hull < 30 ? '#e74c3c' : 'inherit' }}>
                Hull: {ship.hull}/{ship.maxHull}
              </span> | 
              Shields: {ship.shields}/{ship.maxShields} | 
              Energy: {ship.energy}/{ship.maxEnergy}
            </div>
            <div>
              {/* Render UI for "play" state */}
              {gameState === 'play' && (
                <div>
                  <p>Current System: {currentSystem ? currentSystem.name : "Unknown"}</p>
                  <div>
                    <button onClick={() => navigateToSystem(currentSector.x + 1, currentSector.y)}>Move East</button>
                    <button onClick={() => navigateToSystem(currentSector.x - 1, currentSector.y)}>Move West</button>
                    <button onClick={() => navigateToSystem(currentSector.x, currentSector.y + 1)}>Move South</button>
                    <button onClick={() => navigateToSystem(currentSector.x, currentSector.y - 1)}>Move North</button>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <button onClick={scanSystem}>Scan System</button>
                    <button onClick={collectResources}>Collect Resources</button>
                    {currentSystem && currentSystem.hasStation && (
                      <button onClick={visitStation}>Visit Station</button>
                    )}
                    <button onClick={rechargeShields}>Recharge Shields</button>
                  </div>
                  {/* New section: Display distance to core */}
                  <div style={{ marginTop: '10px' }}>
                    <span>Distance to Core: {distanceToCenter}</span>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <h3>Log:</h3>
                    <ul>
                      {logs.map((entry, idx) => <li key={idx}>{entry}</li>)}
                    </ul>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <h3>Cargo:</h3>
                    {ship.cargo.length > 0 ? (
                      <ul>
                        {ship.cargo.map((item, idx) => (
                          <li key={idx}>
                            {item.name} - Sell Price: {item.sellPrice} 
                            <button onClick={() => sellItem(idx)}>Sell</button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No cargo items.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Render UI for "station" state */}
              {gameState === 'station' && (
                <div>
                  <h2>{currentSystem ? currentSystem.stationName : "Station"}</h2>
                  <div>
                    <h3>Services</h3>
                    <button onClick={() => repairShip(10)}>Repair 10 Hull</button>
                    <button onClick={() => refuelShip(5)}>Refuel 5 Units</button>
                  </div>
                  <div>
                    <h3>Inventory</h3>
                    <ul>
                      {stationInventory.map((item, idx) => (
                        <li key={idx}>
                          {item.name} - {item.price} credits 
                          <button onClick={() => purchaseItem(item)}>Buy</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => setGameState('play')}>Leave Station</button>
                </div>
              )}

              {/* Render UI for "combat" state */}
              {gameState === 'combat' && enemy && (
                <div>
                  <h2>Combat with {enemy.name}</h2>
                  <p>Enemy Hull: {enemy.hull}/{enemy.maxHull}</p>
                  <div>
                    <h3>Your Weapons</h3>
                    {ship.weapons.map((weapon, idx) => (
                      <button key={idx} onClick={() => attackEnemy(idx)}>
                        {weapon.name} (Energy: {weapon.energyCost})
                      </button>
                    ))}
                    <button onClick={tryToEscape}>Escape</button>
                  </div>
                  <div>
                    <h3>Combat Log</h3>
                    <ul>
                      {combatLog.map((entry, idx) => <li key={idx}>{entry}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {/* Render UI for "event" state */}
              {gameState === 'event' && currentEvent && (
                <div>
                  <h2>{currentEvent.title}</h2>
                  <p>{currentEvent.description}</p>
                  <div>
                    {currentEvent.options.map((option, idx) => (
                      <button key={idx} onClick={() => selectEventOption(idx)}>
                        {option.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpaceExplorer;
