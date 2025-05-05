import { writable, get } from 'svelte/store';
import { calculateTrajectory } from './physics';

// Initial game state
/**
 * @typedef {Object} GameState
 * @property {Array<Ship>} ships - List of ships in the game
 * @property {number} turnNumber - Current turn number
 * @property {string|null} selectedShipId - ID of the currently selected ship, if any
 * @property {boolean} animating - State of game, true while animating turn
 * @property {number} animationProgress - Number of frames into animation (out of 30)
 */

/**
 * @typedef {Object} Ship
 * @property {string} id - Unique identifier for the ship
 * @property {string} name - Display name of the ship
 * @property {Object} position - Position coordinates of the ship
 * @property {number} position.x - X component of position
 * @property {number} position.y - Y component of position
 * @property {Object} startPosition - Starting position coordinates of the ship before turn
 * @property {number} startPosition.x - X component of startPosition
 * @property {number} startPosition.y - Y component of startPosition
 * @property {Object} endPosition - Ending position coordinates of the ship after a turn
 * @property {number} endPosition.x - X component of endPosition
 * @property {number} endPosition.y - Y component of endPosition
 * @property {Object} velocity - Random initial velocity vector
 * @property {number} velocity.x - X component of velocity between -1 and 1
 * @property {number} velocity.y - Y component of velocity between -1 and 1
 * @property {number} heading - Random initial heading in radians (0 to 2π)
 * @property {number} maxThrust - Maximum thrust capability
 * @property {string} faction - The faction the ship belongs to
 * @property {number} hull - Current hull integrity
 * @property {number} maxHull - Maximum hull integrity
 * @property {boolean} selected - Selection state, defaults to false
 */

/**
 * @type {GameState}
 */
const initialState = {
  ships: [],
  turnNumber: 1,
  selectedShipId: null,
  animating: false,
  animationProgress: 0
};

export const gameState = writable(initialState);

/**
 * Creates a new ship with the given parameters
 * 
 * @param {string} id - Unique identifier for the ship
 * @param {string} name - Display name of the ship
 * @param {string} faction - The faction the ship belongs to
 * @param {Object} position - Initial position coordinates of the ship
 * @param {number} position.x - X coordinate of the ship's position
 * @param {number} position.y - Y coordinate of the ship's position
 * @returns {Ship} The created ship object
 */
export function createShip(
  id,
  name,
  faction,
  position
) {
  return {
    id,
    name,
    position,
    velocity: { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 },
    heading: Math.random() * Math.PI * 2,
    maxThrust: 20, // Increased from original value for more movement flexibility
    faction,
    hull: 100,
    maxHull: 100,
    selected: false
  };
}

/**
 * Reset ships to initial positions
 */
export function resetShips() {
  const ships = [
    createShip('player1', 'USS Artemis', 'player', { x: 400, y: 300 }),
    createShip('enemy1', 'Raider Alpha', 'enemy', { x: 200, y: 200 }),
    createShip('enemy2', 'Raider Beta', 'enemy', { x: 600, y: 400 })
  ];
  
  gameState.update(state => ({
    ...state,
    ships,
    turnNumber: 1,
    selectedShipId: null
  }));
}

/**
 * Simulate a turn of ship movement
 */
export function simulateTurn() {
  gameState.update(state => {
    // Calculate trajectories for each ship
    const updatedShips = state.ships.map(ship => {
      // Calculate end position based on velocity
      const targetPosition = {
        x: ship.position.x + ship.velocity.x,
        y: ship.position.y + ship.velocity.y
      };
      
      // Calculate curved trajectory with 30 steps for smooth animation
      const trajectory = calculateTrajectory(
        ship.position,
        ship.velocity,
        targetPosition,
        ship.maxThrust,
        30
      );
      
      return {
        ...ship,
        trajectory: trajectory,
        // Store original position for animation
        startPosition: { ...ship.position },
        // End position becomes the target
        endPosition: { ...targetPosition }
      };
    });
    
    return {
      ...state,
      ships: updatedShips,
      animating: true,
      animationProgress: 0,
      turnNumber: state.turnNumber + 1
    };
  });
  
  // Start the animation loop
  startAnimation();
}

/**
 * Handle animation of ship movement
 */
function startAnimation() {
  const animationSpeed = 0.02; // Controls animation speed
  
  function animate() {
    gameState.update(state => {
      if (!state.animating) return state;
      
      const progress = state.animationProgress + animationSpeed;
      
      if (progress >= 1) {
        // Animation complete, update final positions
        const updatedShips = state.ships.map(ship => {
          return {
            ...ship,
            position: { ...ship.endPosition },
            trajectory: null,
            startPosition: null,
            endPosition: null,
            thrusting: false
          };
        });
        
        return {
          ...state,
          ships: updatedShips,
          animating: false,
          animationProgress: 0
        };
      } else {
        // Animation in progress, update positions along trajectory
        const updatedShips = state.ships.map(ship => {
          const trajectoryIndex = Math.floor(progress * (ship.trajectory.length - 1));
          return {
            ...ship,
            position: { ...ship.trajectory[trajectoryIndex] },
            thrusting: true // Ship is thrusting during movement
          };
        });
        
        return {
          ...state,
          ships: updatedShips,
          animationProgress: progress
        };
      }
    });
    
    const state = get(gameState);
    if (state.animating) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}