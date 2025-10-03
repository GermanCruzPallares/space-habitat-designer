# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

1️⃣ data/constraints.js
export const CONSTRAINTS = {
  crew: { sleep: 3, exercise: 4, hygiene: 2, food: 5, storage: 6, medical: 2 },
  duration: { short: 0.8, medium: 1, long: 1.2 }
};

2️⃣ data/modules.js
export const MODULES = [
  { id: 'sleep', name: 'Sleep', icon: '🛏️', color: '#3b82f6' },
  { id: 'food', name: 'Food', icon: '🍽️', color: '#10b981' },
  { id: 'hygiene', name: 'Hygiene', icon: '🚿', color: '#06b6d4' },
  { id: 'storage', name: 'Storage', icon: '📦', color: '#f59e0b' },
  { id: 'exercise', name: 'Exercise', icon: '🏃', color: '#ef4444' },
  { id: 'medical', name: 'Medical', icon: '⚕️', color: '#8b5cf6' }
];

3️⃣ data/habitatTypes.js
export const HABITAT_TYPES = [
  { id: 'cylinder', name: 'Cylinder', icon: '🏗️' },
  { id: 'sphere', name: 'Sphere', icon: '⚪' },
  { id: 'inflatable', name: 'Inflatable', icon: '🎈' }
];

4️⃣ utils/volumeCalculations.js
export const calculateTotalVolume = (habitatType, radius, height) => {
  return habitatType === 'sphere'
    ? (4 / 3) * Math.PI * Math.pow(radius, 3)
    : Math.PI * Math.pow(radius, 2) * height;
};

export const calculateUsedVolume = (placedModules) => {
  return placedModules.reduce((sum, m) => sum + m.volume, 0);
};

5️⃣ components/HabitatControls.jsx
import React from 'react';
import { HABITAT_TYPES } from '../data/habitatTypes';

export default function HabitatControls({ habitatType, setHabitatType, radius, setRadius, height, setHeight }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="font-semibold mb-3 text-cyan-400">Habitat Type</h3>
        <div className="grid grid-cols-3 gap-2">
          {HABITAT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setHabitatType(type.id)}
              className={`p-3 rounded-lg transition-all ${habitatType === type.id ? 'bg-blue-600 ring-2 ring-cyan-400' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="text-xs">{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="font-semibold mb-3 text-cyan-400">Dimensions</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-300 flex justify-between">
              <span>Radius: {radius}m</span>
            </label>
            <input
              type="range"
              min="3"
              max="15"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full mt-1"
            />
          </div>
          {habitatType !== 'sphere' && (
            <div>
              <label className="text-sm text-slate-300 flex justify-between">
                <span>Height: {height}m</span>
              </label>
              <input
                type="range"
                min="5"
                max="20"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

6️⃣ components/ModulePanel.jsx
import React from 'react';
import { MODULES } from '../data/modules';

export default function ModulePanel({ handleDragStart }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="font-semibold mb-3 text-cyan-400">Available Modules</h3>
      <div className="grid grid-cols-2 gap-2">
        {MODULES.map(module => (
          <div
            key={module.id}
            draggable
            onDragStart={() => handleDragStart(module)}
            className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg cursor-move transition-all active:scale-95"
            style={{ borderLeft: `4px solid ${module.color}` }}
          >
            <div className="text-xl mb-1">{module.icon}</div>
            <div className="text-xs font-medium">{module.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

7️⃣ components/Metrics.jsx
import React from 'react';

export default function Metrics({ usagePercent, validationResults, allValid }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="font-semibold mb-3 text-cyan-400">Validation Status</h3>
      <div className="mb-3 bg-slate-700 rounded-full h-6 overflow-hidden">
        <div className={`h-full transition-all ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
      </div>
      {/* Validación de módulos */}
      <div className="space-y-2">
        {validationResults.map(result => (
          <div key={result.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span>{result.icon} {result.name}</span>
            </div>
            <span className={result.isValid ? 'text-green-400' : 'text-red-400'}>
              {result.placed.toFixed(1)} / {result.required.toFixed(1)} m³
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

8️⃣ components/ThreeScene.jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function ThreeScene({ habitatType, radius, height, placedModules }) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden h-96">
      <Canvas camera={{ position: [20, 15, 20], fov: 75 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} />
        <OrbitControls />
        {/* Aquí luego puedes añadir el mesh del hábitat y los módulos */}
      </Canvas>
    </div>
  );
}

9️⃣ App.jsx
import React, { useState } from 'react';
import HabitatControls from './components/HabitatControls';
import ModulePanel from './components/ModulePanel';
import Metrics from './components/Metrics';
import ThreeScene from './components/ThreeScene';
import { calculateTotalVolume, calculateUsedVolume } from './utils/volumeCalculations';

function App() {
  const [habitatType, setHabitatType] = useState('cylinder');
  const [radius, setRadius] = useState(5);
  const [height, setHeight] = useState(10);
  const [placedModules, setPlacedModules] = useState([]);

  const totalVolume = calculateTotalVolume(habitatType, radius, height);
  const usedVolume = calculateUsedVolume(placedModules);
  const usagePercent = (usedVolume / totalVolume * 100).toFixed(1);

  const handleDragStart = (module) => { console.log("dragging", module.name); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HabitatControls
          habitatType={habitatType}
          setHabitatType={setHabitatType}
          radius={radius}
          setRadius={setRadius}
          height={height}
          setHeight={setHeight}
        />
        <ModulePanel handleDragStart={handleDragStart} />
        <Metrics usagePercent={usagePercent} validationResults={[]} allValid={true} />
      </div>
      <ThreeScene habitatType={habitatType} radius={radius} height={height} placedModules={placedModules} />
    </div>
  );
}

export default App;

🔟 index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);