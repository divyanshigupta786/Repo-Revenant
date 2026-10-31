'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Activity, RefreshCw } from 'lucide-react';

export default function ResurrectionCore3D() {
  const containerRef = useRef(null);
  const [isResurrected, setIsResurrected] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      setWebGLSupported(false);
      setIsLoading(false);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080a0f, 0.05);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x080a0f, 0);
    container.appendChild(renderer.domElement);
    setIsLoading(false);

    // Subtle Lighting
    const ambientLight = new THREE.AmbientLight(0x163e3a, 1.2);
    scene.add(ambientLight);

    const pointLightTeal = new THREE.PointLight(0x68f0d0, 2.5, 20);
    pointLightTeal.position.set(3, 4, 3);
    scene.add(pointLightTeal);

    const pointLightCyan = new THREE.PointLight(0x80d8ff, 1.8, 15);
    pointLightCyan.position.set(-4, -2, 2);
    scene.add(pointLightCyan);

    // Group for entire Resurrection Core
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Recovered Core: Icosahedron Wireframe + Inner Glow
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x68f0d0,
      emissive: 0x163e3a,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    const innerCoreGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x80d8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    coreGroup.add(innerCoreMesh);

    // 2. Interconnected Nodes & Fragmented Data Blocks
    const nodeCount = 36;
    const nodeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x80d8ff,
      emissive: 0x171d27,
      roughness: 0.3,
    });

    const nodes = [];
    const basePositions = [];
    const fragmentedPositions = [];

    for (let i = 0; i < nodeCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.4 + (Math.random() - 0.5) * 0.4;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      basePositions.push(new THREE.Vector3(x, y, z));
      // Fragmented positions scatter further out
      const scatterFactor = 1.6 + Math.random() * 0.8;
      fragmentedPositions.push(new THREE.Vector3(x * scatterFactor, y * scatterFactor, z * scatterFactor));

      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.copy(fragmentedPositions[i]);
      coreGroup.add(mesh);
      nodes.push(mesh);
    }

    // 3. Line Connections between nodes
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x68f0d0,
      transparent: true,
      opacity: 0.25,
    });

    const linePositions = [];
    // Connect neighboring nodes
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (basePositions[i].distanceTo(basePositions[j]) < 1.5) {
          linePositions.push(
            nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
            nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
          );
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    coreGroup.add(lineSegments);

    // 4. Fine Spectral Particles
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particleCoords = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particleCoords[i] = (Math.random() - 0.5) * 8;
      particleCoords[i + 1] = (Math.random() - 0.5) * 8;
      particleCoords[i + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particleCoords, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x68f0d0,
      size: 0.04,
      transparent: true,
      opacity: 0.4,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Mouse parallax tracking
    let targetRotationX = 0;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / height) * 2 - 1);
      targetRotationY = mouseX * 0.4;
      targetRotationX = mouseY * 0.3;
    };

    container.addEventListener('mousemove', handleMouseMove);

    // Animation Loop with Visibility & Intersection Handling
    let animationFrameId;
    let isVisible = true;

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);

    let progress = 0; // 0 = fragmented, 1 = resurrected

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible || document.hidden) return;

      // Smooth transition between fragmented and resurrected states
      const targetProgress = isResurrected ? 1.0 : 0.0;
      progress += (targetProgress - progress) * 0.05;

      for (let i = 0; i < nodeCount; i++) {
        nodes[i].position.lerpVectors(fragmentedPositions[i], basePositions[i], progress);
      }

      // Update lines based on new node positions
      const positions = lineGeometry.attributes.position.array;
      let ptr = 0;
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          if (basePositions[i].distanceTo(basePositions[j]) < 1.5) {
            positions[ptr++] = nodes[i].position.x;
            positions[ptr++] = nodes[i].position.y;
            positions[ptr++] = nodes[i].position.z;
            positions[ptr++] = nodes[j].position.x;
            positions[ptr++] = nodes[j].position.y;
            positions[ptr++] = nodes[j].position.z;
          }
        }
      }
      lineGeometry.attributes.position.needsUpdate = true;
      lineMaterial.opacity = 0.15 + progress * 0.45;

      // Core rotation & pulsing
      if (!prefersReducedMotion) {
        coreGroup.rotation.y += 0.004;
        coreGroup.rotation.x += 0.002;
        coreGroup.rotation.y += (targetRotationY - coreGroup.rotation.y) * 0.05;
        coreGroup.rotation.x += (targetRotationX - coreGroup.rotation.x) * 0.05;

        innerCoreMesh.rotation.y -= 0.008;
        particleSystem.rotation.y += 0.0008;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup resources
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerCoreGeo.dispose();
      innerCoreMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [isResurrected]);

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] flex items-center justify-center rounded-2xl bg-[#0B0E14] border border-[#202735] overflow-hidden group">
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* WebGL Fallback if unsupported */}
      {!webGLSupported && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0B0E14]">
          <div className="w-16 h-16 rounded-full bg-[#171D27] border border-[#293140] flex items-center justify-center mb-4 text-[#68F0D0]">
            <Activity className="w-8 h-8" />
          </div>
          <h4 className="font-display font-bold text-lg text-[#F0F2F5] mb-2">
            Archival Core [Static Telemetry Mode]
          </h4>
          <p className="text-sm text-[#A4ADBB] max-w-sm">
            WebGL acceleration is unavailable in this environment. The repository forensic engine remains fully functional via direct terminal analysis.
          </p>
        </div>
      )}

      {/* Floating Interactive Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-[#080A0F]/90 backdrop-blur-md border border-[#293140] pointer-events-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isResurrected ? 'bg-[#69D99A]' : 'bg-[#F0B86A] animate-pulse'}`} />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#F0F2F5]">
            {isResurrected ? 'State: Resurrected Core' : 'State: Fragmented Archive'}
          </span>
        </div>

        <button
          onClick={() => setIsResurrected(!isResurrected)}
          className="pointer-events-auto px-3 py-1.5 rounded-lg bg-[#11151D]/90 hover:bg-[#171D27] backdrop-blur-md border border-[#293140] hover:border-[#68F0D0] text-[#68F0D0] text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer shadow-lg"
          title="Toggle between decayed and resurrected repository states"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isResurrected ? 'Simulate Decay' : 'Simulate Resurrection'}</span>
        </button>
      </div>

      {/* Corner Telemetry Watermark */}
      <div className="absolute top-4 right-4 text-right pointer-events-none">
        <span className="text-[10px] font-mono tracking-widest text-[#717C8D] uppercase block">
          SPECTRAL NODE GRAPH
        </span>
        <span className="text-[11px] font-mono text-[#80D8FF] block">
          36 NODES • 74 EDGES
        </span>
      </div>
    </div>
  );
}
