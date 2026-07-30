/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/no-unknown-property */
import { Suspense, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader, useThree, invalidate } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX, useProgress, Html, Environment, ContactShadows } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';
import './ModelViewer.css';

const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
const deg2rad = d => (d * Math.PI) / 180;
const DECIDE = 8;
const ROTATE_SPEED = 0.005;
const INERTIA = 0.925;
const PARALLAX_MAG = 0.05;
const PARALLAX_EASE = 0.12;
const HOVER_MAG = deg2rad(6);
const HOVER_EASE = 0.15;

const Loader = ({ placeholderSrc }) => {
  const { progress, active } = useProgress();
  if (!active && placeholderSrc) return null;
  return (
    <Html center>
      {placeholderSrc ? (
        <img src={placeholderSrc} width={128} height={128} style={{ filter: 'blur(8px)', borderRadius: 8 }} alt="Loading model" />
      ) : (
        <div className="model-viewer-loader">{Math.round(progress)} %</div>
      )}
    </Html>
  );
};

const DesktopControls = ({ pivot, min, max, zoomEnabled }) => {
  const ref = useRef(null);
  useFrame(() => ref.current?.target.copy(pivot));
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      enableRotate={false}
      enableZoom={zoomEnabled}
      minDistance={min}
      maxDistance={max}
    />
  );
};

// 3D Floating Luxury Villa / Architectural Building Component
const FloatingBuilding = ({ autoRotate, autoRotateSpeed }) => {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.25;
      if (autoRotate) {
        groupRef.current.rotation.y += autoRotateSpeed * delta;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Base Podium Platform */}
      <mesh position={[0, -1.2, 0]} receiveShadow>
        <boxGeometry args={[7, 0.4, 7]} />
        <meshStandardMaterial color="#1A2026" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Ground Floor */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.8, 1.8, 4.2]} />
        <meshStandardMaterial color="#F5F0EB" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Glass Windows */}
      <mesh position={[0, -0.1, 2.11]}>
        <planeGeometry args={[3.6, 1.3]} />
        <meshPhysicalMaterial color="#1A3644" transparent opacity={0.7} roughness={0.1} metalness={0.9} clearcoat={1.0} />
      </mesh>

      {/* First Floor Cantilever */}
      <mesh position={[0.3, 1.6, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[5.4, 1.6, 4.6]} />
        <meshStandardMaterial color="#232931" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Brass Accent Columns */}
      <mesh position={[-2.2, 0.6, 2.1]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 3.2, 16]} />
        <meshStandardMaterial color="#BC9705" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[2.2, 0.6, 2.1]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 3.2, 16]} />
        <meshStandardMaterial color="#BC9705" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Glass Balcony Railing */}
      <mesh position={[0.3, 1.1, 2.45]}>
        <boxGeometry args={[4.8, 0.6, 0.05]} />
        <meshPhysicalMaterial color="#1A3644" transparent opacity={0.6} roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Roof Canopy */}
      <mesh position={[0.3, 2.5, 0.2]} castShadow>
        <boxGeometry args={[6.0, 0.2, 5.2]} />
        <meshStandardMaterial color="#14181C" roughness={0.5} />
      </mesh>

      {/* Interior Warm Illumination */}
      <pointLight position={[0, 0.8, 0]} color="#FFD79E" intensity={1.8} distance={8} />
    </group>
  );
};

const ModelInner = ({
  url,
  xOff,
  yOff,
  pivot,
  initYaw,
  initPitch,
  minZoom,
  maxZoom,
  enableMouseParallax,
  enableManualRotation,
  enableHoverRotation,
  enableManualZoom,
  autoFrame,
  fadeIn,
  autoRotate,
  autoRotateSpeed,
  onLoaded
}) => {
  const outer = useRef(null);
  const inner = useRef(null);
  const { camera, gl } = useThree();

  const vel = useRef({ x: 0, y: 0 });
  const tPar = useRef({ x: 0, y: 0 });
  const cPar = useRef({ x: 0, y: 0 });
  const tHov = useRef({ x: 0, y: 0 });
  const cHov = useRef({ x: 0, y: 0 });

  const ext = useMemo(() => (url ? url.split('.').pop().toLowerCase() : ''), [url]);
  const content = useMemo(() => {
    if (!url || url === 'floating-building') return null;
    if (ext === 'glb' || ext === 'gltf') return useGLTF(url).scene.clone();
    if (ext === 'fbx') return useFBX(url).clone();
    if (ext === 'obj') return useLoader(OBJLoader, url).clone();
    console.error('Unsupported format:', ext);
    return null;
  }, [url, ext]);

  const pivotW = useRef(new THREE.Vector3());
  useLayoutEffect(() => {
    if (!content && url !== 'floating-building') return;
    const g = inner.current;
    if (g) {
      g.updateWorldMatrix(true, true);
      const sphere = new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere());
      const s = 1 / (sphere.radius * 2 || 1);
      g.position.set(-sphere.center.x, -sphere.center.y, -sphere.center.z);
      g.scale.setScalar(s);

      g.traverse(o => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });

      g.getWorldPosition(pivotW.current);
      pivot.copy(pivotW.current);
    }
    if (outer.current) {
      outer.current.rotation.set(initPitch, initYaw, 0);
    }

    onLoaded?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, url]);

  useEffect(() => {
    if (!enableManualRotation || isTouch) return;
    const el = gl.domElement;
    let drag = false;
    let lx = 0,
      ly = 0;
    const down = e => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      drag = true;
      lx = e.clientX;
      ly = e.clientY;
      window.addEventListener('pointerup', up);
    };
    const move = e => {
      if (!drag) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      if (outer.current) {
        outer.current.rotation.y += dx * ROTATE_SPEED;
        outer.current.rotation.x += dy * ROTATE_SPEED;
      }
      vel.current = { x: dx * ROTATE_SPEED, y: dy * ROTATE_SPEED };
      invalidate();
    };
    const up = () => (drag = false);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [gl, enableManualRotation]);

  useFrame((_, dt) => {
    let need = false;
    cPar.current.x += (tPar.current.x - cPar.current.x) * PARALLAX_EASE;
    cPar.current.y += (tPar.current.y - cPar.current.y) * PARALLAX_EASE;

    if (outer.current) {
      if (autoRotate && content) {
        outer.current.rotation.y += autoRotateSpeed * dt;
        need = true;
      }
      outer.current.rotation.y += vel.current.x;
      outer.current.rotation.x += vel.current.y;
    }

    vel.current.x *= INERTIA;
    vel.current.y *= INERTIA;
    if (Math.abs(vel.current.x) > 1e-4 || Math.abs(vel.current.y) > 1e-4) need = true;
    if (need) invalidate();
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        {content ? (
          <primitive object={content} />
        ) : (
          <FloatingBuilding autoRotate={autoRotate} autoRotateSpeed={autoRotateSpeed} />
        )}
      </group>
    </group>
  );
};

const ModelViewer = ({
  url = 'floating-building',
  width = '100%',
  height = 450,
  modelXOffset = 0,
  modelYOffset = 0,
  defaultRotationX = -20,
  defaultRotationY = 15,
  defaultZoom = 0.5,
  minZoomDistance = 0.5,
  maxZoomDistance = 10,
  enableMouseParallax = true,
  enableManualRotation = true,
  enableHoverRotation = true,
  enableManualZoom = true,
  ambientIntensity = 0.4,
  keyLightIntensity = 1.2,
  fillLightIntensity = 0.6,
  rimLightIntensity = 0.8,
  environmentPreset = 'city',
  autoFrame = false,
  placeholderSrc,
  showScreenshotButton = true,
  fadeIn = false,
  autoRotate = true,
  autoRotateSpeed = 0.35,
  onModelLoaded
}) => {
  useEffect(() => {
    if (url && url !== 'floating-building') {
      try {
        useGLTF.preload(url);
      } catch (e) {
        console.warn(e);
      }
    }
  }, [url]);

  const pivot = useRef(new THREE.Vector3()).current;
  const contactRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);

  const initYaw = deg2rad(defaultRotationX);
  const initPitch = deg2rad(defaultRotationY);
  const camZ = Math.min(Math.max(defaultZoom, minZoomDistance), maxZoomDistance);

  const capture = () => {
    const g = rendererRef.current,
      s = sceneRef.current,
      c = cameraRef.current;
    if (!g || !s || !c) return;
    g.shadowMap.enabled = false;
    const tmp = [];
    s.traverse(o => {
      if (o.isLight && 'castShadow' in o) {
        tmp.push({ l: o, cast: o.castShadow });
        o.castShadow = false;
      }
    });
    if (contactRef.current) contactRef.current.visible = false;
    g.render(s, c);
    const urlPNG = g.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = 'iva-floating-building-3d.png';
    a.href = urlPNG;
    a.click();
    g.shadowMap.enabled = true;
    tmp.forEach(({ l, cast }) => (l.castShadow = cast));
    if (contactRef.current) contactRef.current.visible = true;
    invalidate();
  };

  return (
    <div
      className="model-viewer-container"
      style={{
        width,
        height,
        touchAction: 'pan-y pinch-zoom',
        position: 'relative'
      }}
    >
      {showScreenshotButton && (
        <button
          onClick={capture}
          className="model-viewer-screenshot-btn"
        >
          📷 Take Screenshot
        </button>
      )}

      <Canvas
        shadows
        frameloop="demand"
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl, scene, camera }) => {
          rendererRef.current = gl;
          sceneRef.current = scene;
          cameraRef.current = camera;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        camera={{ fov: 45, position: [0, 2, 9], near: 0.1, far: 100 }}
        style={{ touchAction: 'pan-y pinch-zoom' }}
      >
        {environmentPreset !== 'none' && <Environment preset={environmentPreset} background={false} />}

        <ambientLight intensity={ambientIntensity} />
        <directionalLight position={[5, 10, 7]} intensity={keyLightIntensity} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={fillLightIntensity} />
        <directionalLight position={[0, 4, -5]} intensity={rimLightIntensity} />

        <ContactShadows ref={contactRef} position={[0, -1.2, 0]} opacity={0.4} scale={12} blur={2} />

        <Suspense fallback={<Loader placeholderSrc={placeholderSrc} />}>
          <ModelInner
            url={url}
            xOff={modelXOffset}
            yOff={modelYOffset}
            pivot={pivot}
            initYaw={initYaw}
            initPitch={initPitch}
            minZoom={minZoomDistance}
            maxZoom={maxZoomDistance}
            enableMouseParallax={enableMouseParallax}
            enableManualRotation={enableManualRotation}
            enableHoverRotation={enableHoverRotation}
            enableManualZoom={enableManualZoom}
            autoFrame={autoFrame}
            fadeIn={fadeIn}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            onLoaded={onModelLoaded}
          />
        </Suspense>

        {!isTouch && (
          <DesktopControls pivot={pivot} min={minZoomDistance} max={maxZoomDistance} zoomEnabled={enableManualZoom} />
        )}
      </Canvas>
    </div>
  );
};

export default ModelViewer;
