import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { Landmark, Results } from '../types';

const PARTICLE_COUNT = 5000;

// Custom Shader Material for glowing golden particles
const particleVertexShader = `
  attribute float size;
  attribute float alpha;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSize;
  
  void main() {
    vColor = color;
    vAlpha = alpha;
    vSize = size;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  uniform float time;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSize;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    // Enhanced glowing effect with softer, brighter edges
    float alpha = vAlpha * (1.0 - smoothstep(0.0, 0.6, dist));
    
    // Multiple twinkle frequencies for rich sparkle effect
    float twinkle1 = sin(time * 4.0 + vSize * 15.0) * 0.4 + 0.6;
    float twinkle2 = sin(time * 6.5 + vSize * 8.0) * 0.3 + 0.7;
    float twinkle3 = sin(time * 2.0 + vSize * 20.0) * 0.2 + 0.8;
    float combinedTwinkle = (twinkle1 + twinkle2 + twinkle3) / 3.0;
    
    // Preserve original colors while adding sparkle
    // Only apply golden tint to particles that are already gold/yellow
    float isGold = step(0.5, vColor.r + vColor.g - vColor.b); // Detect gold/yellow colors
    vec3 goldenBoost = vec3(1.0, 0.9, 0.6);
    vec3 colorBoost = mix(vColor, vColor * goldenBoost, isGold * 0.6); // Only boost gold colors
    
    vec3 sparkleColor = colorBoost * (1.0 + combinedTwinkle * 0.8);
    
    // Add inner glow for extra shine (white glow, preserves color)
    float innerGlow = 1.0 - smoothstep(0.0, 0.3, dist);
    sparkleColor += vec3(1.0, 1.0, 1.0) * innerGlow * 0.3; // White glow, less intense
    
    alpha *= (0.8 + combinedTwinkle * 0.4);
    
    gl_FragColor = vec4(sparkleColor, alpha);
  }
`;

// 3D Noise function for explosion state
function noise3D(x: number, y: number, z: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

const GestureTree: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // UI States
  const [cameraStatus, setCameraStatus] = useState<'LOADING' | 'ACTIVE' | 'ERROR'>('LOADING');
  const [interactionState, setInteractionState] = useState<'IDLE' | 'PINCHING'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<string>('生日暖金');

  // Logic Refs
  const isPinchingRef = useRef(false);
  const pinchStrengthRef = useRef(0);
  const rotationTargetRef = useRef({ x: 0, y: 0 });
  const rotationCurrentRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const colorThemeRef = useRef(0);
  const wasOneFingerRef = useRef(false);
  const wasTwoFingersRef = useRef(false);
  const wasThreeFingersRef = useRef(false);
  const isSnowingRef = useRef(false);
  const manualModeRef = useRef<'gesture' | 'gather' | 'scatter'>('gesture');
  const commandRef = useRef<string | null>(null);
  
  // Three.js Refs
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const treeGroupRef = useRef<THREE.Group | null>(null);
  const starRef = useRef<THREE.Sprite | null>(null);
  const trunkRef = useRef<THREE.Mesh | null>(null);
  const snowParticlesRef = useRef<THREE.Points | null>(null);
  const fireworksRef = useRef<any[]>([]);
  
  // Particle system data
  const positionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const targetTreeRef = useRef<Float32Array | null>(null);
  const targetExplodedRef = useRef<Float32Array | null>(null);
  const sizesRef = useRef<Float32Array | null>(null);
  const alphasRef = useRef<Float32Array | null>(null);

  // 1. Initialize Three.js with Post-Processing
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
 scene.background = new THREE.Color(0x0a1216);
 scene.fog = new THREE.FogExp2(0x0a1216, 0.02);
    sceneRef.current = scene;

    const portrait = window.innerHeight > window.innerWidth;
    const camera = new THREE.PerspectiveCamera(
      portrait ? 68 : 60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, portrait ? 46 : 35);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const narrow = window.matchMedia('(max-width: 768px)').matches;
    const renderer = new THREE.WebGLRenderer({
      antialias: !narrow,
      powerPreference: 'high-performance',
        alpha: false, 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, narrow ? 1.25 : 2));
    renderer.setClearColor(0x0a1216);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-Processing Setup (UnrealBloomPass for cinematic glow)
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      narrow ? 1.15 : 2.2,
      0.45,
      0.72
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Particle System Setup
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const targetTree = new Float32Array(PARTICLE_COUNT * 3);
    const targetExploded = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const alphas = new Float32Array(PARTICLE_COUNT);
    
    const colorGold = new THREE.Color(0xf0b35a);
    const colorCream = new THREE.Color(0xf2ebe0);
    const colorEmber = new THREE.Color(0xff8a3d);
    const colorRose = new THREE.Color(0xe07a78);
    const tempColor = new THREE.Color();

    // Initialize particle positions and targets
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;

      // Birthday cake: two tiers, candles on top
      const portion = i / PARTICLE_COUNT;
      const goldenAngle = 2.399963229728653;
      if (portion < 0.1) {
        const candleCount = 7;
        const candle = i % candleCount;
        const angle = (candle / candleCount) * Math.PI * 2;
        const candleRadius = 3.4;
        targetTree[i3] = Math.cos(angle) * candleRadius + (Math.random() - 0.5) * 0.28;
        targetTree[i3 + 1] = 2.2 + Math.random() * 5.2;
        targetTree[i3 + 2] = Math.sin(angle) * candleRadius + (Math.random() - 0.5) * 0.28;
      } else {
        const topTier = portion > 0.64;
        const radius = topTier ? 6.4 : 10.2;
        const y0 = topTier ? -1.4 : -8.4;
        const height = topTier ? 3.5 : 6.4;
        const angle = i * goldenAngle;
        const r = radius * Math.sqrt(Math.random());
        targetTree[i3] = Math.cos(angle) * r;
        targetTree[i3 + 1] = y0 + Math.random() * height;
        targetTree[i3 + 2] = Math.sin(angle) * r;
      }

      // Exploded State (3D Noise Distribution)
      const spread = 60;
      const noiseX = noise3D(i, 0, 0);
      const noiseY = noise3D(0, i, 0);
      const noiseZ = noise3D(0, 0, i);
      
      targetExploded[i3] = (noiseX - 0.5) * spread;
      targetExploded[i3 + 1] = (noiseY - 0.5) * spread;
      targetExploded[i3 + 2] = (noiseZ - 0.5) * spread;

      // Start in exploded state
      positions[i3] = targetExploded[i3];
      positions[i3 + 1] = targetExploded[i3 + 1];
      positions[i3 + 2] = targetExploded[i3 + 2];

      // Initial velocities (zero)
      velocities[i3] = 0;
      velocities[i3 + 1] = 0;
      velocities[i3 + 2] = 0;

      const rand = Math.random();
      if (portion < 0.1 && rand > 0.35) {
        tempColor.copy(colorEmber).multiplyScalar(1.35);
      } else if (rand > 0.72) {
        tempColor.copy(colorCream).multiplyScalar(1.15);
      } else if (rand > 0.38) {
        tempColor.copy(colorGold).multiplyScalar(1.35);
      } else {
        tempColor.copy(colorRose).multiplyScalar(1.15);
      }

        colors[i3] = tempColor.r;
      colors[i3 + 1] = tempColor.g;
      colors[i3 + 2] = tempColor.b;

      // Sizes and alphas (variation for depth)
      sizes[i] = 0.8 + Math.random() * 0.6;
      alphas[i] = 0.7 + Math.random() * 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    // Custom Shader Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
      vertexColors: true,
    });

    const particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    
    // Group for rotation
    const treeGroup = new THREE.Group();
    treeGroup.add(particles);
    treeGroup.position.y = 2;
    scene.add(treeGroup);
    treeGroupRef.current = treeGroup;

    // Store refs
    positionsRef.current = positions;
    velocitiesRef.current = velocities;
    targetTreeRef.current = targetTree;
    targetExplodedRef.current = targetExploded;
    sizesRef.current = sizes;
    alphasRef.current = alphas;

    // Candle flame above the cake
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 128;
    starCanvas.height = 128;
    const starCtx = starCanvas.getContext('2d');
    if (starCtx) {
      const grad = starCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(255, 215, 0, 0.9)');
      grad.addColorStop(0.6, 'rgba(255, 215, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      starCtx.fillStyle = grad;
      starCtx.fillRect(0, 0, 128, 128);
    }
    const starTexture = new THREE.CanvasTexture(starCanvas);
    const starMaterial = new THREE.SpriteMaterial({
      map: starTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const star = new THREE.Sprite(starMaterial);
    star.scale.set(0, 0, 1);
    star.position.set(0, 8.2, 0);
    treeGroup.add(star);
    starRef.current = star;

    const trunkGeometry = new THREE.CylinderGeometry(11.2, 11.6, 0.55, 48);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0xe7d3b0,
      roughness: 0.55,
      metalness: 0.08,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(0, -8.7, 0);
    trunk.visible = false;
    treeGroup.add(trunk);
    trunkRef.current = trunk;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Snow Particle System
    const SNOW_COUNT = 1000;
    const snowGeometry = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(SNOW_COUNT * 3);
    
    for (let i = 0; i < SNOW_COUNT; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 60;
      snowPositions[i * 3 + 1] = Math.random() * 40 + 10;
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3).setUsage(THREE.DynamicDrawUsage));
    
    const snowMaterial = new THREE.PointsMaterial({
      size: 0.34,
      color: 0xf0b35a,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    const snowParticles = new THREE.Points(snowGeometry, snowMaterial);
    snowParticles.visible = false;
    scene.add(snowParticles);
    snowParticlesRef.current = snowParticles;

    // Animation Loop with Physics
    let animationFrameId: number;
    const GRAVITY_STRENGTH = 0.35;
    const EXPLOSION_STRENGTH = 0.25;
    const DAMPING = 0.90;
    const BROWN_MOTION = 0.03;
    
    const themeNames = ['生日暖金', '奶油', '莓果夜'];
    const applyTheme = (index: number) => {
      if (!particlesRef.current) return;
      const palette = [
        [0xf2ebe0, 0xf0b35a, 0xff8a3d, 0xe07a78],
        [0xf2ebe0, 0xf6e7c1, 0xf0b35a],
        [0xe07a78, 0x9a3d55, 0xf0b35a],
      ][index] || [];
      const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
      const tint = new THREE.Color();
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        tint.set(palette[i % palette.length]);
        colors[i * 3] = tint.r;
        colors[i * 3 + 1] = tint.g;
        colors[i * 3 + 2] = tint.b;
      }
      particlesRef.current.geometry.attributes.color.needsUpdate = true;
    };

    const spawnFireworks = () => {
      if (!sceneRef.current) return;
      const scene = sceneRef.current;
      const hues = [0xf0b35a, 0xff8a3d, 0xf2ebe0, 0xe07a78];
      const origin = new THREE.Vector3((Math.random() - 0.5) * 12, 4 + Math.random() * 6, 0);
      const count = narrow ? 120 : 220;
      const positions = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = origin.x;
        positions[i * 3 + 1] = origin.y;
        positions[i * 3 + 2] = origin.z;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 0.25 + Math.random() * 0.55;
        velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        velocities[i * 3 + 2] = Math.cos(phi) * speed;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: hues[Math.floor(Math.random() * hues.length)],
          size: 0.45,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      scene.add(points);
      fireworksRef.current.push({
        particles: points,
        velocities,
        age: 0,
        lifetime: 2.4,
        active: true,
      });
    };

    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
      timeRef.current += 0.016;

      const command = commandRef.current;
      if (command) {
        commandRef.current = null;
        if (command === 'gather') {
          manualModeRef.current = 'gather';
          isPinchingRef.current = true;
          pinchStrengthRef.current = 1;
          setInteractionState('PINCHING');
        } else if (command === 'scatter') {
          manualModeRef.current = 'scatter';
          isPinchingRef.current = false;
          pinchStrengthRef.current = 0;
          setInteractionState('IDLE');
        } else if (command === 'theme') {
          const next = (colorThemeRef.current + 1) % themeNames.length;
          colorThemeRef.current = next;
          applyTheme(next);
          setCurrentTheme(themeNames[next]);
        } else if (command === 'petals') {
          if (snowParticlesRef.current) snowParticlesRef.current.visible = !snowParticlesRef.current.visible;
        } else if (command === 'fire') {
          spawnFireworks();
        }
      }

      if (!rendererRef.current || !composerRef.current) return;

      const positions = positionsRef.current!;
      const velocities = velocitiesRef.current!;
      const targetTree = targetTreeRef.current!;
      const targetExploded = targetExplodedRef.current!;
      const material = particlesRef.current!.material as THREE.ShaderMaterial;

      material.uniforms.time.value = timeRef.current;

      const isPinching = isPinchingRef.current;
      const pinchStrength = pinchStrengthRef.current;
        
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];

        let targetX, targetY, targetZ;
        
        if (pinchStrength > 0.01) {
          targetX = targetTree[i3];
          targetY = targetTree[i3 + 1];
          targetZ = targetTree[i3 + 2];

          const dx = targetX - x;
          const dy = targetY - y;
          const dz = targetZ - z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist > 0.01) {
            const force = GRAVITY_STRENGTH * pinchStrength;
            velocities[i3] += (dx / dist) * force;
            velocities[i3 + 1] += (dy / dist) * force;
            velocities[i3 + 2] += (dz / dist) * force;
          }
            } else {
          targetX = targetExploded[i3];
          targetY = targetExploded[i3 + 1];
          targetZ = targetExploded[i3 + 2];

          const dx = targetX - x;
          const dy = targetY - y;
          const dz = targetZ - z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist > 0.01) {
            const force = EXPLOSION_STRENGTH;
            velocities[i3] += (dx / dist) * force;
            velocities[i3 + 1] += (dy / dist) * force;
            velocities[i3 + 2] += (dz / dist) * force;
          }

          velocities[i3] += (Math.random() - 0.5) * BROWN_MOTION;
          velocities[i3 + 1] += (Math.random() - 0.5) * BROWN_MOTION;
          velocities[i3 + 2] += (Math.random() - 0.5) * BROWN_MOTION;
        }

        velocities[i3] *= DAMPING;
        velocities[i3 + 1] *= DAMPING;
        velocities[i3 + 2] *= DAMPING;

        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];
      }

        geometry.attributes.position.needsUpdate = true;

      // Star Animation
      if (starRef.current) {
        const targetScale = isPinching ? 5 + Math.sin(timeRef.current * 4) * 1.5 : 0;
        gsap.to(starRef.current.scale, {
          x: targetScale,
          y: targetScale,
          duration: 0.5,
          ease: 'power2.out',
        });
      }

      // Trunk Animation
      if (trunkRef.current) {
        trunkRef.current.visible = isPinching;
        trunkRef.current.rotation.y += 0.001;
      }

      // Snow Animation
      if (snowParticlesRef.current && snowParticlesRef.current.visible) {
        const snowPos = snowParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const SNOW_COUNT = snowPos.length / 3;
        
        for (let i = 0; i < SNOW_COUNT; i++) {
          const i3 = i * 3;
          snowPos[i3 + 1] -= 0.05 + Math.sin(timeRef.current + i) * 0.02;
          snowPos[i3] += Math.sin(timeRef.current * 0.5 + i) * 0.02;
          
          if (snowPos[i3 + 1] < -15) {
            snowPos[i3 + 1] = 40;
            snowPos[i3] = (Math.random() - 0.5) * 60;
            snowPos[i3 + 2] = (Math.random() - 0.5) * 60;
          }
        }
        snowParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Fireworks Animation with enhanced effects
      const activeFireworks = fireworksRef.current.filter(fw => fw.active);
      activeFireworks.forEach(fw => {
        fw.age += 0.016;
        if (fw.age > fw.lifetime) {
          fw.active = false;
          if (fw.particles) {
            scene.remove(fw.particles);
            fw.particles.geometry.dispose();
            (fw.particles.material as THREE.Material).dispose();
          }
          return;
        }
        
        if (fw.particles) {
          const positions = fw.particles.geometry.attributes.position.array as Float32Array;
          const velocities = fw.velocities;
          const colors = fw.particles.geometry.attributes.color.array as Float32Array;
          
          for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // 位置更新
            positions[i3] += velocities[i3];
            positions[i3 + 1] += velocities[i3 + 1];
            positions[i3 + 2] += velocities[i3 + 2];
            
            // 重力效果（增强）
            velocities[i3 + 1] -= 0.015;
            
            // 空气阻力
            velocities[i3] *= 0.97;
            velocities[i3 + 1] *= 0.97;
            velocities[i3 + 2] *= 0.97;
            
            // 颜色渐变到白色（后期变亮效果）
            const ageFactor = fw.age / fw.lifetime;
            if (ageFactor > 0.5) {
              const whiteMix = (ageFactor - 0.5) * 0.6; // 后半段逐渐变白
              colors[i3] = colors[i3] * (1 - whiteMix) + whiteMix;
              colors[i3 + 1] = colors[i3 + 1] * (1 - whiteMix) + whiteMix;
              colors[i3 + 2] = colors[i3 + 2] * (1 - whiteMix) + whiteMix;
            }
          }
          
          fw.particles.geometry.attributes.position.needsUpdate = true;
          fw.particles.geometry.attributes.color.needsUpdate = true;
          
          // 非线性透明度衰减（先亮后快速消失）
          const ageFactor = fw.age / fw.lifetime;
          const opacity = ageFactor < 0.7 ? 1.0 : (1 - (ageFactor - 0.7) / 0.3);
          (fw.particles.material as THREE.PointsMaterial).opacity = opacity;
        }
      });

      // Rotation Control
      const targetRotX = rotationTargetRef.current.y * 1.8;
      const targetRotY = -rotationTargetRef.current.x * 2.5;

      if (isPinching) {
        gsap.to(rotationCurrentRef.current, {
          x: targetRotX,
          y: targetRotY,
          duration: 0.8,
          ease: 'power2.out',
        });
      } else {
        rotationCurrentRef.current.y += 0.002;
      }

      if (treeGroupRef.current) {
        treeGroupRef.current.rotation.x = rotationCurrentRef.current.x;
        treeGroupRef.current.rotation.y = rotationCurrentRef.current.y;
      }

      composer.render();
    };

    animate();

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !composerRef.current) return;
      const isPortrait = window.innerHeight > window.innerWidth;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.fov = isPortrait ? 68 : 60;
      cameraRef.current.position.z = isPortrait ? 46 : 35;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      composerRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.visualViewport?.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        if (rendererRef.current) {
             const domEl = rendererRef.current.domElement;
             if (domEl && domEl.parentNode) domEl.parentNode.removeChild(domEl);
             rendererRef.current.dispose();
             rendererRef.current = null;
        }
      if (composerRef.current) {
        composerRef.current.dispose();
        composerRef.current = null;
        }
        geometry.dispose();
        material.dispose();
        starMaterial.dispose();
      starTexture.dispose();
    };
  }, []); 

  // 2. Initialize MediaPipe
  useEffect(() => {
    let handsInstance: any = null;
    let cameraInstance: any = null;
    let isMounted = true;

    const initCamera = async () => {
        try {
            let attempts = 0;
        const getCamera = () => {
          const win = window as any;
          return (
            win.Camera ||
            win.CameraUtils?.Camera ||
            (win.camera_utils && win.camera_utils.Camera) ||
            null
          );
        };

        while ((!window.Hands || !getCamera()) && attempts < 100) {
          await new Promise((r) => setTimeout(r, 50));
                attempts++;
            }

            if (!isMounted) return;

        const CameraClass = getCamera();
        if (!window.Hands || !CameraClass) {
          setErrorMessage('MediaPipe failed to load. Please check connection and refresh.');
                setCameraStatus('ERROR');
                return;
            }

            handsInstance = new window.Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            handsInstance.setOptions({
                maxNumHands: 1,
                modelComplexity: window.matchMedia('(max-width: 768px)').matches ? 0 : 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            handsInstance.onResults((results: Results) => {
                if (!isMounted) return;
                
                if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                    const landmarks = results.multiHandLandmarks[0];
            const wrist = landmarks[0];
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const ringTip = landmarks[16];
            const pinkyTip = landmarks[20];
            const palmBase = landmarks[9];

            // More sensitive detection with improved thresholds
            const indexCurled = Math.abs(indexTip.y - palmBase.y) < 0.12;
            const middleCurled = Math.abs(middleTip.y - palmBase.y) < 0.12;
            const ringCurled = Math.abs(ringTip.y - palmBase.y) < 0.12;
            const pinkyCurled = Math.abs(pinkyTip.y - palmBase.y) < 0.12;
            const thumbCurled = Math.abs(thumbTip.y - palmBase.y) < 0.18;

            // Extended means clearly above palm
            const indexExtended = Math.abs(indexTip.y - palmBase.y) > 0.15;
            const middleExtended = Math.abs(middleTip.y - palmBase.y) > 0.15;
            const ringExtended = Math.abs(ringTip.y - palmBase.y) > 0.15;
            const pinkyExtended = Math.abs(pinkyTip.y - palmBase.y) > 0.15;

            const fingersCurled = [indexCurled, middleCurled, ringCurled, pinkyCurled].filter(x => x).length;
            const fingersExtended = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(x => x).length;
            const isFist = fingersCurled >= 3 && thumbCurled;

            // More lenient finger counting (1, 2, 3)
            // One finger: Only index is clearly extended, others are clearly not
            const isOneFinger = indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
            
            // Two fingers: Index and middle extended, others not
            const isTwoFingers = indexExtended && middleExtended && !ringExtended && !pinkyExtended;
            
            // Three fingers: Index, middle, ring extended, pinky not
            const isThreeFingers = indexExtended && middleExtended && ringExtended && !pinkyExtended;

            // Handle gestures with priority
            if (isOneFinger && !wasOneFingerRef.current) {
              // 1 finger: 切换颜色主题
              wasOneFingerRef.current = true;

              const oldTheme = colorThemeRef.current;
              const newTheme = (oldTheme + 1) % 3;
              colorThemeRef.current = newTheme;

              const themeNames = ['生日暖金', '奶油', '莓果夜'];
              setCurrentTheme(themeNames[newTheme]);

              if (particlesRef.current) {
                const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
                const cream = new THREE.Color(0xf2ebe0);
                const gold = new THREE.Color(0xf0b35a);
                const ember = new THREE.Color(0xff8a3d);
                const rose = new THREE.Color(0xe07a78);
                const champagne = new THREE.Color(0xf6e7c1);
                const berry = new THREE.Color(0x9a3d55);

                for (let i = 0; i < PARTICLE_COUNT; i++) {
                  const i3 = i * 3;
                  const rand = Math.random();
                  const tempColor = new THREE.Color();

                  if (newTheme === 0) {
                    if (rand > 0.7) tempColor.copy(cream);
                    else if (rand > 0.4) tempColor.copy(gold).multiplyScalar(1.35);
                    else if (rand > 0.2) tempColor.copy(ember).multiplyScalar(1.2);
                    else tempColor.copy(rose);
                  } else if (newTheme === 1) {
                    if (rand > 0.55) tempColor.copy(cream).multiplyScalar(1.2);
                    else if (rand > 0.25) tempColor.copy(champagne).multiplyScalar(1.25);
                    else tempColor.copy(gold).multiplyScalar(1.3);
                  } else {
                    if (rand > 0.6) tempColor.copy(rose).multiplyScalar(1.25);
                    else if (rand > 0.3) tempColor.copy(berry).multiplyScalar(1.35);
                    else tempColor.copy(gold).multiplyScalar(1.3);
                  }

                  colors[i3] = tempColor.r;
                  colors[i3 + 1] = tempColor.g;
                  colors[i3 + 2] = tempColor.b;
                }
                particlesRef.current.geometry.attributes.color.needsUpdate = true;
              }
            } else if (!isOneFinger) {
              wasOneFingerRef.current = false;
            }

            if (isTwoFingers && !wasTwoFingersRef.current && !isSnowingRef.current) {
              // 2 fingers: 撒花
              wasTwoFingersRef.current = true;
              isSnowingRef.current = true;

              if (snowParticlesRef.current) {
                snowParticlesRef.current.visible = true;
              }

              setTimeout(() => {
                isSnowingRef.current = false;
                if (snowParticlesRef.current) {
                  snowParticlesRef.current.visible = false;
                }
              }, 10000);
            } else if (!isTwoFingers) {
              wasTwoFingersRef.current = false;
            }

            if (isThreeFingers && !wasThreeFingersRef.current) {
              // 3 fingers: 烟花 - 多层爆炸效果
              wasThreeFingersRef.current = true;

              const fireworkPos = {
                x: (palmBase.x - 0.5) * 40,
                y: (palmBase.y - 0.5) * -30 + 10,
                z: 0
              };

              // 创建3个不同层次的烟花（多层爆炸）
              const layers = [
                { count: 200, speed: 0.8, size: 0.8, delay: 0 },      // 外层：快速、大粒子
                { count: 150, speed: 0.5, size: 0.6, delay: 0.1 },   // 中层：中速、中粒子
                { count: 100, speed: 0.3, size: 0.4, delay: 0.2 },   // 内层：慢速、小粒子
              ];

              layers.forEach((layer, layerIndex) => {
                setTimeout(() => {
                  const FW_PARTICLES = layer.count;
                  const fwGeometry = new THREE.BufferGeometry();
                  const fwPositions = new Float32Array(FW_PARTICLES * 3);
                  const fwVelocities = new Float32Array(FW_PARTICLES * 3);
                  const fwColors = new THREE.Float32Array(FW_PARTICLES * 3);
                  const fwSizes = new Float32Array(FW_PARTICLES);

                  // 每层不同颜色，更丰富
                  const fwColor1 = new THREE.Color();
                  const fwColor2 = new THREE.Color();
                  fwColor1.setHSL(Math.random(), 1.0, 0.6);
                  fwColor2.setHSL((Math.random() + 0.3) % 1.0, 1.0, 0.7); // 互补色

                  for (let i = 0; i < FW_PARTICLES; i++) {
                    fwPositions[i * 3] = fireworkPos.x;
                    fwPositions[i * 3 + 1] = fireworkPos.y;
                    fwPositions[i * 3 + 2] = fireworkPos.z;

                    // 球形均匀分布
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1); // 均匀球面分布
                    const speed = (Math.random() * 0.4 + 0.8) * layer.speed;

                    fwVelocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
                    fwVelocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
                    fwVelocities[i * 3 + 2] = Math.cos(phi) * speed;

                    // 渐变颜色（从颜色1到颜色2）
                    const colorMix = i / FW_PARTICLES;
                    const tempColor = new THREE.Color().lerpColors(fwColor1, fwColor2, colorMix);
                    
                    fwColors[i * 3] = tempColor.r;
                    fwColors[i * 3 + 1] = tempColor.g;
                    fwColors[i * 3 + 2] = tempColor.b;
                    
                    // 粒子大小变化
                    fwSizes[i] = layer.size * (0.8 + Math.random() * 0.4);
                  }

                  fwGeometry.setAttribute('position', new THREE.BufferAttribute(fwPositions, 3).setUsage(THREE.DynamicDrawUsage));
                  fwGeometry.setAttribute('color', new THREE.BufferAttribute(fwColors, 3));
                  fwGeometry.setAttribute('size', new THREE.BufferAttribute(fwSizes, 1));

                  const fwMaterial = new THREE.PointsMaterial({
                    size: layer.size,
                    vertexColors: true,
                    blending: THREE.AdditiveBlending,
                    transparent: true,
                    sizeAttenuation: true, // 距离衰减
                  });

                  const fwParticles = new THREE.Points(fwGeometry, fwMaterial);
                  sceneRef.current?.add(fwParticles);

                  fireworksRef.current.push({
                    particles: fwParticles,
                    velocities: fwVelocities,
                    age: 0,
                    lifetime: 3.0, // 增加到3秒
                    active: true,
                    layerIndex: layerIndex
                  });
                }, layer.delay * 1000);
              });

              // Star flash
              if (starRef.current && isPinchingRef.current) {
                gsap.to(starRef.current.scale, {
                  x: 10,
                  y: 10,
                  duration: 0.2,
                  ease: 'power2.out',
                  yoyo: true,
                  repeat: 1,
                });
              }
            } else if (!isThreeFingers) {
              wasThreeFingersRef.current = false;
            }

            // Fist gesture for tree control
            if (isFist) {
              manualModeRef.current = 'gesture';
              const strength = fingersCurled / 4.0;
              gsap.to(pinchStrengthRef, {
                current: strength,
                duration: 0.3,
                ease: 'power2.out',
              });
                        isPinchingRef.current = true;
                        setInteractionState('PINCHING');
                        
              const cx = palmBase.x;
              const cy = palmBase.y;
                        rotationTargetRef.current = {
                            x: (cx - 0.5) * 2,
                y: (cy - 0.5) * 2,
              };
            } else if (!isFist && !isOneFinger && !isTwoFingers && !isThreeFingers) {
              gsap.to(pinchStrengthRef, {
                current: 0,
                duration: 0.5,
                ease: 'power2.out',
              });
                        isPinchingRef.current = false;
                        setInteractionState('IDLE');
                    }
                } else if (manualModeRef.current === 'gather') {
                  isPinchingRef.current = true;
                  pinchStrengthRef.current = 1;
                  setInteractionState('PINCHING');
                } else if (manualModeRef.current === 'scatter') {
                  isPinchingRef.current = false;
                  pinchStrengthRef.current = 0;
                  setInteractionState('IDLE');
                } else {
            // No hands
            gsap.to(pinchStrengthRef, {
              current: 0,
              duration: 0.5,
              ease: 'power2.out',
            });
                    isPinchingRef.current = false;
                    setInteractionState('IDLE');
                }
            });

            if (videoRef.current) {
          const CameraClass = getCamera();
          const phone = window.matchMedia('(max-width: 768px)').matches;
          cameraInstance = new CameraClass(videoRef.current, {
                    onFrame: async () => {
                        if (handsInstance && videoRef.current) {
                            await handsInstance.send({ image: videoRef.current });
                        }
                    },
                    width: phone ? 480 : 640,
                    height: phone ? 360 : 480,
                    facingMode: 'user',
                });
                await cameraInstance.start();
                if (isMounted) setCameraStatus('ACTIVE');
            }
        } catch (e: any) {
            console.error(e);
            if (isMounted) {
                setCameraStatus('ERROR');
          setErrorMessage('Camera access denied. Please allow camera permissions.');
            }
        }
    };

    initCamera();

    return () => {
        isMounted = false;
        if (handsInstance) handsInstance.close();
        if (cameraInstance) cameraInstance.stop();
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden" />
      <video ref={videoRef} className="hidden" playsInline muted />

      <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none sm:p-6">
        <div className="flex justify-between items-start gap-2 w-full">
            <div className="max-w-[68%] bg-black/55 backdrop-blur-md p-3 rounded-xl border border-white/10 sm:max-w-none sm:p-4">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-orange-400 sm:text-3xl">
                    生日快乐
                </h1>
                <p className="mt-1 text-[11px] tracking-[0.28em] text-amber-100/80 sm:text-xs sm:tracking-[0.35em]">十月十六</p>
                <p className="mt-2 text-xs text-gray-300 sm:hidden">握拳聚拢，张开散开</p>
                <div className="mt-2 hidden text-sm text-gray-300 font-mono sm:block">
                    <div className="flex items-center gap-2">
                <span className="text-xl">✊</span>
                <span>握拳聚成蛋糕并旋转</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl">🖐️</span>
                <span>张开手散成星尘</span>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10">
                <div className="text-xs text-gray-400 mb-1">手指数量：</div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">☝️</span>
                  <span>1根手指切换颜色</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl">✌️</span>
                  <span>2根手指撒花</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl">🤟</span>
                  <span>3根手指烟花</span>
                </div>
                    </div>
                </div>
            </div>

          <div className="flex shrink-0 flex-col gap-2 items-end">
            <div
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md font-bold text-[10px] tracking-wider shadow-lg sm:px-4 sm:py-2 sm:text-xs
                ${cameraStatus === 'ACTIVE' ? 'border-green-500/30 bg-green-900/30 text-green-400' : ''}
                ${cameraStatus === 'LOADING' ? 'border-blue-500/30 bg-blue-900/30 text-blue-400' : ''}
                ${cameraStatus === 'ERROR' ? 'border-red-500/30 bg-red-900/30 text-red-400' : ''}
              `}
            >
                <span className={`flex h-2.5 w-2.5 relative sm:h-3 sm:w-3`}>
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    cameraStatus === 'ACTIVE'
                      ? 'bg-green-400'
                      : cameraStatus === 'LOADING'
                      ? 'bg-blue-400'
                      : 'bg-red-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                    cameraStatus === 'ACTIVE'
                      ? 'bg-green-500'
                      : cameraStatus === 'LOADING'
                      ? 'bg-blue-500'
                      : 'bg-red-500'
                  }`}
                ></span>
                </span>
              {cameraStatus === 'LOADING'
                ? '打开中'
                : cameraStatus === 'ACTIVE'
                ? '摄像头'
                : '未授权'}
            </div>

            <div className="px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 backdrop-blur-md font-bold text-[10px] tracking-wider shadow-lg text-amber-200 sm:px-4 sm:py-2 sm:text-xs">
              {currentTheme}
            </div>
            </div>
        </div>

        <div
          className={`
            absolute left-1/2 top-auto bottom-24 -translate-x-1/2
            transition-all duration-500 ease-out pointer-events-none
            sm:bottom-auto sm:top-16
            ${interactionState === 'PINCHING' ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
        `}
        >
             <div className="whitespace-nowrap text-4xl font-black text-yellow-100 drop-shadow-[0_0_30px_rgba(255,215,0,0.8)] tracking-tighter mix-blend-screen sm:text-6xl">
                 生日快乐
             </div>
        </div>

        <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 sm:hidden">
          <button type="button" className="shrink-0 rounded-full border border-white/15 bg-black/60 px-3 py-2 text-xs" onClick={() => { commandRef.current = 'gather'; }}>聚成蛋糕</button>
          <button type="button" className="shrink-0 rounded-full border border-white/15 bg-black/60 px-3 py-2 text-xs" onClick={() => { commandRef.current = 'scatter'; }}>散成星尘</button>
          <button type="button" className="shrink-0 rounded-full border border-white/15 bg-black/60 px-3 py-2 text-xs" onClick={() => { commandRef.current = 'theme'; }}>换颜色</button>
          <button type="button" className="shrink-0 rounded-full border border-white/15 bg-black/60 px-3 py-2 text-xs" onClick={() => { commandRef.current = 'petals'; }}>撒花</button>
          <button type="button" className="shrink-0 rounded-full border border-white/15 bg-black/60 px-3 py-2 text-xs" onClick={() => { commandRef.current = 'fire'; }}>烟花</button>
        </div>

        {errorMessage && (
            <div className="self-center bg-red-950/90 text-white p-5 rounded-xl border border-red-500 shadow-2xl pointer-events-auto max-w-md text-center">
                <h3 className="font-bold text-lg mb-2">摄像头没打开</h3>
                <p className="text-red-200 mb-4 text-sm">请允许使用前置摄像头。也可以先用底部按钮玩。</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded transition-colors w-full font-bold"
                >
                    再试一次
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default GestureTree;
