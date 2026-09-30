"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import type { SceneStatus } from "./scene-boundary";

export default function OrbitalScene({
  paused,
  onStatus,
}: {
  paused: boolean;
  onStatus: (status: SceneStatus) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let rendererResource: THREE.WebGLRenderer | undefined;
    let sceneResource: THREE.Scene | undefined;
    let environmentResource: THREE.WebGLRenderTarget | undefined;
    let frame = 0;
    let stopped = false;
    const listeners: (() => void)[] = [];
    const dispose = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      listeners.forEach((remove) => remove());
      const materials = new Set<THREE.Material>();
      sceneResource?.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material];
          list.forEach((material) => materials.add(material));
        }
      });
      materials.forEach((material) => material.dispose());
      environmentResource?.dispose();
      rendererResource?.dispose();
      rendererResource?.domElement.remove();
    };
    const fallback = () => {
      host.dataset.ready = "false";
      onStatus("fallback");
      dispose();
    };
    onStatus("loading");
    try {
      // Graphics acceleration can be disabled by browser settings or GPU policy.
      // Use the animated CSS sculpture rather than throwing in that case.
      const canvas = document.createElement("canvas");
      const context =
        canvas.getContext("webgl2", {
          antialias: true,
          alpha: true,
          powerPreference: "default",
        }) || canvas.getContext("webgl2", { antialias: false, alpha: true });
      if (!context) {
        fallback();
        return dispose;
      }
      const renderer = new THREE.WebGLRenderer({ canvas, context });
      rendererResource = renderer;
      let shaderFailed = false;
      renderer.debug.onShaderError = () => {
        shaderFailed = true;
      };
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.45;
      host.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");
      const onContextLost = (event: Event) => {
        event.preventDefault();
        fallback();
      };
      canvas.addEventListener("webglcontextlost", onContextLost);
      listeners.push(() =>
        canvas.removeEventListener("webglcontextlost", onContextLost),
      );
      const scene = new THREE.Scene();
      sceneResource = scene;
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(0, 0, 10.5);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      try {
        const environment = pmrem.fromScene(room, 0.04);
        environmentResource = environment;
        scene.environment = environment.texture;
      } finally {
        room.dispose();
        pmrem.dispose();
      }

      const sculpture = new THREE.Group();
      sculpture.position.set(1.8, 0.15, 0);
      scene.add(sculpture);
      const silver = new THREE.MeshPhysicalMaterial({
        color: "#acafb9",
        metalness: 1,
        roughness: 0.15,
        envMapIntensity: 2.1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });
      const gold = new THREE.MeshPhysicalMaterial({
        color: "#c6a66b",
        metalness: 1,
        roughness: 0.23,
        envMapIntensity: 1.8,
        clearcoat: 1,
        clearcoatRoughness: 0.2,
      });
      const dark = new THREE.MeshPhysicalMaterial({
        color: "#18121f",
        metalness: 0.97,
        roughness: 0.16,
        clearcoat: 1,
        envMapIntensity: 1.4,
      });

      // Broad, bevelled elliptical ribbons give the orbital sculpture its silhouette.
      const ribbonProfile = new THREE.Shape();
      ribbonProfile.moveTo(-0.15, -0.1);
      ribbonProfile.lineTo(0.15, -0.1);
      ribbonProfile.quadraticCurveTo(0.23, -0.1, 0.23, -0.025);
      ribbonProfile.lineTo(0.23, 0.025);
      ribbonProfile.quadraticCurveTo(0.23, 0.1, 0.15, 0.1);
      ribbonProfile.lineTo(-0.15, 0.1);
      ribbonProfile.quadraticCurveTo(-0.23, 0.1, -0.23, 0.025);
      ribbonProfile.lineTo(-0.23, -0.025);
      ribbonProfile.quadraticCurveTo(-0.23, -0.1, -0.15, -0.1);
      const rings: THREE.Group[] = [];
      for (let i = 0; i < 3; i++) {
        const group = new THREE.Group();
        const points = Array.from({ length: 161 }, (_, index) => {
          const a = (index / 160) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(a) * (2.03 + i * 0.035),
            Math.sin(a) * 2.03,
            0,
          );
        });
        const curve = new THREE.CatmullRomCurve3(points, true);
        const extrusion = new THREE.ExtrudeGeometry(ribbonProfile, {
          steps: 220,
          bevelEnabled: false,
          extrudePath: curve,
          curveSegments: 8,
        });
        extrusion.deleteAttribute("normal");
        const geometry = mergeVertices(extrusion);
        geometry.computeVertexNormals();
        extrusion.dispose();
        const ribbon = new THREE.Mesh(geometry, i === 1 ? gold : silver);
        group.add(ribbon);
        const edge = new THREE.Mesh(
          new THREE.TorusGeometry(2.05, 0.017, 8, 160),
          i === 1 ? silver : gold,
        );
        edge.position.z = 0.13;
        group.add(edge);
        group.rotation.set(0.5 + i * 0.84, -0.45 + i * 0.8, i * 0.66);
        rings.push(group);
        sculpture.add(group);
      }
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92, 3), dark);
      sculpture.add(core);
      const coreOrbit = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.012, 8, 100),
        gold,
      );
      coreOrbit.rotation.set(1.1, 0.2, -0.3);
      sculpture.add(coreOrbit);

      const satellites = new THREE.Group();
      satellites.scale.setScalar(0.83);
      [
        [2.85, 0.75, 0.35, 0.12],
        [-2.2, -1.1, 0.65, 0.085],
        [0.75, 2.7, -0.5, 0.055],
      ].forEach(([x, y, z, r]) => {
        const satellite = new THREE.Mesh(
          new THREE.SphereGeometry(r, 20, 20),
          gold,
        );
        satellite.position.set(x, y, z);
        satellites.add(satellite);
      });
      sculpture.add(satellites);

      const keyLight = new THREE.DirectionalLight("#e4e1ff", 4);
      keyLight.position.set(-3, 5, 6);
      scene.add(keyLight);
      const goldLight = new THREE.PointLight("#ffcc8e", 22, 18, 2);
      goldLight.position.set(4, -1, 4);
      scene.add(goldLight);
      const violetLight = new THREE.PointLight("#7960f0", 25, 15, 2);
      violetLight.position.set(0, 2, -3);
      scene.add(violetLight);

      const positions = new Float32Array(110 * 3);
      for (let i = 0; i < 110; i++) {
        positions[i * 3] = Math.sin(i * 43.27) * 12;
        positions[i * 3 + 1] = Math.cos(i * 12.35) * 7;
        positions[i * 3 + 2] = -3 - (i % 8);
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      const particles = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
          color: "#c6b596",
          size: 0.014,
          transparent: true,
          opacity: 0.45,
        }),
      );
      scene.add(particles);

      const pointer = { x: 0, y: 0 };
      const smooth = { x: 0, y: 0 };
      let inView = true;
      let visible = !document.hidden;
      let time = 0;
      let last = 0;
      let narrow = false;
      let scrollProgress = 0;
      let drawable = false;
      let ready = false;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        drawable = width > 0 && height > 0;
        if (!drawable || stopped) return;
        narrow = width < 760;
        camera.aspect = width / height;
        camera.position.z = narrow ? 12.8 : 10.5;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      const onPointer = (event: PointerEvent) => {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      };
      const onScroll = () => {
        scrollProgress = Math.min(window.scrollY / window.innerHeight, 1.8);
      };
      const onVisibility = () => {
        visible = !document.hidden;
      };
      if (window.IntersectionObserver) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            inView = entry.isIntersecting;
          },
          { rootMargin: "100px" },
        );
        observer.observe(host);
        listeners.push(() => observer.disconnect());
      }
      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        listeners.push(() => resizeObserver.disconnect());
      }
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      listeners.push(
        () => window.removeEventListener("resize", resize),
        () => window.removeEventListener("pointermove", onPointer),
        () => window.removeEventListener("scroll", onScroll),
        () => document.removeEventListener("visibilitychange", onVisibility),
      );
      resize();
      onScroll();
      const render = (now: number) => {
        if (stopped) return;
        frame = requestAnimationFrame(render);
        const delta = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (!inView || !visible || !drawable) return;
        const moving = !pausedRef.current && !reduced.matches;
        if (moving) {
          time += delta;
          smooth.x += (pointer.x - smooth.x) * 0.035;
          smooth.y += (pointer.y - smooth.y) * 0.035;
        }
        sculpture.position.x = narrow ? 0.2 : 1.8 - scrollProgress * 1.3;
        camera.position.z = narrow
          ? 12.8
          : 10.5 - (reduced.matches ? 0 : Math.min(scrollProgress, 0.8) * 2.6);
        sculpture.position.y =
          (narrow ? -0.4 : 0.15) + Math.sin(time * 0.4) * 0.08;
        sculpture.rotation.set(
          0.12 + smooth.y * 0.1 + scrollProgress * 0.22,
          -0.3 + smooth.x * 0.15 + time * 0.08,
          -0.22 + scrollProgress * 0.12,
        );
        rings[0].rotation.y = -0.45 + Math.sin(time * 0.13) * 0.28;
        rings[1].rotation.z = 0.66 + Math.sin(time * 0.16) * 0.18;
        satellites.rotation.z = time * 0.055;
        core.rotation.y = time * 0.09;
        particles.rotation.z = time * 0.004;
        try {
          if (context.isContextLost()) {
            fallback();
            return;
          }
          renderer.render(scene, camera);
          if (shaderFailed) {
            fallback();
            return;
          }
          if (!ready) {
            ready = true;
            host.dataset.ready = "true";
            onStatus("ready");
          }
        } catch {
          fallback();
        }
      };
      frame = requestAnimationFrame(render);
    } catch {
      fallback();
    }
    return dispose;
  }, [onStatus]);

  return (
    <div ref={container} className="uv-orbital-canvas" aria-hidden="true" />
  );
}
