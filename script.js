// Variables globales - ahora están disponibles a través de las importaciones
let scene, camera, renderer, controls;
let draggableObjects = [];

// Inicializar la escena Three.js
function init() {
    // Crear escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);

    // Crear cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Crear renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('container').appendChild(renderer.domElement);

    // Agregar luces
    addLights();

    // Cargar modelos GLB
    loadModels();

    // Configurar eventos
    window.addEventListener('resize', onWindowResize);
}

// Agregar luces a la escena
function addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
}

// Cargar modelos GLB
async function loadModels() {
    // Usar GLTFLoader directamente (sin THREE.GLTFLoader)
    const loader = new GLTFLoader(); // ← Cambio importante aquí
    
    const modelUrls = [
        './models/ModeloDePrueba.glb'
        // Agregar más modelos según necesites
    ];

    try {
        const loadPromises = modelUrls.map(url => 
            loader.loadAsync(url).catch(error => {
                console.error(`Error cargando ${url}:`, error);
                return null;
            })
        );

        const models = await Promise.all(loadPromises);
        
        models.forEach((gltf, index) => {
            if (gltf) {
                setupModel(gltf.scene, index);
            }
        });

        initDragControls();
        document.getElementById('loading').style.display = 'none';
        
    } catch (error) {
        console.error('Error cargando modelos:', error);
        document.getElementById('loading').textContent = 'Error cargando modelos';
    }
}

// Configurar cada modelo en la escena
function setupModel(model, index) {
    model.position.set((index - 1) * 3, 0, 0);
    
    model.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(model);
    draggableObjects.push(model);
}

// Inicializar controles de arrastre
function initDragControls() {
    // Usar DragControls directamente (sin THREE.DragControls)
    controls = new DragControls(draggableObjects, camera, renderer.domElement); // ← Cambio importante aquí
    
    controls.addEventListener('dragstart', function(event) {
        event.object.traverse(child => {
            if (child.isMesh) {
                child.material.emissive = new THREE.Color(0x444444);
            }
        });
    });

    controls.addEventListener('dragend', function(event) {
        event.object.traverse(child => {
            if (child.isMesh) {
                child.material.emissive = new THREE.Color(0x000000);
            }
        });
    });
}

// Ajustar tamaño cuando cambia la ventana
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Bucle de animación
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Iniciar todo cuando se cargue la página
window.addEventListener('load', () => {
    init();
    animate();
});