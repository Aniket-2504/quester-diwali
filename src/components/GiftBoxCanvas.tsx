"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createGiftBox, makeEnv, addDefaultLights } from "@/lib/iqooModels";
import { JarItem, SlotSelection } from "@/types/gift";

interface SceneSetupProps {
  onEnvReady?: () => void;
}

function SceneSetup({ onEnvReady }: SceneSetupProps) {
  const { gl, scene, camera, size } = useThree();

  useEffect(() => {
    let envTexture: THREE.Texture | null = null;
    try {
      envTexture = makeEnv(gl);
      scene.environment = envTexture;
      addDefaultLights(scene);
      onEnvReady?.();
    } catch (e) {
      console.error("Error setting up GiftBox 3D environment:", e);
    }

    return () => {
      if (envTexture) envTexture.dispose();
    };
  }, [gl, scene, onEnvReady]);

  // Dynamically tune camera position and FOV based on screen width/height
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const isMobile = size.width < 640;

    // In portrait / narrow mobile screens, pull camera back so the open lid and wide marble sides never cut off
    if (aspect < 1.0 || isMobile) {
      camera.position.set(0, 4.4, 7.2);
      camera.lookAt(0, 0.9, 0);
    } else if (aspect < 1.4) {
      camera.position.set(0, 4.1, 6.4);
      camera.lookAt(0, 0.8, 0);
    } else {
      camera.position.set(0, 3.8, 5.8);
      camera.lookAt(0, 0.75, 0);
    }
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

interface BoxModelProps {
  selectedSlots: SlotSelection;
  isOpen: boolean;
  interactive?: boolean;
  greeting?: [string, string];
  reducedMotion: boolean;
  dragRotation: React.MutableRefObject<{ x: number; y: number; vx: number; vy: number }>;
  onToggleOpen?: () => void;
}

function BoxModel({
  selectedSlots,
  isOpen,
  reducedMotion,
  greeting,
  dragRotation,
  onToggleOpen,
}: BoxModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const prevSlotsRef = useRef<(JarItem | null)[]>([null, null, null, null, null, null]);
  const prevOpenRef = useRef<boolean>(isOpen);

  // Memoize greeting by value to prevent unnecessary re-creation of boxGroup on re-renders
  const greetingKey = greeting ? greeting.join("::") : "";
  const boxGroup = useMemo(() => {
    return createGiftBox(greeting ? { greeting } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greetingKey]);

  useEffect(() => {
    const currentBox = boxGroup;
    return () => {
      if (currentBox) {
        currentBox.traverse((child) => {
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
  }, [boxGroup]);

  // Initial population of jars when boxGroup is created
  useEffect(() => {
    if (!boxGroup?.userData) return;
    boxGroup.userData.open(isOpen);

    // Populate jars (instant if closed, animated if opened)
    selectedSlots.forEach((item, slotIndex) => {
      if (item) {
        boxGroup.userData.putJar(slotIndex, item, !isOpen);
      }
    });

    prevSlotsRef.current = [...selectedSlots];
    prevOpenRef.current = isOpen;
  }, [boxGroup]); // Only on boxGroup creation

  // When isOpen toggles: if newly opened, drop jars in from upwards!
  useEffect(() => {
    if (!boxGroup?.userData) return;
    boxGroup.userData.open(isOpen);

    // If newly opened, trigger jars dropping from upwards
    if (isOpen && !prevOpenRef.current) {
      selectedSlots.forEach((item, slotIndex) => {
        if (item) {
          boxGroup.userData.putJar(slotIndex, item, false);
        }
      });
    }

    prevOpenRef.current = isOpen;
  }, [boxGroup, isOpen, selectedSlots]);

  // Sync jars with slot state changes
  useEffect(() => {
    if (!boxGroup?.userData) return;

    selectedSlots.forEach((item, slotIndex) => {
      const prevItem = prevSlotsRef.current[slotIndex];

      if (item && item.id !== prevItem?.id) {
        // Drop in the new jar from upwards
        boxGroup.userData.putJar(slotIndex, item, false);
      } else if (!item && prevItem) {
        // Remove the jar
        boxGroup.userData.removeJar(slotIndex);
      }
    });

    prevSlotsRef.current = [...selectedSlots];
  }, [boxGroup, selectedSlots]);

  // Animation frame loop
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    // Update box internal animations (lid hinge + jar drops)
    if (boxGroup?.userData?.update) {
      boxGroup.userData.update(dt);
    }

    if (!groupRef.current) return;

    // Apply inertia damping to drag rotation
    dragRotation.current.x += dragRotation.current.vx;
    dragRotation.current.y += dragRotation.current.vy;
    dragRotation.current.vx *= 0.92;
    dragRotation.current.vy *= 0.92;

    // Continuous slow idle rotation when not dragging
    if (!reducedMotion && Math.abs(dragRotation.current.vy) < 0.001) {
      dragRotation.current.y += dt * 0.16;
    }

    // Clamp X pitch rotation so the box doesn't flip upside down
    const clampedX = Math.max(-0.35, Math.min(0.55, dragRotation.current.x));
    dragRotation.current.x = clampedX;

    // Apply rotation
    groupRef.current.rotation.x = clampedX;
    groupRef.current.rotation.y = dragRotation.current.y;
  });

  return (
    <group ref={groupRef} position={[0, -0.45, 0]}>
      <primitive object={boxGroup} />
    </group>
  );
}

interface GiftBoxCanvasProps {
  selectedSlots: SlotSelection;
  isOpen: boolean;
  onToggleOpen?: () => void;
  greeting?: [string, string];
  interactive?: boolean;
  className?: string;
}

export default function GiftBoxCanvas({
  selectedSlots,
  isOpen,
  onToggleOpen,
  greeting,
  interactive = true,
  className = "w-full h-[320px] sm:h-[400px] md:h-[480px]",
}: GiftBoxCanvasProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0, time: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });
  const dragRotation = useRef({ x: 0.18, y: -0.32, vx: 0, vy: 0 });
  const lastToggleTime = useRef(0);

  const safeToggleOpen = useCallback(() => {
    const now = Date.now();
    if (now - lastToggleTime.current < 450) return;
    lastToggleTime.current = now;
    onToggleOpen?.();
  }, [onToggleOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Pointer drag event handlers for rotating the 3D box
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive) return;
      isDragging.current = true;
      pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      lastPointer.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    },
    [interactive]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !interactive) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      dragRotation.current.vy = dx * 0.006;
      dragRotation.current.vx = dy * 0.006;
    },
    [interactive]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging.current && interactive) {
        const moveDist = Math.hypot(
          e.clientX - pointerStart.current.x,
          e.clientY - pointerStart.current.y
        );
        const elapsed = Date.now() - pointerStart.current.time;

        // If moved less than 10px and released within 450ms, it's a click -> toggle open safely!
        if (moveDist < 10 && elapsed < 450) {
          safeToggleOpen();
        }
      }

      isDragging.current = false;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    },
    [interactive, safeToggleOpen]
  );

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`relative select-none cursor-pointer ${className}`}
      style={{ touchAction: "none" }}
      title={isOpen ? "Click to close lid or drag to rotate" : "Click to open lid or drag to rotate"}
    >
      <Canvas
        camera={{ position: [0, 4.0, 6.2], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <SceneSetup />

        {/* Cinematic festive lighting tuned for marble + gold box */}
        <ambientLight intensity={0.45} />
        {/* Soft overhead warm golden spot */}
        <spotLight
          position={[0, 6, 2]}
          intensity={3.2}
          color="#fff1d0"
          angle={0.65}
          penumbra={0.8}
        />
        {/* Golden rim light from side */}
        <pointLight position={[4, 2, 3]} intensity={2.2} color="#e6bf5a" distance={10} />
        {/* Deep blue velvet accent fill */}
        <pointLight position={[-4, 1, -2]} intensity={1.8} color="#1630a8" distance={10} />
        {/* Subtle ground reflection bounce */}
        <directionalLight position={[0, -2, 2]} intensity={0.6} color="#e6bf5a" />

        <BoxModel
          selectedSlots={selectedSlots}
          isOpen={isOpen}
          reducedMotion={reducedMotion}
          greeting={greeting}
          dragRotation={dragRotation}
          interactive={interactive}
          onToggleOpen={onToggleOpen}
        />
      </Canvas>
    </div>
  );
}
