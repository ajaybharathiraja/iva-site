/**
 * Beams - 3D Shader Undulating Beam Planes Component
 * Powered by Three.js & Custom Noise Shaders
 * Ported from React Bits (JavaScript + CSS + Three.js variant)
 * Tailored with IVA Infrastructure warm luxury lighting (#BC9705 / #D9B93C)
 */

class Beams {
  constructor(container, options = {}) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) return;

    this.container = container;
    const ds = container.dataset || {};

    this.beamWidth = ds.beamWidth ? parseFloat(ds.beamWidth) : (options.beamWidth || 2);
    this.beamHeight = ds.beamHeight ? parseFloat(ds.beamHeight) : (options.beamHeight || 15);
    this.beamNumber = ds.beamNumber ? parseInt(ds.beamNumber, 10) : (options.beamNumber || 12);
    this.lightColor = ds.lightColor || options.lightColor || '#D4B37D';
    this.speed = ds.speed ? parseFloat(ds.speed) : (options.speed || 2);
    this.noiseIntensity = ds.noiseIntensity ? parseFloat(ds.noiseIntensity) : (options.noiseIntensity || 1.75);
    this.scale = ds.scale ? parseFloat(ds.scale) : (options.scale || 0.2);
    this.rotation = ds.rotation ? parseFloat(ds.rotation) : (options.rotation || 0);

    this.init();
  }

  static createStackedPlanesBufferGeometry(n, width, height, spacing = 0, heightSegments = 100) {
    const geometry = new THREE.BufferGeometry();
    const numVertices = n * (heightSegments + 1) * 2;
    const numFaces = n * heightSegments * 2;
    const positions = new Float32Array(numVertices * 3);
    const indices = new Uint32Array(numFaces * 3);
    const uvs = new Float32Array(numVertices * 2);

    let vertexOffset = 0;
    let indexOffset = 0;
    let uvOffset = 0;
    const totalWidth = n * width + (n - 1) * spacing;
    const xOffsetBase = -totalWidth / 2;

    for (let i = 0; i < n; i++) {
      const xOffset = xOffsetBase + i * (width + spacing);
      const uvXOffset = Math.random() * 300;
      const uvYOffset = Math.random() * 300;

      for (let j = 0; j <= heightSegments; j++) {
        const y = height * (j / heightSegments - 0.5);
        const v0 = [xOffset, y, 0];
        const v1 = [xOffset + width, y, 0];
        positions.set([...v0, ...v1], vertexOffset * 3);

        const uvY = j / heightSegments;
        uvs.set([uvXOffset, uvY + uvYOffset, uvXOffset + 1, uvY + uvYOffset], uvOffset);

        if (j < heightSegments) {
          const a = vertexOffset,
            b = vertexOffset + 1,
            c = vertexOffset + 2,
            d = vertexOffset + 3;
          indices.set([a, b, c, c, b, d], indexOffset);
          indexOffset += 6;
        }
        vertexOffset += 2;
        uvOffset += 4;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    return geometry;
  }

  init() {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js library is required for Beams component');
      return;
    }

    const width = this.container.offsetWidth || window.innerWidth;
    const height = this.container.offsetHeight || window.innerHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 20);

    // Noise Shader Code
    const noiseCode = `
      float random (in vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      float noise (in vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
      vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
      float cnoise(vec3 P){
        vec3 Pi0 = floor(P);
        vec3 Pi1 = Pi0 + vec3(1.0);
        Pi0 = mod(Pi0, 289.0);
        Pi1 = mod(Pi1, 289.0);
        vec3 Pf0 = fract(P);
        vec3 Pf1 = Pf0 - vec3(1.0);
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;
        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);
        vec4 gx0 = ixy0 / 7.0;
        vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);
        vec4 gx1 = ixy1 / 7.0;
        vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);
        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
        vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
        g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
        g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x,Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x,Pf1.y,Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy,Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy,Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x,Pf0.y,Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x,Pf1.yz));
        float n111 = dot(g111, Pf1);
        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
        vec2 n_yz = mix(n_z.xy,n_z.zw,fade_xyz.y);
        float n_xyz = mix(n_yz.x,n_yz.y,fade_xyz.x);
        return 2.2 * n_xyz;
      }
    `;

    // Material setup with custom vertex/fragment shaders
    this.material = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.3,
      metalness: 0.3
    });

    const speed = this.speed;
    const noiseIntensity = this.noiseIntensity;
    const scale = this.scale;

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      shader.uniforms.uSpeed = { value: speed };
      shader.uniforms.uNoiseIntensity = { value: noiseIntensity };
      shader.uniforms.uScale = { value: scale };

      shader.vertexShader = `
        uniform float time;
        uniform float uSpeed;
        uniform float uScale;
        ${noiseCode}

        float getPos(vec3 pos) {
          vec3 noisePos = vec3(pos.x * 0., pos.y - uv.y, pos.z + time * uSpeed * 3.) * uScale;
          return cnoise(noisePos);
        }
        vec3 getCurrentPos(vec3 pos) {
          vec3 newpos = pos;
          newpos.z += getPos(pos);
          return newpos;
        }
        vec3 getNormal(vec3 pos) {
          vec3 curpos = getCurrentPos(pos);
          vec3 nextposX = getCurrentPos(pos + vec3(0.01, 0.0, 0.0));
          vec3 nextposZ = getCurrentPos(pos + vec3(0.0, -0.01, 0.0));
          vec3 tangentX = normalize(nextposX - curpos);
          vec3 tangentZ = normalize(nextposZ - curpos);
          return normalize(cross(tangentZ, tangentX));
        }
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\ntransformed.z += getPos(transformed.xyz);'
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\nobjectNormal = getNormal(position.xyz);'
      );

      shader.fragmentShader = `
        uniform float uNoiseIntensity;
        ${noiseCode}
        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\nfloat randomNoise = noise(gl_FragCoord.xy);\ngl_FragColor.rgb -= randomNoise / 15. * uNoiseIntensity;'
      );

      this.material.userData.shader = shader;
    };

    // Geometry & Mesh
    this.geometry = Beams.createStackedPlanesBufferGeometry(this.beamNumber, this.beamWidth, this.beamHeight, 0, 100);
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.group = new THREE.Group();
    this.group.rotation.z = (this.rotation * Math.PI) / 180;
    this.group.add(this.mesh);
    this.scene.add(this.group);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(this.lightColor, 1);
    dirLight.position.set(0, 3, 10);
    this.scene.add(dirLight);

    // Event listeners & loop
    this.clock = new THREE.Clock();
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);

    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    this.animId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    if (this.material.userData.shader && this.material.userData.shader.uniforms.time) {
      this.material.userData.shader.uniforms.time.value += 0.1 * delta;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

if (typeof window !== 'undefined') {
  window.Beams = Beams;
}
