/**
 * ModelViewer - Interactive 3D Floating Building / Model Viewer
 * Ported from React Bits (JavaScript + CSS variant)
 * Renders 3D GLB/GLTF models or an interactive 3D Floating Architectural Villa using Three.js
 */

class ModelViewer {
  constructor(container, options = {}) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container || container._modelViewerInitialized) return;
    container._modelViewerInitialized = true;

    this.container = container;
    const ds = container.dataset || {};

    this.url = ds.url || options.url || null;
    this.width = ds.width || options.width || '100%';
    this.height = ds.height || options.height || '500px';
    this.autoRotate = ds.autoRotate !== undefined ? ds.autoRotate === 'true' : (options.autoRotate !== undefined ? options.autoRotate : true);
    this.autoRotateSpeed = ds.autoRotateSpeed ? parseFloat(ds.autoRotateSpeed) : (options.autoRotateSpeed || 0.35);
    this.showScreenshotButton = ds.showScreenshotButton !== undefined ? ds.showScreenshotButton === 'true' : (options.showScreenshotButton !== undefined ? options.showScreenshotButton : true);
    this.enableMouseParallax = ds.enableMouseParallax !== undefined ? ds.enableMouseParallax === 'true' : (options.enableMouseParallax !== undefined ? options.enableMouseParallax : true);
    this.enableHoverRotation = ds.enableHoverRotation !== undefined ? ds.enableHoverRotation === 'true' : (options.enableHoverRotation !== undefined ? options.enableHoverRotation : true);

    this.init();
  }

  init() {
    this.container.classList.add('model-viewer-container');
    this.container.style.position = 'relative';
    this.container.style.width = typeof this.width === 'number' ? `${this.width}px` : this.width;
    this.container.style.height = typeof this.height === 'number' ? `${this.height}px` : this.height;

    // Screenshot Button
    if (this.showScreenshotButton) {
      this.btn = document.createElement('button');
      this.btn.className = 'model-viewer-screenshot-btn';
      this.btn.innerHTML = 'Capture Snapshot';
      this.btn.addEventListener('click', () => this.captureScreenshot());
      this.container.appendChild(this.btn);
    }

    // Three.js Scene Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 3, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xBF9A49, 0.7);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xD6B56E, 0.9);
    rimLight.position.set(0, -5, 5);
    this.scene.add(rimLight);

    // Root Group for Floating Building
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    if (this.url && window.THREE.GLTFLoader) {
      const loader = new THREE.GLTFLoader();
      loader.load(this.url, (gltf) => {
        this.modelGroup.add(gltf.scene);
      }, undefined, (err) => {
        console.warn('GLTF load failed, rendering 3D Floating Building model:', err);
        this.createFloatingBuilding();
      });
    } else {
      this.createFloatingBuilding();
    }

    // Controls & Interaction
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotation = { x: 0.2, y: -0.4 };
    this.mouseParallax = { x: 0, y: 0 };
    this.hoverRotation = { x: 0, y: 0 };

    this.bindEvents();
    this.animate();
  }

  createFloatingBuilding() {
    // 3D Floating Luxury Villa / Architectural Building
    const buildingGroup = new THREE.Group();

    // Base Floating Podium / Blueprint Grid Platform
    const platformGeo = new THREE.BoxGeometry(7, 0.4, 7);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x28443E,
      roughness: 0.2,
      metalness: 0.7
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -1.2;
    platform.receiveShadow = true;
    buildingGroup.add(platform);

    // Golden / Brass Edges for Platform
    const edges = new THREE.EdgesGeometry(platformGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xBF9A49, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.y = -1.2;
    buildingGroup.add(wireframe);

    // Building Main Structure (Ground Floor)
    const gfGeo = new THREE.BoxGeometry(4.8, 1.8, 4.2);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xF5F0EB,
      roughness: 0.4,
      metalness: 0.1
    });
    const gf = new THREE.Mesh(gfGeo, wallMat);
    gf.position.set(0, -0.1, 0);
    gf.castShadow = true;
    gf.receiveShadow = true;
    buildingGroup.add(gf);

    // Glass Floor-to-Ceiling Windows
    const windowGeo = new THREE.PlaneGeometry(3.6, 1.3);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x31524B,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.85,
      clearcoat: 1.0
    });
    const frontWindow = new THREE.Mesh(windowGeo, glassMat);
    frontWindow.position.set(0, -0.1, 2.11);
    buildingGroup.add(frontWindow);

    // First Floor (Cantilevered Modern Villa Layer)
    const ffGeo = new THREE.BoxGeometry(5.4, 1.6, 4.6);
    const ffMat = new THREE.MeshStandardMaterial({
      color: 0x3D665D,
      roughness: 0.3,
      metalness: 0.2
    });
    const ff = new THREE.Mesh(ffGeo, ffMat);
    ff.position.set(0.3, 1.6, 0.2);
    ff.castShadow = true;
    ff.receiveShadow = true;
    buildingGroup.add(ff);

    // Brass Accent Columns & Beams
    const columnGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 16);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xBF9A49,
      metalness: 0.9,
      roughness: 0.15
    });

    const col1 = new THREE.Mesh(columnGeo, brassMat);
    col1.position.set(-2.2, 0.6, 2.1);
    col1.castShadow = true;
    buildingGroup.add(col1);

    const col2 = new THREE.Mesh(columnGeo, brassMat);
    col2.position.set(2.2, 0.6, 2.1);
    col2.castShadow = true;
    buildingGroup.add(col2);

    // Balcony Glass Railing
    const railingGeo = new THREE.BoxGeometry(4.8, 0.6, 0.05);
    const railing = new THREE.Mesh(railingGeo, glassMat);
    railing.position.set(0.3, 1.1, 2.45);
    buildingGroup.add(railing);

    // Roof Canopy & Skylight Feature
    const roofGeo = new THREE.BoxGeometry(6.0, 0.2, 5.2);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2A0D06, roughness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0.3, 2.5, 0.2);
    roof.castShadow = true;
    buildingGroup.add(roof);

    // Warm Interior Glow Light
    const interiorLight = new THREE.PointLight(0xFFD79E, 1.8, 8);
    interiorLight.position.set(0, 0.8, 0);
    buildingGroup.add(interiorLight);

    // Architectural Blueprint Lines / Light Rings surrounding building
    const ringGeo = new THREE.RingGeometry(4.2, 4.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xBF9A49, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.18;
    buildingGroup.add(ring);

    this.modelGroup.add(buildingGroup);
    this.buildingGroup = buildingGroup;
  }

  bindEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.targetRotation.y += deltaX * 0.008;
        this.targetRotation.x += deltaY * 0.008;

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      if (this.enableMouseParallax) {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        this.mouseParallax.x = nx * 0.3;
        this.mouseParallax.y = -ny * 0.3;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.position.z += e.deltaY * 0.005;
      this.camera.position.z = Math.max(4, Math.min(18, this.camera.position.z));
    }, { passive: false });

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  captureScreenshot() {
    this.renderer.render(this.scene, this.camera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'iva-floating-building-3d.png';
    link.href = dataURL;
    link.click();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    // Floating Animation (Bobbing up & down smoothly)
    if (this.modelGroup) {
      this.modelGroup.position.y = Math.sin(time * 1.2) * 0.25;
    }

    // Auto Rotation
    if (this.autoRotate && !this.isDragging) {
      this.targetRotation.y += this.autoRotateSpeed * 0.01;
    }

    // Interpolate Rotation & Parallax
    if (this.modelGroup) {
      this.modelGroup.rotation.y += (this.targetRotation.y - this.modelGroup.rotation.y) * 0.08;
      this.modelGroup.rotation.x += (this.targetRotation.x - this.modelGroup.rotation.x) * 0.08;

      this.camera.position.x += (this.mouseParallax.x - this.camera.position.x) * 0.05;
      this.camera.position.y += (3 + this.mouseParallax.y - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

if (typeof window !== 'undefined') {
  window.ModelViewer = ModelViewer;
}
