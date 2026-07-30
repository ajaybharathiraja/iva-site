/**
 * SideRays - WebGL2 Volumetric Side Light Rays Background Component
 * Ported from React Bits (JavaScript + CSS + WebGL shader variant)
 * Tailored with IVA Infrastructure luxury gold brand colors: #BC9705 & #D9B93C
 */
class SideRays {
  constructor(container, options = {}) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) return;

    this.container = container;
    const ds = container.dataset || {};

    this.speed = ds.speed ? parseFloat(ds.speed) : (options.speed !== undefined ? options.speed : 2.5);
    this.rayColor1 = ds.rayColor1 || options.rayColor1 || '#58271E';
    this.rayColor2 = ds.rayColor2 || options.rayColor2 || '#D4B37D';
    this.intensity = ds.intensity ? parseFloat(ds.intensity) : (options.intensity !== undefined ? options.intensity : 2.0);
    this.spread = ds.spread ? parseFloat(ds.spread) : (options.spread !== undefined ? options.spread : 2.0);
    this.origin = ds.origin || options.origin || 'top-right';
    this.tilt = ds.tilt ? parseFloat(ds.tilt) : (options.tilt !== undefined ? options.tilt : 0);
    this.saturation = ds.saturation ? parseFloat(ds.saturation) : (options.saturation !== undefined ? options.saturation : 1.5);
    this.blend = ds.blend ? parseFloat(ds.blend) : (options.blend !== undefined ? options.blend : 0.75);
    this.falloff = ds.falloff ? parseFloat(ds.falloff) : (options.falloff !== undefined ? options.falloff : 1.6);
    this.opacity = ds.opacity ? parseFloat(ds.opacity) : (options.opacity !== undefined ? options.opacity : 1.0);

    this.init();
  }

  static hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
  }

  static originToFlip(origin) {
    switch (origin) {
      case 'top-left': return [1, 0];
      case 'bottom-right': return [0, 1];
      case 'bottom-left': return [1, 1];
      default: return [0, 0];
    }
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';

    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.canvas);

    const gl = this.canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true }) ||
               this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) {
      console.warn('WebGL not supported for SideRays background');
      return;
    }
    this.gl = gl;

    const vertSrc = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragSrc = `
      precision highp float;

      uniform float iTime;
      uniform vec2 iResolution;
      uniform float iSpeed;
      uniform vec3 iRayColor1;
      uniform vec3 iRayColor2;
      uniform float iIntensity;
      uniform float iSpread;
      uniform float iFlipX;
      uniform float iFlipY;
      uniform float iTilt;
      uniform float iSaturation;
      uniform float iBlend;
      uniform float iFalloff;
      uniform float iOpacity;

      float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
        vec2 sourceToCoord = coord - raySource;
        float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
        return clamp(
          (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
          (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
          0.0, 1.0) *
          clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
        if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

        vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
        vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

        float tiltRad = iTilt * 3.14159265 / 180.0;
        float cs = cos(tiltRad);
        float sn = sin(tiltRad);
        vec2 rel = coord - rayPos;
        vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

        float halfSpread = iSpread * 0.275;
        vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
        vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

        vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
        vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

        vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

        float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
        float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
        color.rgb *= brightness;

        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        color.rgb = mix(vec3(gray), color.rgb, iSaturation);

        color.a = max(color.r, max(color.g, color.b)) * iOpacity;
        gl_FragColor = color;
      }
    `;

    const createShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, vertSrc);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fragSrc);

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    this.program = program;

    // Fullscreen Triangle buffer
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Get Uniform Locations
    this.locs = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iSpeed: gl.getUniformLocation(program, 'iSpeed'),
      iRayColor1: gl.getUniformLocation(program, 'iRayColor1'),
      iRayColor2: gl.getUniformLocation(program, 'iRayColor2'),
      iIntensity: gl.getUniformLocation(program, 'iIntensity'),
      iSpread: gl.getUniformLocation(program, 'iSpread'),
      iFlipX: gl.getUniformLocation(program, 'iFlipX'),
      iFlipY: gl.getUniformLocation(program, 'iFlipY'),
      iTilt: gl.getUniformLocation(program, 'iTilt'),
      iSaturation: gl.getUniformLocation(program, 'iSaturation'),
      iBlend: gl.getUniformLocation(program, 'iBlend'),
      iFalloff: gl.getUniformLocation(program, 'iFalloff'),
      iOpacity: gl.getUniformLocation(program, 'iOpacity')
    };

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();

    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  resize() {
    if (!this.container || !this.gl) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = this.container.clientWidth || this.container.offsetWidth;
    const h = this.container.clientHeight || this.container.offsetHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  animate(t) {
    this.animId = requestAnimationFrame(this.animate);
    if (!this.gl || !this.program) return;

    const gl = this.gl;
    gl.useProgram(this.program);

    const [flipX, flipY] = SideRays.originToFlip(this.origin);

    gl.uniform1f(this.locs.iTime, t * 0.001);
    gl.uniform2f(this.locs.iResolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.locs.iSpeed, this.speed);
    gl.uniform3fv(this.locs.iRayColor1, SideRays.hexToRgb(this.rayColor1));
    gl.uniform3fv(this.locs.iRayColor2, SideRays.hexToRgb(this.rayColor2));
    gl.uniform1f(this.locs.iIntensity, this.intensity);
    gl.uniform1f(this.locs.iSpread, this.spread);
    gl.uniform1f(this.locs.iFlipX, flipX);
    gl.uniform1f(this.locs.iFlipY, flipY);
    gl.uniform1f(this.locs.iTilt, this.tilt);
    gl.uniform1f(this.locs.iSaturation, this.saturation);
    gl.uniform1f(this.locs.iBlend, this.blend);
    gl.uniform1f(this.locs.iFalloff, this.falloff);
    gl.uniform1f(this.locs.iOpacity, this.opacity);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

if (typeof window !== 'undefined') {
  window.SideRays = SideRays;
}
