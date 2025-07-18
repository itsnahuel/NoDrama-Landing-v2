// Silk WebGL Background - Vanilla JavaScript Implementation
// Based on the React Three Fiber Silk component

function hexToNormalizedRGB(hex) {
  hex = hex.replace("#", "");
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
  ];
}

const vertexShaderSource = `
  attribute vec4 a_position;
  attribute vec2 a_texCoord;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vPosition = a_position.xyz;
    vUv = a_texCoord;
    gl_Position = a_position;
  }
`;

const fragmentShaderSource = `
  #ifdef GL_ES
  precision mediump float;
  #endif
  
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uSpeed;
  uniform float uScale;
  uniform float uRotation;
  uniform float uNoiseIntensity;
  
  float noise(vec2 texCoord) {
    float G = 2.71828182845904523536;
    vec2 r = (G * sin(G * texCoord));
    return fract(r.x * r.y * (1.0 + texCoord.x));
  }
  
  vec2 rotateUvs(vec2 uv, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    mat2 rot = mat2(c, -s, s, c);
    return rot * uv;
  }
  
  void main() {
    float rnd = noise(gl_FragCoord.xy);
    vec2 uv = rotateUvs(vUv * uScale, uRotation);
    vec2 tex = uv * uScale;
    float tOffset = uSpeed * uTime;
    
    tex.y += 0.03 * sin(8.0 * tex.x - tOffset);
    
    float pattern = 0.6 + 0.4 * sin(5.0 * (tex.x + tex.y + cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * tOffset) + sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));
    
    vec4 col = vec4(uColor, 1.0) * vec4(vec3(pattern), 1.0) - rnd / 15.0 * uNoiseIntensity;
    col.a = 1.0;
    gl_FragColor = col;
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
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
    console.error('Error linking program:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
}

function createSilkCanvas(container, options = {}) {
  const {
    speed = 5,
    scale = 1,
    color = "#7B7481",
    noiseIntensity = 1.5,
    rotation = 0
  } = options;
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  
  // Get WebGL context
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    console.error('WebGL not supported');
    return null;
  }
  
  console.log('WebGL context created successfully');
  
  // Create shaders
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  
  if (!vertexShader || !fragmentShader) {
    return null;
  }
  
  // Create program
  const program = createProgram(gl, vertexShader, fragmentShader);
  
  if (!program) {
    return null;
  }
  
  // Get attribute and uniform locations
  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
  const texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord');
  
  const timeUniformLocation = gl.getUniformLocation(program, 'uTime');
  const colorUniformLocation = gl.getUniformLocation(program, 'uColor');
  const speedUniformLocation = gl.getUniformLocation(program, 'uSpeed');
  const scaleUniformLocation = gl.getUniformLocation(program, 'uScale');
  const rotationUniformLocation = gl.getUniformLocation(program, 'uRotation');
  const noiseIntensityUniformLocation = gl.getUniformLocation(program, 'uNoiseIntensity');
  
  // Create buffers
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
  // Full screen quad
  const positions = [
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0,
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  
  // Texture coordinates
  const texCoords = [
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0,
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  
  // Convert hex color to normalized RGB
  const normalizedColor = hexToNormalizedRGB(color);
  
  let startTime = Date.now();
  let animationId;
  
  function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  
  function render() {
    const currentTime = Date.now();
    const elapsed = (currentTime - startTime) / 1000.0;
    
    // Clear canvas
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use our shader program
    gl.useProgram(program);
    
    // Set up position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Set up texture coordinate attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Set uniforms
    gl.uniform1f(timeUniformLocation, elapsed);
    gl.uniform3f(colorUniformLocation, normalizedColor[0], normalizedColor[1], normalizedColor[2]);
    gl.uniform1f(speedUniformLocation, speed);
    gl.uniform1f(scaleUniformLocation, scale);
    gl.uniform1f(rotationUniformLocation, rotation);
    gl.uniform1f(noiseIntensityUniformLocation, noiseIntensity);
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    animationId = requestAnimationFrame(render);
  }
  
  // Initial resize and start rendering
  resize();
  render();
  
  // Handle window resize
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  
  // Add canvas to container
  container.appendChild(canvas);
  
  // Return cleanup function
  return function cleanup() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    resizeObserver.disconnect();
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };
}

// Make function available globally
window.createSilkCanvas = createSilkCanvas;