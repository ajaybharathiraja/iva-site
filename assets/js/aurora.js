/**
 * Aurora - WebGL2 Animated Aurora Gradient Background Component
 * Ported from React Bits (JavaScript + CSS + WebGL shader variant)
 * Tailored with IVA Infrastructure luxury brand colors: #BC9705, #D9B93C, #EFE9DD
 */
class Aurora {
  constructor(container, options = {}) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) return;

    this.container = container;
    this.colorStops = options.colorStops || ['#58271E', '#D4B37D', '#EAD8BD'];
    this.amplitude = options.amplitude !== undefined ? options.amplitude : 1.0;
    this.blend = options.blend !== undefined ? options.blend : 0.5;
    this.speed = options.speed !== undefined ? options.speed : 0.5;

    // Read dataset overrides if present
    const ds = container.dataset || {};
    if (ds.colorStops) {
      try { this.colorStops = JSON.parse(ds.colorStops); } catch (e) {}
    }
    if (ds.amplitude) this.amplitude = parseFloat(ds.amplitude);
    if (ds.blend) this.blend = parseFloat(ds.blend);
    if (ds.speed) this.speed = parseFloat(ds.speed);

    this.init();
  }

  static hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16);
    return [(num >> 16 & 255) / 255, (num >> 8 & 255) / 255, (num & 255) / 255];
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);

    const gl = this.canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) {
      console.warn('WebGL2 not supported for Aurora background');
      return;
    }
    this.gl = gl;

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const vertSrc = `#version 300 es
    in vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
    `;

    const fragSrc = `#version 300 es
    precision highp float;

    uniform float uTime;
    uniform float uAmplitude;
    uniform vec3 uColorStops[3];
    uniform vec2 uResolution;
    uniform float uBlend;

    out vec4 fragColor;

    vec3 permute(vec3 x) {
      return mod(((x * 34.0) + 1.0) * x, 289.0);
    }

    float snoise(vec2 v){
      const vec4 C = vec4(
          0.211324865405187, 0.366025403784439,
          -0.577350269189626, 0.024390243902439
      );
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);

      vec3 p = permute(
          permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0)
      );

      vec3 m = max(
          0.5 - vec3(
              dot(x0, x0),
              dot(x12.xy, x12.xy),
              dot(x12.zw, x12.zw)
          ), 
          0.0
      );
      m = m * m;
      m = m * m;

      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    struct ColorStop {
      vec3 color;
      float position;
    };

    #define COLOR_RAMP(colors, factor, finalColor) {              \
      int index = 0;                                            \
      for (int i = 0; i < 2; i++) {                               \
         ColorStop currentColor = colors[i];                    \
         bool isInBetween = currentColor.position <= factor;    \
         index = int(mix(float(index), float(i), float(isInBetween))); \
      }                                                         \
      ColorStop currentColor = colors[index];                   \
      ColorStop nextColor = colors[index + 1];                  \
      float range = nextColor.position - currentColor.position; \
      float lerpFactor = (factor - currentColor.position) / range; \
      finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      
      ColorStop colors[3];
      colors[0] = ColorStop(uColorStops[0], 0.0);
      colors[1] = ColorStop(uColorStops[1], 0.5);
      colors[2] = ColorStop(uColorStops[2], 1.0);
      
      vec3 rampColor;
      COLOR_RAMP(colors, uv.x, rampColor);
      
      float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
      height = exp(height);
      height = (uv.y * 2.0 - height + 0.2);
      float intensity = 0.6 * height;
      
      float midPoint = 0.20;
      float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
      
      vec3 auroraColor = intensity * rampColor;
      
      fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
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

    // Fullscreen triangle position buffer
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    this.locs = {
      uTime: gl.getUniformLocation(program, 'uTime'),
      uAmplitude: gl.getUniformLocation(program, 'uAmplitude'),
      uColorStops: gl.getUniformLocation(program, 'uColorStops'),
      uResolution: gl.getUniformLocation(program, 'uResolution'),
      uBlend: gl.getUniformLocation(program, 'uBlend')
    };

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();

    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  resize() {
    if (!this.container || !this.gl) return;
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
  }

  animate(t) {
    this.animId = requestAnimationFrame(this.animate);
    if (!this.gl || !this.program) return;

    const gl = this.gl;
    gl.useProgram(this.program);

    const time = t * 0.01 * this.speed * 0.1;
    gl.uniform1f(this.locs.uTime, time);
    gl.uniform1f(this.locs.uAmplitude, this.amplitude);
    gl.uniform1f(this.locs.uBlend, this.blend);
    gl.uniform2f(this.locs.uResolution, this.canvas.width, this.canvas.height);

    const colorsFlat = [];
    this.colorStops.slice(0, 3).forEach(hex => {
      colorsFlat.push(...Aurora.hexToRgb(hex));
    });
    gl.uniform3fv(this.locs.uColorStops, new Float32Array(colorsFlat));

    gl.clear(gl.COLOR_BUFFER_BIT);
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
  window.Aurora = Aurora;
}
