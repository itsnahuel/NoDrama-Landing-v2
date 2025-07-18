// Simple Dither component for UMD builds
(function() {
  'use strict';

  const waveVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      gl_Position = projectionMatrix * viewPosition;
    }
  `;

  const waveFragmentShader = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;
    uniform float waveSpeed;
    uniform float waveFrequency;
    uniform float waveAmplitude;
    uniform vec3 waveColor;
    uniform vec2 mousePos;
    uniform int enableMouseInteraction;
    uniform float mouseRadius;
    varying vec2 vUv;

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

    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 1.0;
      float freq = waveFrequency;
      for (int i = 0; i < 4; i++) {
        value += amp * abs(cnoise(p));
        p *= freq;
        amp *= waveAmplitude;
      }
      return value;
    }

    float pattern(vec2 p) {
      vec2 p2 = p - time * waveSpeed;
      return fbm(p - fbm(p + fbm(p2)));
    }

    void main() {
      vec2 uv = vUv - 0.5;
      uv.x *= resolution.x / resolution.y;
      float f = pattern(uv * 3.0);
      
      if (enableMouseInteraction == 1) {
        vec2 mouseNDC = (mousePos / resolution - 0.5) * vec2(1.0, -1.0);
        mouseNDC.x *= resolution.x / resolution.y;
        float dist = length(uv - mouseNDC);
        float effect = 1.0 - smoothstep(0.0, mouseRadius, dist);
        f -= 0.5 * effect;
      }
      
      vec3 col = mix(vec3(0.0), waveColor, f);
      
      // Simple dithering
      vec2 ditherCoord = gl_FragCoord.xy / 2.0;
      float dither = mod(ditherCoord.x + ditherCoord.y, 2.0);
      col = floor(col * 4.0 + dither) / 4.0;
      
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function DitherWaves(props) {
    const meshRef = React.useRef();
    const uniformsRef = React.useRef({
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(800, 600) },
      waveSpeed: { value: props.waveSpeed || 0.05 },
      waveFrequency: { value: props.waveFrequency || 3 },
      waveAmplitude: { value: props.waveAmplitude || 0.3 },
      waveColor: { value: new THREE.Color(props.waveColor[0], props.waveColor[1], props.waveColor[2]) },
      mousePos: { value: new THREE.Vector2(0, 0) },
      enableMouseInteraction: { value: props.enableMouseInteraction ? 1 : 0 },
      mouseRadius: { value: props.mouseRadius || 0.3 }
    });

    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

    React.useEffect(() => {
      const animate = () => {
        if (!props.disableAnimation) {
          uniformsRef.current.time.value += 0.016;
        }
        requestAnimationFrame(animate);
      };
      animate();
    }, [props.disableAnimation]);

    React.useEffect(() => {
      if (props.enableMouseInteraction) {
        uniformsRef.current.mousePos.value.set(mousePos.x, mousePos.y);
      }
    }, [mousePos, props.enableMouseInteraction]);

    const handlePointerMove = (e) => {
      if (!props.enableMouseInteraction) return;
      const rect = e.target.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    return React.createElement('mesh', {
      ref: meshRef,
      onPointerMove: handlePointerMove,
      scale: [2, 2, 1]
    }, [
      React.createElement('planeGeometry', { key: 'geometry', args: [4, 3] }),
      React.createElement('shaderMaterial', {
        key: 'material',
        vertexShader: waveVertexShader,
        fragmentShader: waveFragmentShader,
        uniforms: uniformsRef.current
      })
    ]);
  }

  function SimpleDither(props) {
    return React.createElement(ReactThreeFiber.Canvas, {
      style: { width: '100%', height: '600px' },
      camera: { position: [0, 0, 5] }
    }, React.createElement(DitherWaves, props));
  }

  // Make it globally available
  window.SimpleDither = SimpleDither;
})();