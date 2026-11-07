import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface IslandLandmark3DProps {
  type: 'chest' | 'mushroom' | 'gate';
  size?: number;
  isOpen?: boolean;
}

export const IslandLandmark3D: React.FC<IslandLandmark3DProps> = ({
  type = 'chest',
  size = 140,
  isOpen = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = size;
    const height = size;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(2.4, 2.0, 3.2);
    camera.lookAt(0, 0.3, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xb0bec5, 1.0);
    scene.add(ambLight);

    const landmarkGroup = new THREE.Group();
    scene.add(landmarkGroup);

    let lidGroup: THREE.Group | null = null;

    if (type === 'chest') {
      // 1. Treasure Chest Base
      const baseGeo = new THREE.BoxGeometry(1.2, 0.6, 0.8);
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d5b2d, roughness: 0.6 });
      const baseMesh = new THREE.Mesh(baseGeo, woodMat);
      baseMesh.position.y = 0.3;
      landmarkGroup.add(baseMesh);

      // Gold Brackets
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
      const trimGeo = new THREE.BoxGeometry(1.24, 0.12, 0.84);
      const trimMesh = new THREE.Mesh(trimGeo, trimMat);
      trimMesh.position.y = 0.3;
      landmarkGroup.add(trimMesh);

      // Lock clasp
      const lockGeo = new THREE.BoxGeometry(0.18, 0.2, 0.08);
      const lockMesh = new THREE.Mesh(lockGeo, trimMat);
      lockMesh.position.set(0, 0.45, 0.43);
      landmarkGroup.add(lockMesh);

      // Chest Lid (Rotatable Group)
      lidGroup = new THREE.Group();
      lidGroup.position.set(0, 0.6, -0.4);

      const lidGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16, 1, false, 0, Math.PI);
      lidGeo.rotateZ(Math.PI / 2);
      const lidMesh = new THREE.Mesh(lidGeo, woodMat);
      lidMesh.position.set(0, 0, 0.4);
      lidGroup.add(lidMesh);

      const lidTrimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.18, 16, 1, false, 0, Math.PI);
      lidTrimGeo.rotateZ(Math.PI / 2);
      const lidTrim = new THREE.Mesh(lidTrimGeo, trimMat);
      lidTrim.position.set(0, 0, 0.4);
      lidGroup.add(lidTrim);

      landmarkGroup.add(lidGroup);

      // Inside glowing gem
      const gemGeo = new THREE.IcosahedronGeometry(0.24, 0);
      const gemMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.1,
      });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(0, 0.45, 0);
      landmarkGroup.add(gem);
    } else if (type === 'mushroom') {
      // Mushroom House (matching Screenshot 1)
      const stemGeo = new THREE.CylinderGeometry(0.55, 0.75, 0.9, 20);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.4 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.45;
      landmarkGroup.add(stem);

      // Round Cap
      const capGeo = new THREE.SphereGeometry(0.95, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.3 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.9;
      landmarkGroup.add(cap);

      // Chimney
      const chimGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.45, 12);
      const chimMat = new THREE.MeshStandardMaterial({ color: 0x0d9488 });
      const chim = new THREE.Mesh(chimGeo, chimMat);
      chim.position.set(0.45, 1.4, -0.2);
      chim.rotation.z = -0.25;
      landmarkGroup.add(chim);

      // Little Door
      const doorGeo = new THREE.BoxGeometry(0.28, 0.42, 0.1);
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, 0.25, 0.65);
      landmarkGroup.add(door);
    } else {
      // Ancient Stone Arch Gate
      const pillarGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });

      const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
      leftPillar.position.set(-0.65, 0.6, 0);
      landmarkGroup.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
      rightPillar.position.set(0.65, 0.6, 0);
      landmarkGroup.add(rightPillar);

      const archGeo = new THREE.TorusGeometry(0.65, 0.2, 8, 16, Math.PI);
      const arch = new THREE.Mesh(archGeo, stoneMat);
      arch.position.set(0, 1.1, 0);
      landmarkGroup.add(arch);

      // Glowing rune crystal
      const runeGeo = new THREE.OctahedronGeometry(0.18, 0);
      const runeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
      });
      const rune = new THREE.Mesh(runeGeo, runeMat);
      rune.position.set(0, 0.8, 0);
      landmarkGroup.add(rune);
    }

    let animId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      landmarkGroup.rotation.y = Math.sin(elapsed * 0.8) * 0.25;

      if (lidGroup) {
        // Animate lid open / closed
        const targetAngle = isOpenRef.current ? -Math.PI * 0.45 : 0;
        lidGroup.rotation.x += (targetAngle - lidGroup.rotation.x) * 0.1;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [type, size]);

  return <div ref={mountRef} className="inline-block pointer-events-none" style={{ width: size, height: size }} />;
};
