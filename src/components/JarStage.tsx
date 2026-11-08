"use client";

import { RefObject, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createJar, makeEnv } from "@/lib/iqooModels";
import { ITEMS } from "@/lib/jarItems";
import { useInView } from "@/lib/useInView";

/*
 * Every jar is drawn into ONE canvas that covers the whole grid, one viewport per jar.
 * Phones allow only about 8 live WebGL contexts, so a canvas per jar makes the browser
 * kill the oldest ones and they show up as broken tiles.
 */

const JAR_BASE_Y = -0.3;
const DIMMED_EXPOSURE = 0.35;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface JarStageProps {
  containerRef: RefObject<HTMLDivElement | null>;
  selectedIds: string[];
  dimUnselected: boolean;
  hoveredRef: RefObject<string | null>;
  onReady: () => void;
}

function Jars({
  containerRef,
  selectedIds,
  dimUnselected,
  hoveredRef,
  onReady,
}: JarStageProps) {
  const { gl, scene } = useThree();
  const rects = useRef(new Map<string, Rect>());
  const hasDrawn = useRef(false);

  const jars = useMemo(
    () =>
      ITEMS.map((item) => {
        const spin = new THREE.Group();
        spin.add(createJar(item));
        const outer = new THREE.Group();
        outer.position.y = JAR_BASE_Y;
        outer.rotation.x = 0.1;
        outer.visible = false;
        outer.add(spin);
        return {
          id: item.id,
          outer,
          spin,
          // Stagger so neighbouring jars don't turn in lockstep
          angle: (item.name.length * 0.73) % (Math.PI * 2),
        };
      }),
    []
  );

  useEffect(() => {
    scene.environment = makeEnv(gl);
    jars.forEach((jar) => scene.add(jar.outer));
    return () => {
      jars.forEach((jar) => scene.remove(jar.outer));
    };
  }, [gl, scene, jars]);

  // Each jar's viewport follows the layout of its grid cell
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cells = Array.from(
      container.querySelectorAll<HTMLElement>("[data-jar-cell]")
    );
    const measure = () => {
      const origin = container.getBoundingClientRect();
      cells.forEach((cell) => {
        const box = cell.getBoundingClientRect();
        rects.current.set(cell.dataset.jarCell as string, {
          left: box.left - origin.left,
          top: box.top - origin.top,
          width: box.width,
          height: box.height,
        });
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    cells.forEach((cell) => observer.observe(cell));
    return () => observer.disconnect();
  }, [containerRef]);

  // Positive priority: this replaces R3F's own single full-canvas render
  useFrame((state, delta) => {
    const { gl: renderer } = state;
    const camera = state.camera as THREE.PerspectiveCamera;
    const dt = Math.min(delta, 0.1);

    renderer.setScissorTest(true);
    for (const jar of jars) {
      const rect = rects.current.get(jar.id);
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;

      const isHovered = hoveredRef.current === jar.id;
      const isSelected = selectedIds.includes(jar.id);

      jar.angle += dt * (isHovered ? 2.4 : isSelected ? 1.2 : 0.85);
      jar.spin.rotation.y = jar.angle;

      const lift = isHovered ? 0.08 : isSelected ? 0.05 : 0;
      jar.outer.position.y += (JAR_BASE_Y + lift - jar.outer.position.y) * 0.14;
      const targetScale = isHovered ? 1.06 : 1;
      jar.outer.scale.setScalar(
        jar.outer.scale.x + (targetScale - jar.outer.scale.x) * 0.14
      );

      // WebGL's origin is the bottom-left corner, the DOM's is the top-left
      const y = state.size.height - rect.top - rect.height;
      renderer.setViewport(rect.left, y, rect.width, rect.height);
      renderer.setScissor(rect.left, y, rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();

      renderer.toneMappingExposure =
        dimUnselected && !isSelected ? DIMMED_EXPOSURE : 1;

      jar.outer.visible = true;
      renderer.render(scene, camera);
      jar.outer.visible = false;
    }
    renderer.setScissorTest(false);

    if (!hasDrawn.current && rects.current.size > 0) {
      hasDrawn.current = true;
      onReady();
    }
  }, 1);

  return (
    <>
      <hemisphereLight args={[0xffffff, 0x443322, 1.2]} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} />
      {/* Overhead light for the lid label */}
      <directionalLight position={[0, 4, 1.5]} intensity={2.6} color="#fff6e0" />
      {/* Warm fill for the sweets behind the glass */}
      <pointLight position={[0, 1, 2]} intensity={1.6} color="#ffeaa7" />
      {/* Side lights for the gold rim */}
      <pointLight position={[-1.8, 1, 1]} intensity={1.4} color="#e6bf5a" />
      <pointLight position={[1.8, 1, -1]} intensity={1.0} color="#f2b31e" />
    </>
  );
}

export default function JarStage(props: JarStageProps) {
  const inView = useInView(props.containerRef, "120px");

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none" aria-hidden="true">
      <Canvas
        // R3F sets pointer-events:auto on its own wrapper. This canvas sits over the jar
        // buttons, so without this override it swallows every tap meant for them.
        style={{ pointerEvents: "none" }}
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 0.98, 2.1], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        onCreated={({ camera }) => camera.lookAt(0, 0.02, 0)}
      >
        <Jars {...props} />
      </Canvas>
    </div>
  );
}
