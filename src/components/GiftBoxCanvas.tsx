"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createGiftBox, makeEnv, addDefaultLights } from "@/lib/iqooModels";
import { useInView } from "@/lib/useInView";
import { JarItem, SlotSelection } from "@/types/gift";

const BOX_GROUP_Y = -0.45;
const MIN_PITCH = -0.12;
const MAX_PITCH = 0.38;

// Outermost corners of the box with its lid fully open, in model space
const BOX_CORNERS = [-1, 1].flatMap((side) =>
  [
    [1.6, 0, 1.3],
    [1.6, 0, -1.3],
    [1.65, 0.98, 1.35],
    [1.65, 3.26, -2.28],
    [1.65, 3.19, -2.45],
  ].map(([x, y, z]) => new THREE.Vector3(x * side, y, z))
);

// Everywhere those corners can reach as the box spins and is dragged
const BOX_SWEEP = BOX_CORNERS.flatMap((corner) =>
  [MIN_PITCH, MAX_PITCH].flatMap((pitch) =>
    Array.from({ length: 24 }, (_, step) => {
      const yaw = (step / 24) * Math.PI * 2;
      const point = corner.clone().applyEuler(new THREE.Euler(pitch, yaw, 0, "XYZ"));
      point.y += BOX_GROUP_Y;
      return point;
    })
  )
);

/** Moves the camera as close as it can get with no part of the box ever leaving the frame. */
function fitBoxCamera(camera: THREE.PerspectiveCamera, aspect: number) {
  const VIEW_Y = 0.471; // direction from the target to the camera
  const VIEW_Z = 0.882;
  const MARGIN = 1.05;
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const tanH = tanV * aspect;

  const fits = (targetY: number, distance: number) =>
    BOX_SWEEP.every((point) => {
      const dy = point.y - targetY;
      const depth = distance - (dy * VIEW_Y + point.z * VIEW_Z);
      const up = dy * VIEW_Z - point.z * VIEW_Y;
      return (
        depth > 0 &&
        (Math.abs(up) * MARGIN) / depth <= tanV &&
        (Math.abs(point.x) * MARGIN) / depth <= tanH
      );
    });

  let bestDistance = Infinity;
  let bestTarget = 0;
  for (let targetY = 0.2; targetY <= 1.8; targetY += 0.1) {
    let near = 3;
    let far = 40;
    if (!fits(targetY, far)) continue;
    for (let i = 0; i < 14; i++) {
      const mid = (near + far) / 2;
      if (fits(targetY, mid)) far = mid;
      else near = mid;
    }
    if (far < bestDistance) {
      bestDistance = far;
      bestTarget = targetY;
    }
  }

  camera.position.set(
    0,
    bestTarget + bestDistance * VIEW_Y,
    bestDistance * VIEW_Z
  );
  camera.lookAt(0, bestTarget, 0);
}

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

  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) return;
    fitBoxCamera(camera as THREE.PerspectiveCamera, size.width / size.height);
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

    // Limits match the sweep the camera is fitted to, so dragging can't push the box out of frame
    const clampedX = Math.max(MIN_PITCH, Math.min(MAX_PITCH, dragRotation.current.x));
    dragRotation.current.x = clampedX;

    // Apply rotation
    groupRef.current.rotation.x = clampedX;
    groupRef.current.rotation.y = dragRotation.current.y;
  });

  return (
    <group ref={groupRef} position={[0, BOX_GROUP_Y, 0]}>
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
  className = "w-full h-[300px] sm:h-[400px] md:h-[480px]",
}: GiftBoxCanvasProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, "120px");
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

  // With pan-y the browser cancels the pointer when a swipe turns into a page scroll,
  // and that must not count as a tap on the box.
  const onPointerCancel = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={`relative select-none cursor-pointer ${className}`}
      style={{ touchAction: "pan-y" }}
      title={isOpen ? "Click to close lid or drag to rotate" : "Click to open lid or drag to rotate"}
    >
      <Canvas
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 4.0, 6.2], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
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
