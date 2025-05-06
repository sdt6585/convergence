/**
 * Calculate distance between two points
 * @param {Object} a - First point with x and y coordinates
 * @param {Object} b - Second point with x and y coordinates
 * @returns {number} Distance between the points
 */
export function calculateDistance(a, b) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * Normalize a vector to unit length
 * Converts any vector to a vector with same direction but length 1
 * @param {Object} v - Vector with x and y components
 * @returns {Object} Normalized vector with x and y components
 */
export function normalizeVector(v) {
  const magnitude = Math.sqrt(v.x * v.x + v.y * v.y);
  if (magnitude === 0) return { x: 0, y: 0 };
  return { x: v.x / magnitude, y: v.y / magnitude };
}

/**
 * Calculate polygon vertices representing possible movement area
 * @param {Object} ship - Ship object with position, velocity and maxThrust
 * @returns {Array} Array of points forming the movement area polygon
 */
export function calculatePossibleMoveArea(ship) {
  const vertices = [];
  const angleSteps = 16; // Number of vertices for the polygon
  
  for (let i = 0; i < angleSteps; i++) {
    const angle = (i / angleSteps) * Math.PI * 2;
    const thrust = ship.maxThrust;
    
    // Calculate end position considering current velocity and max thrust
    const endPosition = {
      x: ship.position.x + ship.velocity.x + Math.cos(angle) * thrust,
      y: ship.position.y + ship.velocity.y + Math.sin(angle) * thrust
    };
    
    vertices.push(endPosition);
  }
  
  return vertices;
}

/**
 * Calculate trajectory path between current position and target
 * @param {Object} startPos - Starting position with x and y coordinates
 * @param {Object} startVel - Starting velocity with x and y components
 * @param {Object} targetPos - Target position with x and y coordinates
 * @param {number} maxThrust - Maximum thrust capability
 * @param {number} steps - Number of steps to calculate in the trajectory
 * @returns {Array} Array of points along the trajectory
 */
export function calculateTrajectory(
  startPos,
  startVel,
  targetPos,
  maxThrust,
  steps = 10
) {
  const trajectory = [];
  const currentPos = { ...startPos };
  const currentVel = { ...startVel };
  
  // First point is the starting position
  trajectory.push({ ...currentPos });
  
  // Vector to target
  const toTarget = {
    x: targetPos.x - startPos.x,
    y: targetPos.y - startPos.y
  };
  
  // Calculate total distance to target
  const distanceToTarget = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y);
  
  // Normalize the direction vector
  const direction = normalizeVector(toTarget);
  
  // Calculate required thrust (constrain by maxThrust)
  const requiredThrust = Math.min(distanceToTarget, maxThrust);
  
  for (let i = 1; i < steps; i++) {
    // Calculate progress along the path (non-linear ease-in-out)
    const t = i / steps;
    const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    
    // Calculate position at this step
    const newPos = {
      x: startPos.x + startVel.x * t + direction.x * requiredThrust * easedT,
      y: startPos.y + startVel.y * t + direction.y * requiredThrust * easedT
    };
    
    trajectory.push(newPos);
  }
  
  // Final point is the target position
  trajectory.push({ ...targetPos });
  
  return trajectory;
}