"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createQLogo, makeEnv, addDefaultLights } from "@/lib/iqooModels";

function SetupScene() {
  const { gl, scene } = useThree();

  useEffect(() => {
    let envTexture: THREE.Texture | null = null;
    try {
      envTexture = makeEnv(gl);
      scene.environment = envTexture;
      addDefaultLights(scene);
    } catch (err) {
      console.error("Error setting up 3D environment:", err);
    }

    return () => {
      if (envTexture) {
        envTexture.dispose();
      }
    };
  }, [gl, scene]);

  return null;
}

interface QModelProps {
  pointerRef: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  reducedMotion: boolean;
}

function QModel({ pointerRef, reducedMotion }: QModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const qGroup = useMemo(() => createQLogo({ color: 0xf2b31e, depth: 0.55 }), []);

  useEffect(() => {
    const currentQ = qGroup;
    return () => {
      if (currentQ) {
        currentQ.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else if (mesh.material) {
              mesh.material.dispose();
            }
          }
        });
      }
    };
  }, [qGroup]);

  // Smooth rotation, tilt, and entrance scale state
  const rotY = useRef(0);
  const currentTilt = useRef({ x: 0, y: 0 });
  const scale = useRef(0.85);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const dt = Math.min(delta, 0.1);

    // Smooth cinematic zoom-in entrance
    if (scale.current < 0.999) {
      scale.current += (1.0 - scale.current) * Math.min(1, dt * 7);
      groupRef.current.scale.setScalar(scale.current);
    }

    // Dynamic majestic rotation (0.72 rad/s for lively, engaging spin)
    if (!reducedMotion) {
      rotY.current += dt * 0.72;
    }

    // Target tilt from mouse/touch pointer (-1 to +1)
    const targetTiltX = -pointerRef.current.y * 0.45;
    const targetTiltY = pointerRef.current.x * 0.55;

    // Snappy responsive lerp damping
    const lerpFactor = 1 - Math.exp(-dt * 10);
    currentTilt.current.x += (targetTiltX - currentTilt.current.x) * lerpFactor;
    currentTilt.current.y += (targetTiltY - currentTilt.current.y) * lerpFactor;

    // Apply rotation: continuous Y spin + interactive tilt on X & Y
    groupRef.current.rotation.x = currentTilt.current.x;
    groupRef.current.rotation.y = rotY.current + currentTilt.current.y;
    // Subtle breathing float on Z
    groupRef.current.position.y = Math.sin(rotY.current * 1.5) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <primitive object={qGroup} />
    </group>
  );
}

export default function HeroQCanvas() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Global mouse / touch movement listener over the hero area
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Normalize to [-1, 1] relative to viewport center
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      pointerRef.current = { x, y, active: true };
    };

    const handlePointerLeave = () => {
      pointerRef.current = { x: 0, y: 0, active: false };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
      >
        <SetupScene />

        {/* Warm Diwali ambient & accent lights */}
        <ambientLight intensity={0.4} />
        {/* Warm golden key light */}
        <directionalLight position={[3, 5, 4]} intensity={2.6} color="#ffe8aa" />
        {/* Warm amber rim light for dramatic sparkle */}
        <pointLight position={[-4, -2, 3]} intensity={2.8} color="#f2b31e" distance={12} />
        {/* Soft cool fill from opposite side */}
        <pointLight position={[0, -3, -2]} intensity={1.2} color="#1630a8" distance={8} />

        <QModel pointerRef={pointerRef} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

