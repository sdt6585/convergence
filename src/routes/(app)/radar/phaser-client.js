import Phaser from 'phaser';
import RadarScene from './RadarScene';
import { resetShips } from './gameStore';

/**
 * Create a Phaser game instance with responsive sizing
 * @param {HTMLElement} container - The DOM container for the game
 * @returns {Phaser.Game} Phaser game instance
 */
export function createPhaserGame(container) {
  // Get container dimensions
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  
  const config = {
    type: Phaser.AUTO,
    parent: container,
    width: width,
    height: height,
    backgroundColor: '#000033',
    scene: RadarScene,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    }
  };
  
  const game = new Phaser.Game(config);
  
  // Initialize ships
  resetShips();
  
  // Add resize handler
  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    if (game.scale && newWidth > 0 && newHeight > 0) {
      game.scale.resize(newWidth, newHeight);
      
      // Notify scene to update radar circles and UI elements
      const radarScene = game.scene.getScene('RadarScene');
      if (radarScene && radarScene.drawRadarCircles) {
        radarScene.drawRadarCircles();
        
        // Update zoom controls position
        if (radarScene.updateZoomControlsPosition) {
          radarScene.updateZoomControlsPosition();
        }
      }
    }
  });
  
  // Disable context menu on game container
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
  
  return game;
}