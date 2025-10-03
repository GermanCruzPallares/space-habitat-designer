import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Download, Copy, RotateCcw, AlertCircle, CheckCircle2, Users, Clock, Maximize2, Minimize2, ZoomIn, ZoomOut, Info } from 'lucide-react';
import * as THREE from 'three';

// Constraints data (NASA mock)
const CONSTRAINTS = {
  crew: {
    sleep: 3,
    exercise: 4,
    hygiene: 2,
    food: 5,
    storage: 6,
    medical: 2
  },
  duration: {
    short: 0.8,
    medium: 1,
    long: 1.2
  }
};

const MODULES = [
  { id: 'sleep', name: 'Sleep', icon: '🛏️', color: '#3b82f6' },
  { id: 'food', name: 'Food', icon: '🍽️', color: '#10b981' },
  { id: 'hygiene', name: 'Hygiene', icon: '🚿', color: '#06b6d4' },
  { id: 'storage', name: 'Storage', icon: '📦', color: '#f59e0b' },
  { id: 'exercise', name: 'Exercise', icon: '🏃', color: '#ef4444' },
  { id: 'medical', name: 'Medical', icon: '⚕️', color: '#8b5cf6' }
];

const HABITAT_TYPES = [
  { id: 'cylinder', name: 'Cylinder', icon: '🏗️', description: 'Classic rotating habitat' },
  { id: 'sphere', name: 'Sphere', icon: '⚪', description: 'Optimal volume/surface ratio' },
  { id: 'inflatable', name: 'Inflatable', icon: '🎈', description: 'Lightweight expandable' }
];

const TEMPLATES = [
  {
    name: 'Minimalist Base',
    config: {
      habitatType: 'cylinder',
      radius: 4,
      height: 8,
      crewSize: 2,
      duration: 'short',
      modules: [
        { id: 'sleep', icon: '🛏️', color: '#3b82f6', volume: 6, uid: 1 },
        { id: 'food', icon: '🍽️', color: '#10b981', volume: 10, uid: 2 },
        { id: 'hygiene', icon: '🚿', color: '#06b6d4', volume: 4, uid: 3 }
      ]
    }
  },
  {
    name: 'Scientific Station',
    config: {
      habitatType: 'sphere',
      radius: 8,
      height: 10,
      crewSize: 6,
      duration: 'long',
      modules: [
        { id: 'sleep', icon: '🛏️', color: '#3b82f6', volume: 20, uid: 1 },
        { id: 'food', icon: '🍽️', color: '#10b981', volume: 30, uid: 2 },
        { id: 'exercise', icon: '🏃', color: '#ef4444', volume: 24, uid: 3 },
        { id: 'medical', icon: '⚕️', color: '#8b5cf6', volume: 12, uid: 4 },
        { id: 'hygiene', icon: '🚿', color: '#06b6d4', volume: 12, uid: 5 },
        { id: 'storage', icon: '📦', color: '#f59e0b', volume: 36, uid: 6 }
      ]
    }
  }
];

export default function SpaceHabitatDesigner() {
  const [habitatType, setHabitatType] = useState('cylinder');
  const [radius, setRadius] = useState(5);
  const [height, setHeight] = useState(10);
  const [crewSize, setCrewSize] = useState(4);
  const [duration, setDuration] = useState('medium');
  const [placedModules, setPlacedModules] = useState([]);
  const [draggedModule, setDraggedModule] = useState(null);
  const [designs, setDesigns] = useState([{ id: 1, name: 'Design 1', config: null }]);
  const [activeDesign, setActiveDesign] = useState(0);
  const [cameraDistance, setCameraDistance] = useState(25);
  const [cameraAngle, setCameraAngle] = useState(0.5);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [hoveredModule, setHoveredModule] = useState(null);

  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });

  // Calculate total volume
  const totalVolume = habitatType === 'sphere' 
    ? (4/3) * Math.PI * Math.pow(radius, 3)
    : habitatType === 'inflatable'
    ? Math.PI * Math.pow(radius, 2) * height * 0.9 // 10% less for irregular shape
    : Math.PI * Math.pow(radius, 2) * height;

  // Calculate used volume
  const usedVolume = placedModules.reduce((sum, m) => sum + m.volume, 0);
  const usagePercent = Math.min((usedVolume / totalVolume * 100), 100).toFixed(1);

  // Validation
  const validationResults = MODULES.map(module => {
    const placed = placedModules.filter(m => m.id === module.id);
    const totalArea = placed.reduce((sum, m) => sum + m.volume, 0);
    const required = CONSTRAINTS.crew[module.id] * crewSize * CONSTRAINTS.duration[duration];
    const isValid = totalArea >= required;
    return {
      ...module,
      placed: totalArea,
      required,
      isValid,
      hasModule: placed.length > 0
    };
  });

  const allValid = validationResults.every(r => r.isValid);
  const missingModules = validationResults.filter(r => !r.hasModule);

  // Three.js Setup with improved controls
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    

    const camera = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true,
      alpha: true
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 20000));

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(10, 10, 10);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x4fc3f7, 0.4);
    directionalLight2.position.set(-10, 5, -10);
    scene.add(directionalLight2);

    const pointLight = new THREE.PointLight(0x00ffff, 0.5, 50);
    pointLight.position.set(0, 15, 0);
    scene.add(pointLight);

    // Grid with style
    const gridHelper = new THREE.GridHelper(40, 40, 0x444444, 0x222222);
    scene.add(gridHelper);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Mouse controls
    const handleMouseDown = (e) => {
      mouseRef.current.isDown = true;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      setAutoRotate(false);
    };

    const handleMouseMove = (e) => {
      if (!mouseRef.current.isDown) return;
      
      const deltaX = e.clientX - mouseRef.current.x;
      const deltaY = e.clientY - mouseRef.current.y;
      
      setCameraAngle(prev => Math.max(0.1, Math.min(Math.PI / 2 - 0.1, prev + deltaY * 0.005)));
      setCameraDistance(prev => prev - deltaX * 0.01);
      
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      setCameraDistance(prev => Math.max(10, Math.min(50, prev + e.deltaY * 0.05)));
    };

    canvasRef.current.addEventListener('mousedown', handleMouseDown);
    canvasRef.current.addEventListener('mousemove', handleMouseMove);
    canvasRef.current.addEventListener('mouseup', handleMouseUp);
    canvasRef.current.addEventListener('wheel', handleWheel, { passive: false });

    let rotationSpeed = 0;
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      if (autoRotate) {
        rotationSpeed += 0.001;
      }

      const angle = autoRotate ? rotationSpeed : cameraDistance;
      camera.position.x = Math.cos(angle) * cameraDistance * Math.sin(cameraAngle);
      camera.position.y = cameraDistance * Math.cos(cameraAngle);
      camera.position.z = Math.sin(angle) * cameraDistance * Math.sin(cameraAngle);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvasRef.current?.removeEventListener('mousedown', handleMouseDown);
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove);
      canvasRef.current?.removeEventListener('mouseup', handleMouseUp);
      canvasRef.current?.removeEventListener('wheel', handleWheel);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
    };
  }, [cameraDistance, cameraAngle, autoRotate]);

  // Update 3D scene with animations
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clear existing meshes except lights and grid
    scene.children = scene.children.filter(child => 
      child instanceof THREE.AmbientLight || 
      child instanceof THREE.DirectionalLight || 
      child instanceof THREE.PointLight ||
      child instanceof THREE.GridHelper
    );

    // Create habitat shell
    let geometry;
    if (habitatType === 'sphere') {
      geometry = new THREE.SphereGeometry(radius, 32, 32);
    } else if (habitatType === 'inflatable') {
      geometry = new THREE.SphereGeometry(radius, 16, 16);
    } else {
      geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    }

    const material = new THREE.MeshPhongMaterial({
      color: habitatType === 'inflatable' ? 0x9333ea : 0x1e40af,
      transparent: true,
      opacity: 0.2,
      wireframe: false,
      side: THREE.DoubleSide,
      emissive: habitatType === 'inflatable' ? 0x6b21a8 : 0x1e3a8a,
      emissiveIntensity: 0.2
    });

    const habitat = new THREE.Mesh(geometry, material);
    scene.add(habitat);

    // Wireframe
    const wireframe = new THREE.WireframeGeometry(geometry);
    const line = new THREE.LineSegments(
      wireframe, 
      new THREE.LineBasicMaterial({ 
        color: habitatType === 'inflatable' ? 0xa855f7 : 0x3b82f6,
        transparent: true,
        opacity: 0.6
      })
    );
    scene.add(line);

    // Add module boxes with better positioning
    placedModules.forEach((module, idx) => {
      const size = Math.cbrt(module.volume) * 0.8;
      const boxGeometry = new THREE.BoxGeometry(size, size, size);
      
      const validation = validationResults.find(v => v.id === module.id);
      const moduleColor = validation?.isValid ? module.color : '#ef4444';
      
      const boxMaterial = new THREE.MeshPhongMaterial({ 
        color: moduleColor,
        emissive: moduleColor,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.9
      });
      
      const box = new THREE.Mesh(boxGeometry, boxMaterial);

      // Better spiral positioning
      const layers = Math.ceil(Math.sqrt(placedModules.length));
      const layer = Math.floor(idx / layers);
      const posInLayer = idx % layers;
      const angleStep = (Math.PI * 2) / layers;
      
      const angle = posInLayer * angleStep;
      const distance = radius * 0.5 * (1 - layer * 0.15);
      const yOffset = habitatType === 'sphere' ? 0 : (layer - layers/2) * (height / layers) * 0.7;
      
      box.position.x = Math.cos(angle) * distance;
      box.position.z = Math.sin(angle) * distance;
      box.position.y = yOffset;
      
      box.rotation.x = Math.random() * 0.2;
      box.rotation.y = angle;
      
      scene.add(box);

      // Edge glow
      const edges = new THREE.EdgesGeometry(boxGeometry);
      const edgeLine = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
      );
      edgeLine.position.copy(box.position);
      edgeLine.rotation.copy(box.rotation);
      scene.add(edgeLine);

      // Label sprite
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 128;
      context.fillStyle = '#ffffff';
      context.font = 'Bold 64px Arial';
      context.textAlign = 'center';
      context.fillText(module.icon, 128, 90);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(box.position);
      sprite.position.y += size * 0.8;
      sprite.scale.set(2.5, 1.25, 1);
      scene.add(sprite);
    });

  }, [habitatType, radius, height, placedModules, validationResults]);

  const handleDragStart = useCallback((module) => {
    setDraggedModule(module);
  }, []);

  const handleDrop = useCallback(() => {
    if (draggedModule) {
      const baseVolume = habitatType === 'sphere' ? 8 : habitatType === 'inflatable' ? 7 : 6;
      setPlacedModules(prev => [...prev, {
        ...draggedModule,
        uid: Date.now(),
        volume: baseVolume
      }]);
      setDraggedModule(null);
    }
  }, [draggedModule, habitatType]);

  const removeModule = useCallback((uid) => {
    setPlacedModules(prev => prev.filter(m => m.uid !== uid));
  }, []);

  const updateModuleVolume = useCallback((uid, delta) => {
    setPlacedModules(prev => prev.map(m => 
      m.uid === uid ? { ...m, volume: Math.max(1, m.volume + delta) } : m
    ));
  }, []);

  const duplicateDesign = useCallback(() => {
    const newDesign = {
      id: designs.length + 1,
      name: `Design ${designs.length + 1}`,
      config: {
        habitatType,
        radius,
        height,
        crewSize,
        duration,
        placedModules
      }
    };
    setDesigns(prev => [...prev, newDesign]);
    setActiveDesign(designs.length);
  }, [designs, habitatType, radius, height, crewSize, duration, placedModules]);

  const loadTemplate = useCallback((template) => {
    const config = template.config;
    setHabitatType(config.habitatType);
    setRadius(config.radius);
    setHeight(config.height);
    setCrewSize(config.crewSize);
    setDuration(config.duration);
    setPlacedModules(config.modules);
    setShowTemplates(false);
  }, []);

  const exportDesign = useCallback(() => {
    const data = {
      habitatType,
      radius,
      height,
      crewSize,
      duration,
      totalVolume: totalVolume.toFixed(2),
      usedVolume: usedVolume.toFixed(2),
      usagePercent,
      modules: placedModules,
      validation: validationResults,
      isValid: allValid,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitat-design-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [habitatType, radius, height, crewSize, duration, totalVolume, usedVolume, usagePercent, placedModules, validationResults, allValid]);

  const captureScreenshot = useCallback(() => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `habitat-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, []);

  const reset = useCallback(() => {
    setPlacedModules([]);
    setRadius(5);
    setHeight(10);
    setCrewSize(4);
    setDuration('medium');
    setAutoRotate(true);
  }, []);

  const autoFillSuggestions = useCallback(() => {
    const suggestions = [];
    validationResults.forEach(result => {
      if (!result.isValid) {
        const needed = Math.ceil(result.required - result.placed);
        if (needed > 0) {
          suggestions.push({
            ...result,
            volume: needed,
            uid: Date.now() + Math.random()
          });
        }
      }
    });
    setPlacedModules(prev => [...prev, ...suggestions]);
  }, [validationResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            🚀 Space Habitat Designer
          </h1>
          <p className="text-slate-300">Design your Mars habitat in real-time with AI-powered validation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Controls */}
          <div className="space-y-4">
            {/* Habitat Type */}
            <div className="bg-slate-800/80 backdrop-blur rounded-lg p-4 border border-slate-700 shadow-xl">
              <h3 className="font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                <span>🏗️</span> Habitat Type
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {HABITAT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setHabitatType(type.id)}
                    className={`p-3 rounded-lg transition-all transform hover:scale-105 ${
                      habitatType === type.id
                        ? 'bg-gradient-to-br from-blue-600 to-cyan-600 ring-2 ring-cyan-400 shadow-lg'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    title={type.description}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-xs">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div className="bg-slate-800/80 backdrop-blur rounded-lg p-4 border border-slate-700 shadow-xl">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="w-full flex items-center justify-between text-cyan-400 font-semibold mb-3"
              >
                <span className="flex items-center gap-2">
                  <span>📋</span> Quick Templates
                </span>
                <span className="text-sm">{showTemplates ? '▼' : '▶'}</span>
              </button>
              
              {showTemplates && (
                <div className="space-y-2">
                  {TEMPLATES.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadTemplate(template)}
                      className="w-full bg-slate-700 hover:bg-slate-600 p-3 rounded-lg text-left transition-all"
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {template.config.modules.length} modules • Crew: {template.config.crewSize}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dimensions */}
            <div className="bg-slate-800/80 backdrop-blur rounded-lg p-4 border border-slate-700 shadow-xl">
              <h3 className="font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                <span>📏</span> Dimensions
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-300 flex justify-between mb-1">
                    <span>Radius: {radius}m</span>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {habitatType !== 'sphere' && (
                  <div>
                    <label className="text-sm text-slate-300 flex justify-between mb-1">
                      <span>Height: {height}m</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-slate-700 text-sm space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Total Volume:</span>
                    <span className="font-semibold text-cyan-400">{totalVolume.toFixed(1)} m³</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Surface Area:</span>
                    <span className="font-semibold text-purple-400">
                      {(habitatType === 'sphere' 
                        ? 4 * Math.PI * Math.pow(radius, 2)
                        : 2 * Math.PI * radius * (radius + height)
                      ).toFixed(1)} m²
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Parameters */}
            <div className="bg-slate-800/80 backdrop-blur rounded-lg p-4 border border-slate-700 shadow-xl">
              <h3 className="font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                <span>👨‍🚀</span> Mission Parameters
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-300 flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4" />
                    Crew Size: {crewSize}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={crewSize}
                    onChange={(e) => setCrewSize(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-300 flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="short">Short (30-90 days)</option>
                    <option value="medium">Medium (6-12 months)</option>
                    <option value="long">Long (1-2+ years)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Available Modules */}
            <div className="bg-slate-800/80 backdrop-blur rounded-lg p-4 border border-slate-700 shadow-xl">
              <h3 className="font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                <span>🧩</span> Available Modules
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {MODULES.map(module => {
                  const validation = validationResults.find(v => v.id === module.id);
                  return (
                    <div
                      key={module.id}
                      draggable
                      onDragStart={() => handleDragStart(module)}
                      onMouseEnter={() => setHoveredModule(module.id)}
                      onMouseLeave={() => setHoveredModule(null)}
                      className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg cursor-move transition-all active:scale-95 transform hover:scale-105"
                      style={{ borderLeft: `4px solid ${module.color}` }}
                    >
                      <div className="text-xl mb-1">{module.icon}</div>
                      <div className="text-xs font-medium">{module.name}</div>
                      {hoveredModule === module.id && validation && (
                        <div className="text-xs text-slate-400 mt-1">
                          Need: {validation.required.toFixed(1)}m³
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {missingModules.length > 0 && (
                <button
                  onClick={autoFillSuggestions}
                  className="w-full mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 p-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <span>✨</span> Auto-fill Missing Modules
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={reset}
                className="bg-slate-700 hover:bg-slate-600 p-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">Reset</span>
              </button>
              <button
                onClick={duplicateDesign}
                className="bg-blue-600 hover:bg-blue-700 p-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Duplicate Design</span>
              </button>
              <button
                onClick={exportDesign}
                className="bg-purple-600 hover:bg-purple-700 p-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Export JSON</span>
              </button>
              <button
                onClick={captureScreenshot}
                className="bg-green-600 hover:bg-green-700 p-2.5 rounded-lg flex items-center justify-center gap-2 transition-all col-span-2"
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm">Capture Screenshot</span>
              </button>
            </div>
          </div>

          {/* Center Panel - 3D Canvas */}
          <div
            className="col-span-1 lg:col-span-2 bg-slate-900 rounded-lg shadow-xl overflow-hidden relative"
            onDrop={(e) => {
              e.preventDefault();
              handleDrop();
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <canvas ref={canvasRef} className="w-full h-[600px] block"></canvas>

            {/* Usage Overlay */}
            <div className="absolute top-2 left-2 bg-slate-800/70 rounded px-3 py-1 text-sm text-white">
              <span>Used Volume: </span>
              <span className="font-semibold text-cyan-400">{usedVolume.toFixed(1)} m³</span>
              <span> / {totalVolume.toFixed(1)} m³ ({usagePercent}%)</span>
            </div>

            {/* Validation Overlay */}
            <div className="absolute bottom-2 left-2 bg-slate-800/70 rounded px-3 py-1 text-sm text-white flex flex-wrap gap-2">
              {validationResults.map(v => (
                <div key={v.id} className={`px-2 py-0.5 rounded text-xs font-medium ${v.isValid ? 'bg-green-700' : 'bg-red-700'}`}>
                  {v.icon} {v.name}: {v.placed.toFixed(1)}/{v.required.toFixed(1)} m³
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}