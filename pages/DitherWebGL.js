// Pure WebGL Dither Effect
(function() {
  'use strict';

  const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    
    void main() {
      gl_Position = a_position;
      v_texCoord = a_texCoord;
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_waveSpeed;
    uniform float u_waveFrequency;
    uniform float u_waveAmplitude;
    uniform vec3 u_waveColor;
    uniform float u_colorNum;
    uniform int u_enableMouseInteraction;
    uniform float u_mouseRadius;
    varying vec2 v_texCoord;

    // Proper noise functions to match original
    vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

    float cnoise(vec2 P) {
      vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
      vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
      Pi = mod289(Pi);
      vec4 ix = Pi.xzxz;
      vec4 iy = Pi.yyww;
      vec4 fx = Pf.xzxz;
      vec4 fy = Pf.yyww;
      vec4 i = permute(permute(ix) + iy);
      vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
      vec4 gy = abs(gx) - 0.5;
      vec4 tx = floor(gx + 0.5);
      gx = gx - tx;
      vec2 g00 = vec2(gx.x, gy.x);
      vec2 g10 = vec2(gx.y, gy.y);
      vec2 g01 = vec2(gx.z, gy.z);
      vec2 g11 = vec2(gx.w, gy.w);
      vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
      g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
      float n00 = dot(g00, vec2(fx.x, fy.x));
      float n10 = dot(g10, vec2(fx.y, fy.y));
      float n01 = dot(g01, vec2(fx.z, fy.z));
      float n11 = dot(g11, vec2(fx.w, fy.w));
      vec2 fade_xy = fade(Pf.xy);
      vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
      return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
    }

    const int OCTAVES = 8;
    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 1.0;
      float freq = u_waveFrequency;
      for (int i = 0; i < OCTAVES; i++) {
        value += amp * abs(cnoise(p));
        p *= freq;
        amp *= u_waveAmplitude;
      }
      return value;
    }

    float pattern(vec2 p) {
      vec2 p2 = p - u_time * u_waveSpeed;
      return fbm(p - fbm(p + fbm(p2)));
    }

    void main() {
      vec2 uv = v_texCoord - 0.5;
      uv.x *= u_resolution.x / u_resolution.y;
      
      // Scale up the coordinates to make patterns smaller
      uv *= 3.0;
      
      float f = pattern(uv);
      
      // Mouse interaction
      if (u_enableMouseInteraction == 1) {
        vec2 mouseNDC = (u_mouse / u_resolution - 0.5) * vec2(1.0, -1.0);
        mouseNDC.x *= u_resolution.x / u_resolution.y;
        float dist = length(uv - mouseNDC);
        float effect = 1.0 - smoothstep(0.0, u_mouseRadius, dist);
        f -= 0.5 * effect;
      }
      
      vec3 col = mix(vec3(0.0), u_waveColor, f);
      
      // Apply color intensity (lower = whiter)
      float whiteness = (10.0 - u_colorNum) / 10.0;
      col = mix(col, vec3(1.0), whiteness);
      
      // Apply larger pixel dithering for more organic look
      vec2 ditherCoord = floor(gl_FragCoord.xy / 4.0);
      float dither = mod(ditherCoord.x + ditherCoord.y, 2.0);
      float step = 1.0 / (u_colorNum - 1.0);
      col += dither * step * 0.3;
      col = floor(col * (u_colorNum - 1.0) + 0.5) / (u_colorNum - 1.0);
      
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  function createDitherCanvas(container, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = container.offsetWidth || 800;
    canvas.height = container.offsetHeight || 600;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return null;
    }

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // Create buffer for full-screen quad
    const positions = new Float32Array([
      -1, -1,  0, 0,
       1, -1,  1, 0,
      -1,  1,  0, 1,
      -1,  1,  0, 1,
       1, -1,  1, 0,
       1,  1,  1, 1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Get attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseUniformLocation = gl.getUniformLocation(program, 'u_mouse');
    const waveSpeedUniformLocation = gl.getUniformLocation(program, 'u_waveSpeed');
    const waveFrequencyUniformLocation = gl.getUniformLocation(program, 'u_waveFrequency');
    const waveAmplitudeUniformLocation = gl.getUniformLocation(program, 'u_waveAmplitude');
    const waveColorUniformLocation = gl.getUniformLocation(program, 'u_waveColor');
    const colorNumUniformLocation = gl.getUniformLocation(program, 'u_colorNum');
    const enableMouseInteractionUniformLocation = gl.getUniformLocation(program, 'u_enableMouseInteraction');
    const mouseRadiusUniformLocation = gl.getUniformLocation(program, 'u_mouseRadius');

    // Set up vertex attributes
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 16, 8);

    // Animation variables
    let startTime = Date.now();
    let mouseX = 0;
    let mouseY = 0;

    // Mouse interaction
    if (options.enableMouseInteraction !== false) {
      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      });
    }

    // Resize handler
    function resizeCanvas() {
      canvas.width = container.offsetWidth || 800;
      canvas.height = container.offsetHeight || 600;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    // Render loop
    function render() {
      const currentTime = (Date.now() - startTime) / 1000;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); // Transparent background
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // Set uniforms
      gl.uniform1f(timeUniformLocation, currentTime);
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform2f(mouseUniformLocation, mouseX, mouseY);
      gl.uniform1f(waveSpeedUniformLocation, options.waveSpeed || 0.05);
      gl.uniform1f(waveFrequencyUniformLocation, options.waveFrequency || 3);
      gl.uniform1f(waveAmplitudeUniformLocation, options.waveAmplitude || 0.3);
      gl.uniform3f(waveColorUniformLocation, 
        options.waveColor ? options.waveColor[0] : 0.5,
        options.waveColor ? options.waveColor[1] : 0.5,
        options.waveColor ? options.waveColor[2] : 0.5
      );
      gl.uniform1f(colorNumUniformLocation, options.colorNum || 4.0);
      gl.uniform1i(enableMouseInteractionUniformLocation, options.enableMouseInteraction !== false ? 1 : 0);
      gl.uniform1f(mouseRadiusUniformLocation, options.mouseRadius || 0.3);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!options.disableAnimation) {
        requestAnimationFrame(render);
      }
    }

    render();
    return canvas;
  }

  // Make globally available
  window.createDitherCanvas = createDitherCanvas;
})();