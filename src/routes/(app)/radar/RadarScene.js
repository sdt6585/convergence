import Phaser from 'phaser';
import { get } from 'svelte/store';
import { gameState } from './gameStore';
import { calculatePossibleMoveArea, calculateTrajectory } from './physics';

export default class RadarScene extends Phaser.Scene {
  /**
   * Initialize the radar scene
   */
  constructor() {
    super({ key: 'RadarScene' });
    this.ships = new Map();
    this.moveAreaGraphics = null;
    this.trajectoryGraphics = null;
    this.dragLine = null;
    this.selectedShip = null;
    this.isDragging = false;
    this.dragStart = null;
    this.contextMenu = null;
    
    // Zoom and scale properties
    this.zoomLevel = 1;
    this.baseScaleKm = 1000; // 1 pixel = 1000km at zoom level 1
    this.ringSpacingBase = 80; // Base pixels between rings
    this.radarCircles = null;
    this.ringLabels = [];
    this.scaleText = null;
  }
  
  /**
   * Create game objects and set up event handlers
   */
  create() {
    // Disable browser context menu
    this.input.mouse.disableContextMenu();
    
    // Create graphics objects for rendering
    this.moveAreaGraphics = this.add.graphics();
    this.trajectoryGraphics = this.add.graphics();
    this.dragLine = this.add.graphics();
    
    // Draw radar circles
    this.drawRadarCircles();
    
    // Add zoom controls
    this.addZoomControls();
    
    // Subscribe to game state changes
    gameState.subscribe(state => {
      this.updateShips(state.ships);
    });
    
    // Set up input handlers
    this.setupInputHandlers();
  }
  
  /**
   * Draw radar circles with distance labels
   */
  drawRadarCircles() {
    // Clear any existing rings
    if (this.radarCircles) {
      this.radarCircles.clear();
    } else {
      this.radarCircles = this.add.graphics();
    }
    
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    // Calculate ring spacing based on zoom
    const ringSpacing = this.ringSpacingBase / this.zoomLevel;
    const kmPerRing = this.baseScaleKm * ringSpacing / this.ringSpacingBase;
    
    this.radarCircles.lineStyle(1, 0x00ff00, 0.3);
    
    // Clean up old labels
    this.ringLabels.forEach(label => {
      if (label) label.destroy();
    });
    this.ringLabels = [];
    
    // Draw concentric circles
    for (let i = 1; i <= 5; i++) {
      this.radarCircles.strokeCircle(centerX, centerY, i * ringSpacing);
      
      // Add distance labels
      const label = this.add.text(
        centerX + i * ringSpacing, 
        centerY, 
        `${Math.round(i * kmPerRing)} km`, 
        { fontSize: '10px', color: '#00ff00' }
      );
      label.setOrigin(0, 0.5);
      this.ringLabels.push(label);
    }
    
    // Draw crosshairs
    this.radarCircles.lineStyle(1, 0x00ff00, 0.2);
    this.radarCircles.beginPath();
    this.radarCircles.moveTo(0, centerY);
    this.radarCircles.lineTo(this.cameras.main.width, centerY);
    this.radarCircles.moveTo(centerX, 0);
    this.radarCircles.lineTo(centerX, this.cameras.main.height);
    this.radarCircles.strokePath();
    
    // Update scale indicator
    if (!this.scaleText) {
      this.scaleText = this.add.text(10, 10, '', { fontSize: '12px', color: '#00ff00' });
    }
    this.scaleText.setText(`Scale: 1 px = ${Math.round(this.baseScaleKm / this.zoomLevel)} km`);
  }
  
  /**
   * Add zoom in/out controls to the scene
   */
  addZoomControls() {
    // Create zoom in button
    this.zoomInBtn = this.add.circle(this.cameras.main.width - 30, 30, 15, 0x004400);
    this.zoomInText = this.add.text(this.cameras.main.width - 30, 30, '+', { 
      fontSize: '20px', color: '#00ff00' 
    });
    this.zoomInText.setOrigin(0.5);
    
    // Create zoom out button
    this.zoomOutBtn = this.add.circle(this.cameras.main.width - 30, 70, 15, 0x004400);
    this.zoomOutText = this.add.text(this.cameras.main.width - 30, 70, '-', { 
      fontSize: '20px', color: '#00ff00' 
    });
    this.zoomOutText.setOrigin(0.5);
    
    // Make buttons interactive
    this.zoomInBtn.setInteractive();
    this.zoomOutBtn.setInteractive();
    
    // Add handlers
    this.zoomInBtn.on('pointerdown', () => this.changeZoom(0.25));
    this.zoomOutBtn.on('pointerdown', () => this.changeZoom(-0.25));
  }

  /**
   * Update position of zoom controls when the screen is resized
   */
  updateZoomControlsPosition() {
    if (this.zoomInBtn && this.zoomOutBtn) {
      // Position zoom in button in top right
      this.zoomInBtn.setPosition(this.cameras.main.width - 30, 30);
      this.zoomInText.setPosition(this.cameras.main.width - 30, 30);
      
      // Position zoom out button below zoom in
      this.zoomOutBtn.setPosition(this.cameras.main.width - 30, 70);
      this.zoomOutText.setPosition(this.cameras.main.width - 30, 70);
    }
  }
  
  /**
   * Change zoom level and update the display
   * @param {number} delta - Amount to change zoom by
   */
  changeZoom(delta) {
    this.zoomLevel = Math.max(0.25, Math.min(5, this.zoomLevel + delta));
    this.drawRadarCircles();
    
    // Redraw all ships at new scale
    this.updateShips(get(gameState).ships);
  }
  
  /**
   * Update ship visuals based on game state
   * @param {Array} ships - Array of ship objects from game state
   */
  updateShips(ships) {
    // Clear existing ships
    this.ships.forEach(shipContainer => shipContainer.destroy());
    this.ships.clear();
    
    // Create ship visuals
    ships.forEach(ship => {
      const container = this.createShipVisual(ship);
      this.ships.set(ship.id, container);
    });
  }
  
  /**
   * Create visual representation of a ship
   * @param {Object} ship - Ship object from game state
   * @returns {Phaser.GameObjects.Container} Container with ship visuals
   */
  createShipVisual(ship) {
    const container = this.add.container(ship.position.x, ship.position.y);
    
    // Ship body
    const graphics = this.add.graphics();
    graphics.lineStyle(2, ship.faction === 'player' ? 0x00ff00 : 0xff0000);
    graphics.beginPath();
    graphics.moveTo(10, 0);
    graphics.lineTo(-10, -7);
    graphics.lineTo(-5, 0);
    graphics.lineTo(-10, 7);
    graphics.closePath();
    graphics.strokePath();
    
    // Calculate ship speed for thruster sizing
    const speed = Math.sqrt(ship.velocity.x * ship.velocity.x + ship.velocity.y * ship.velocity.y);
    
    // Thruster (only shown when moving at meaningful speed)
    const thruster = this.add.graphics();
    if (speed > 0.5) {
      const thrusterSize = Math.min(1.5, Math.max(0.5, speed / 5)); // Scale between 0.5-1.5 based on speed
      thruster.lineStyle(2, 0x0088ff);
      thruster.beginPath();
      thruster.moveTo(-5, 0);
      thruster.lineTo(-15 * thrusterSize, 0);
      thruster.strokePath();
    }
    
    // Ship name
    const text = this.add.text(0, 15, ship.name, {
      fontSize: '12px',
      color: ship.faction === 'player' ? '#00ff00' : '#ff0000'
    });
    text.setOrigin(0.5, 0);
    
    container.add([graphics, thruster, text]);
    container.setData('ship', ship);
    
    // Set rotation based on heading
    container.setRotation(ship.heading);
    
    // Make interactive
    container.setSize(20, 20);
    container.setInteractive();
    
    return container;
  }
  
  /**
   * Setup input handlers for ship interaction
   */
  setupInputHandlers() {
    // Left click for selection and dragging
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        this.handleRightClick(pointer);
      } else {
        this.handleLeftClick(pointer);
      }
    });
    
    this.input.on('pointermove', (pointer) => {
      if (this.isDragging && this.selectedShip) {
        this.handleDrag(pointer);
      }
    });
    
    this.input.on('pointerup', (pointer) => {
      if (this.isDragging && this.selectedShip) {
        this.handleDragEnd(pointer);
      }
    });
  }
  
  /**
   * Handle left click for ship selection
   * @param {Phaser.Input.Pointer} pointer - Pointer object for the click event
   */
  handleLeftClick(pointer) {
    const clickedObject = this.input.hitTestPointer(pointer)[0];
    
    if (clickedObject && clickedObject.getData('ship')) {
      this.selectShip(clickedObject.getData('ship'));
      this.isDragging = true;
      this.dragStart = { x: pointer.x, y: pointer.y };
    } else {
      // Close context menu if clicking elsewhere
      if (this.contextMenu) {
        this.contextMenu.destroy();
        this.contextMenu = null;
      }
      
      this.deselectShip();
    }
  }
  
  /**
   * Handle right click for context menu
   * @param {Phaser.Input.Pointer} pointer - Pointer object for the click event
   */
  handleRightClick(pointer) {
    // Prevent default browser context menu
    pointer.event.preventDefault();
    
    const clickedObject = this.input.hitTestPointer(pointer)[0];
    
    if (clickedObject && clickedObject.getData('ship')) {
      this.showContextMenu(pointer, clickedObject.getData('ship'));
    }
  }
  
  /**
   * Handle dragging for ship movement
   * @param {Phaser.Input.Pointer} pointer - Pointer object for the drag event
   */
  handleDrag(pointer) {
    if (!this.selectedShip || !this.dragStart) return;
    
    // Calculate drag vector with scaling for precision
    const dragVector = {
      x: (pointer.x - this.dragStart.x) * 0.1,
      y: (pointer.y - this.dragStart.y) * 0.1
    };
    
    // Calculate target position
    const targetPosition = {
      x: this.selectedShip.position.x + this.selectedShip.velocity.x + dragVector.x,
      y: this.selectedShip.position.y + this.selectedShip.velocity.y + dragVector.y
    };
    
    // Draw drag line
    this.dragLine.clear();
    this.dragLine.lineStyle(2, 0x00ffff);
    this.dragLine.lineBetween(
      this.selectedShip.position.x,
      this.selectedShip.position.y,
      targetPosition.x,
      targetPosition.y
    );
    
    // Calculate and draw trajectory
    const trajectory = calculateTrajectory(
      this.selectedShip.position,
      this.selectedShip.velocity,
      targetPosition,
      this.selectedShip.maxThrust
    );
    
    this.trajectoryGraphics.clear();
    this.trajectoryGraphics.lineStyle(1, 0x00ffff, 0.5);
    this.trajectoryGraphics.beginPath();
    trajectory.forEach((point, index) => {
      if (index === 0) {
        this.trajectoryGraphics.moveTo(point.x, point.y);
      } else {
        this.trajectoryGraphics.lineTo(point.x, point.y);
      }
    });
    this.trajectoryGraphics.strokePath();
  }
  
  /**
   * Handle the end of a drag operation
   * @param {Phaser.Input.Pointer} pointer - Pointer object for the drag end event
   */
  handleDragEnd(pointer) {
    if (!this.selectedShip || !this.dragStart) return;
    
    // Calculate final velocity
    const dragVector = {
      x: (pointer.x - this.dragStart.x) * 0.1,
      y: (pointer.y - this.dragStart.y) * 0.1
    };
    
    // Update ship velocity
    gameState.update(state => {
      const shipIndex = state.ships.findIndex(s => s.id === this.selectedShip.id);
      if (shipIndex !== -1) {
        const newShips = [...state.ships];
        newShips[shipIndex] = {
          ...newShips[shipIndex],
          velocity: {
            x: newShips[shipIndex].velocity.x + dragVector.x,
            y: newShips[shipIndex].velocity.y + dragVector.y
          }
        };
        return {
          ...state,
          ships: newShips
        };
      }
      return state;
    });
    
    this.isDragging = false;
    this.dragStart = null;
    this.dragLine.clear();
  }
  
  /**
   * Select a ship and show movement area
   * @param {Object} ship - Ship object to select
   */
  selectShip(ship) {
    this.selectedShip = ship;
    gameState.update(state => ({
      ...state,
      selectedShipId: ship.id
    }));
    
    // Draw movement area
    const moveArea = calculatePossibleMoveArea(ship);
    this.moveAreaGraphics.clear();
    this.moveAreaGraphics.lineStyle(2, 0x00ff00, 0.5);
    this.moveAreaGraphics.fillStyle(0x00ff00, 0.1);
    this.moveAreaGraphics.beginPath();
    moveArea.forEach((point, index) => {
      if (index === 0) {
        this.moveAreaGraphics.moveTo(point.x, point.y);
      } else {
        this.moveAreaGraphics.lineTo(point.x, point.y);
      }
    });
    this.moveAreaGraphics.closePath();
    this.moveAreaGraphics.fillPath();
    this.moveAreaGraphics.strokePath();
  }
  
  /**
   * Deselect the currently selected ship
   */
  deselectShip() {
    this.selectedShip = null;
    gameState.update(state => ({
      ...state,
      selectedShipId: null
    }));
    this.moveAreaGraphics.clear();
    this.trajectoryGraphics.clear();
  }
  
  /**
   * Show context menu for a ship
   * @param {Phaser.Input.Pointer} pointer - Pointer object for the click event
   * @param {Object} ship - Ship object to show menu for
   */
  showContextMenu(pointer, ship) {
    // Remove existing menu
    if (this.contextMenu) {
      this.contextMenu.destroy();
    }
    
    // Create context menu
    this.contextMenu = this.add.container(pointer.x, pointer.y);
    
    const background = this.add.rectangle(0, 0, 150, 100, 0x333333);
    background.setOrigin(0, 0);
    
    const title = this.add.text(10, 5, `${ship.name}`, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    
    const fireOption = this.add.text(10, 30, 'Fire Weapons', {
      fontSize: '14px',
      color: '#ffffff'
    });
    fireOption.setInteractive();
    fireOption.on('pointerdown', () => {
      this.fireWeapons(ship);
      this.contextMenu.destroy();
      this.contextMenu = null;
    });
    
    const scanOption = this.add.text(10, 60, 'Scan', {
      fontSize: '14px',
      color: '#ffffff'
    });
    scanOption.setInteractive();
    scanOption.on('pointerdown', () => {
      this.scanShip(ship);
      this.contextMenu.destroy();
      this.contextMenu = null;
    });
    
    this.contextMenu.add([background, title, fireOption, scanOption]);
  }
  
  /**
   * Fire weapons from a ship at the nearest enemy
   * @param {Object} ship - Ship firing weapons
   */
  fireWeapons(ship) {
    console.log(`Firing weapons from ${ship.name}`);
    // Here we'd implement weapon firing logic
    
    // Visual feedback
    const targetShips = get(gameState).ships.filter(s => 
      s.faction !== ship.faction
    );
    
    if (targetShips.length > 0) {
      // Find closest enemy ship
      const target = targetShips[0];
      
      // Show weapon fire effect
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0xff0000);
      graphics.lineBetween(
        ship.position.x, 
        ship.position.y,
        target.position.x,
        target.position.y
      );
      
      // Fade out effect
      this.tweens.add({
        targets: graphics,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          graphics.destroy();
        }
      });
    }
  }
  
  /**
   * Scan a ship to gather information
   * @param {Object} ship - Ship to scan
   */
  scanShip(ship) {
    console.log(`Scanning ${ship.name}`);
    
    // Visual feedback of scan
    const scanCircle = this.add.circle(
      ship.position.x,
      ship.position.y,
      50,
      0x00ffff,
      0.3
    );
    
    // Animated scan effect
    this.tweens.add({
      targets: scanCircle,
      radius: 100,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        scanCircle.destroy();
      }
    });
  }
  
  /**
   * Update method called by Phaser on each frame
   */
  update() {
    // Small continuous updates for animation
    const state = get(gameState);
    
    state.ships.forEach(ship => {
      const container = this.ships.get(ship.id);
      if (container) {
        // Apply small continuous movement for smooth animation
        container.setPosition(ship.position.x, ship.position.y);
        
        // Update thruster based on ship's movement
        const speed = Math.sqrt(ship.velocity.x * ship.velocity.x + ship.velocity.y * ship.velocity.y);
        const thruster = container.list[1];
        if (thruster) {
          thruster.clear();
          if (speed > 0.5 && ship.thrusting) {
            const thrusterSize = Math.min(1.5, Math.max(0.5, speed / 5));
            thruster.lineStyle(2, 0x0088ff);
            thruster.beginPath();
            thruster.moveTo(-5, 0);
            thruster.lineTo(-15 * thrusterSize, 0);
            thruster.strokePath();
          }
        }
      }
    });
  }
}