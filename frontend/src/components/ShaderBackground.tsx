import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
varying vec2 vUv;

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  vec2 mouse = uMouse * 0.15;
  
  float t = uTime * 0.15;
  
  float n1 = snoise(uv * 2.0 + vec2(t, t * 0.7) + mouse);
  float n2 = snoise(uv * 3.0 - vec2(t * 0.8, t * 0.5) - mouse * 0.5);
  float n3 = snoise(uv * 1.5 + vec2(t * 0.3, -t * 0.6) + mouse * 0.3);
  
  float noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
  
  vec3 blue = vec3(0.231, 0.510, 0.965);
  vec3 violet = vec3(0.545, 0.361, 0.965);
  vec3 teal = vec3(0.051, 0.580, 0.533);
  vec3 black = vec3(0.0);
  
  float blend1 = smoothstep(-0.3, 0.5, noise + sin(t * 0.5) * 0.2);
  float blend2 = smoothstep(-0.2, 0.6, n2 + cos(t * 0.3) * 0.3);
  
  vec3 color = mix(blue, violet, blend1);
  color = mix(color, teal, blend2 * 0.5);
  
  float dist = length(uv - 0.5);
  float vignette = 1.0 - smoothstep(0.2, 0.9, dist);
  
  color *= vignette * 0.35;
  color = mix(black, color, smoothstep(-0.5, 0.5, noise));
  
  gl_FragColor = vec4(color, 1.0);
}
`;

function ShaderPlane() {
  const mesh = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
  }), []);

  useFrame(({ clock }) => {
    if (mesh.current) {
      const material = mesh.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = clock.getElapsedTime();
      material.uniforms.uMouse.value.lerp(
        new THREE.Vector2(mouseRef.current.x, mouseRef.current.y),
        0.05
      );
    }
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });
  }

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function ShaderBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false }}
        style={{ background: '#0A0A0A' }}
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
}
