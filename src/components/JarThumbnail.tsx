"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createJar, makeEnv, addDefaultLights } from "@/lib/iqooModels";
import { JarItem } from "@/types/gift";

function JarSceneSetup() {
  const { gl, scene } = useThree();

  useEffect(() => {
    let envTex: THREE.Texture | null = null;
    try {
      envTex = makeEnv(gl);
      scene.environment = envTex;
      addDefaultLights(scene);
    } catch (e) {
      console.warn("Could not setup jar env:", e);
    }
    return () => {
      if (envTex) envTex.dispose();
    };
  }, [gl, scene]);

  return null;
}

interface JarModelProps {
  item: JarItem;
  isHovered: boolean;
  isSelected: boolean;
}

function JarModel({ item, isHovered, isSelected }: JarModelProps) {
  const outerRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  // Stagger initial rotation so adjacent jars start from different angles
  const rotY = useRef((item.name.length * 0.73) % (Math.PI * 2));

  const jarGroup = useMemo(() => {
    return createJar(item);
  }, [item]);

  useEffect(() => {
    const currentJar = jarGroup;
    return () => {
      if (currentJar) {
        currentJar.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const mat = mesh.material;
            if (Array.isArray(mat)) {
              mat.forEach((m) => {
                (m as THREE.MeshStandardMaterial).map?.dispose();
                m.dispose();
              });
            } else if (mat) {
              (mat as THREE.MeshStandardMaterial).map?.dispose();
              mat.dispose();
            }
          }
        });
      }
    };
  }, [jarGroup]);

  // Continuous smooth spin animation loop
  useFrame((_, delta) => {
    if (!spinRef.current) return;
    const dt = Math.min(delta, 0.1);
    // Faster spin when hovered, steady continuous majestic spin at all times
    const speed = isHovered ? 2.4 : isSelected ? 1.2 : 0.85;
    rotY.current += dt * speed;
    spinRef.current.rotation.y = rotY.current;

    // Smooth subtle floating lift when selected or hovered
    if (outerRef.current) {
      const targetY = isSelected ? 0.05 : isHovered ? 0.08 : 0;
      outerRef.current.position.y += (targetY - outerRef.current.position.y) * 0.14;
    }
  });

  return (
    // Center jar vertically around origin (jar height is ~0.7, so y = -0.35 places center at 0)
    // Tilted forward slightly (0.12 rad) so the top circular mandala lid directly faces the camera!
    <group ref={outerRef} position={[0, -0.35, 0]} rotation={[0.12, 0, 0]}>
      {/* spinRef continuously spins the jar around its vertical cylinder axis */}
      <group ref={spinRef}>
        <primitive object={jarGroup} />
      </group>
    </group>
  );
}

interface JarThumbnailProps {
  item: JarItem;
  isSelected: boolean;
  disabled: boolean;
  onClick: (e: React.MouseEvent) => void;
  slotNumber?: number;
}

export default function JarThumbnail({
  item,
  isSelected,
  disabled,
  onClick,
}: JarThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !isSelected}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      aria-label={`${item.name}${isSelected ? " (In your box, click to remove)" : ""}`}
      className={`relative group flex flex-col items-center justify-end transition-all duration-300 w-full max-w-[85px] sm:max-w-[130px] flex-shrink-0 text-center select-none outline-none cursor-pointer pt-6 ${
        disabled && !isSelected ? "opacity-35 cursor-not-allowed" : "hover:scale-[1.06]"
      }`}
    >
      {/* "In your box" Golden Badge with downward pointer (Matching Reference Image) */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none transition-all duration-300 ${
          isSelected
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-2"
        }`}
      >
        <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full bg-[#f2b31e] text-[#1a1200] font-body text-[9px] sm:text-[10px] font-bold tracking-tight shadow-md whitespace-nowrap">
          In your box
        </span>
        {/* Downward pointer triangle pointing right to jar top lid */}
        <span className="w-0 h-0 border-l-[3px] sm:border-l-[4px] border-l-transparent border-r-[3px] sm:border-r-[4px] border-r-transparent border-t-[4px] sm:border-t-[5px] border-t-[#f2b31e] -mt-[1px]" />
      </div>

      {/* 3D Jar Canvas: Elevated angle + Environment Map for shiny 24K gold and glass (Never cut off) */}
      <div className="relative w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 flex items-center justify-center pointer-events-none">
        {/* Gold radiant glow halo behind selected jar */}
        {isSelected && (
          <div
            className="absolute inset-0 rounded-full blur-xl pointer-events-none animate-pulse"
            style={{
              background:
                "radial-gradient(circle, rgba(242, 179, 30, 0.45) 0%, rgba(230, 191, 90, 0.2) 50%, transparent 75%)",
            }}
          />
        )}

        {mounted && (
          <Canvas
            frameloop="always"
            camera={{ position: [0, 1.5, 2.05], fov: 36 }}
            gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
            dpr={[1, 1.5]}
            onCreated={({ camera }) => {
              // Look directly at origin where the center of the jar is placed
              camera.lookAt(0, -0.05, 0);
            }}
          >
            {/* Required environment map for shiny gold and glass materials */}
            <JarSceneSetup />

            {/* Key overhead light to illuminate the top circular label & mandala */}
            <directionalLight position={[0, 4, 1.5]} intensity={2.6} color="#fff6e0" />
            {/* Front golden fill for candies inside transparent glass */}
            <pointLight position={[0, 1, 2]} intensity={1.6} color="#ffeaa7" />
            {/* Side rim lights to highlight the spinning gold rim */}
            <pointLight position={[-1.8, 1, 1]} intensity={1.4} color="#e6bf5a" />
            <pointLight position={[1.8, 1, -1]} intensity={1.0} color="#f2b31e" />

            <JarModel item={item} isHovered={isHovered} isSelected={isSelected} />
          </Canvas>
        )}
      </div>

      {/* Item Name (Clean font, responsive text, matching Reference Image) */}
      <span
        className={`font-body text-[10px] sm:text-xs md:text-sm tracking-wide mt-1 sm:mt-1.5 leading-tight line-clamp-2 max-w-[80px] sm:max-w-none transition-colors ${
          isSelected
            ? "text-gold font-medium drop-shadow-[0_0_8px_rgba(242,179,30,0.5)]"
            : disabled
            ? "text-fg/40"
            : "text-fg/80 group-hover:text-gold"
        }`}
      >
        {item.name}
      </span>
    </button>
  );
}
