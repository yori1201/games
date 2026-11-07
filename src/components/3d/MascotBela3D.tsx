import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type BelaMood = 'idle' | 'happy' | 'thinking' | 'celebrate' | 'xp_reward';

interface MascotBela3DProps {
  mood?: BelaMood;
  size?: number; // Size in px
  interactive?: boolean;
  onInteract?: () => void;
}

export const MascotBela3D: React.FC<MascotBela3DProps> = ({
  mood = 'idle',
  size = 220,
  interactive = true,
  onInteract,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef(mood);
  moodRef.current = mood;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = size;
    const height = size;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.75, 3.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Studio 3-Point Lighting
    const keyLight = new THREE.DirectionalLight(0xfff3d1, 2.5);
    keyLight.position.set(2.5, 3.5, 2.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x90caf9, 1.3);
    fillLight.position.set(-2.5, 1.5, 1.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffe082, 1.6);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight(0xfff9c4, 0x5c6bc0, 0.85);
    scene.add(hemiLight);

    // Composite 3D Mascot Bela Group
    const belaGroup = new THREE.Group();
    scene.add(belaGroup);

    // 1. Body: Soft rounded sprout body (Apple/Lime green matching official mascot)
    const bodyGeo = new THREE.SphereGeometry(0.72, 32, 28);
    bodyGeo.scale(1.05, 1.1, 0.98);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x78c222, // Official Rumbela apple-green tone
      roughness: 0.35,
      metalness: 0.05,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.55;
    belaGroup.add(bodyMesh);

    // 2. Large Expressive Anime Eyes (Left & Right)
    const eyeGeo = new THREE.SphereGeometry(0.14, 24, 20);
    eyeGeo.scale(1, 1.3, 0.55);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.26, 0.65, 0.64);
    belaGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.26, 0.65, 0.64);
    belaGroup.add(rightEye);

    // Eye Highlights (Large white circle + small lower highlight)
    const shineGeo = new THREE.SphereGeometry(0.055, 16, 12);
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftShine = new THREE.Mesh(shineGeo, shineMat);
    leftShine.position.set(-0.23, 0.72, 0.70);
    belaGroup.add(leftShine);

    const rightShine = new THREE.Mesh(shineGeo, shineMat);
    rightShine.position.set(0.29, 0.72, 0.70);
    belaGroup.add(rightShine);

    const tinyShineGeo = new THREE.SphereGeometry(0.025, 12, 10);
    const leftTiny = new THREE.Mesh(tinyShineGeo, shineMat);
    leftTiny.position.set(-0.28, 0.59, 0.70);
    belaGroup.add(leftTiny);

    const rightTiny = new THREE.Mesh(tinyShineGeo, shineMat);
    rightTiny.position.set(0.24, 0.59, 0.70);
    belaGroup.add(rightTiny);

    // Cute Dark Green Eyebrows
    const browGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 12, Math.PI * 0.7);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x276708 });
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.26, 0.84, 0.62);
    leftBrow.rotation.z = -0.2;
    belaGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.26, 0.84, 0.62);
    rightBrow.rotation.z = -0.2;
    leftBrow.rotation.y = Math.PI;
    belaGroup.add(rightBrow);

    // 3. Rosy Pink Cheeks
    const cheekGeo = new THREE.SphereGeometry(0.09, 16, 14);
    cheekGeo.scale(1.2, 0.8, 0.2);
    const cheekMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.85,
    });
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.42, 0.50, 0.62);
    belaGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.42, 0.50, 0.62);
    belaGroup.add(rightCheek);

    // 4. Joyful Open Mouth with Tongue
    const mouthGeo = new THREE.SphereGeometry(0.12, 16, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    mouthGeo.scale(1.2, 1, 0.6);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x450a0a });
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
    mouthMesh.rotation.x = Math.PI / 2;
    mouthMesh.position.set(0, 0.44, 0.68);
    belaGroup.add(mouthMesh);

    const tongueGeo = new THREE.SphereGeometry(0.07, 12, 10);
    tongueGeo.scale(1, 0.5, 0.6);
    const tongueMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
    tongueMesh.position.set(0, 0.41, 0.70);
    belaGroup.add(tongueMesh);

    // 5. OFFICIAL DUAL SPROUT LEAVES ON HEAD (Signature Rumbela Feature)
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80, // Glossy vibrant plant sprout green
      roughness: 0.25,
      metalness: 0.1,
    });

    const leafStemGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.2, 12);
    const leafStem = new THREE.Mesh(leafStemGeo, leafMat);
    leafStem.position.set(0, 1.35, 0);
    belaGroup.add(leafStem);

    // Left Leaf (Tilted left)
    const leafGeo = new THREE.SphereGeometry(0.32, 20, 16);
    leafGeo.scale(0.85, 1.6, 0.25);

    const leftLeaf = new THREE.Mesh(leafGeo, leafMat);
    leftLeaf.position.set(-0.25, 1.75, 0);
    leftLeaf.rotation.z = 0.45;
    leftLeaf.rotation.x = -0.1;
    belaGroup.add(leftLeaf);

    // Right Leaf (Tilted right)
    const rightLeaf = new THREE.Mesh(leafGeo, leafMat);
    rightLeaf.position.set(0.25, 1.75, 0);
    rightLeaf.rotation.z = -0.45;
    rightLeaf.rotation.x = 0.1;
    belaGroup.add(rightLeaf);

    // 6. Right Hand Holding Yellow-Orange Pencil
    const handMat = new THREE.MeshStandardMaterial({ color: 0x78c222, roughness: 0.35 });
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), handMat);
    rightHand.position.set(-0.68, 0.45, 0.35);
    belaGroup.add(rightHand);

    // Pencil Body
    const pencilGroup = new THREE.Group();
    pencilGroup.position.set(-0.70, 0.45, 0.42);
    pencilGroup.rotation.z = 0.3;

    const pencilBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
    );
    pencilGroup.add(pencilBody);

    const pencilTipWood = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 })
    );
    pencilTipWood.position.y = 0.28;
    pencilGroup.add(pencilTipWood);

    const pencilLead = new THREE.Mesh(
      new THREE.ConeGeometry(0.025, 0.05, 8),
      new THREE.MeshBasicMaterial({ color: 0x1f2937 })
    );
    pencilLead.position.y = 0.33;
    pencilGroup.add(pencilLead);

    belaGroup.add(pencilGroup);

    // 7. Left Hand Holding Blue Book
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), handMat);
    leftHand.position.set(0.68, 0.45, 0.35);
    belaGroup.add(leftHand);

    // Blue Book
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0.68, 0.42, 0.45);
    bookGroup.rotation.z = -0.2;
    bookGroup.rotation.y = -0.2;

    const bookCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.38, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 })
    );
    bookGroup.add(bookCover);

    const bookPages = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.34, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.7 })
    );
    bookPages.position.x = 0.02;
    bookGroup.add(bookPages);

    belaGroup.add(bookGroup);

    // 8. Chubby Rounded Feet
    const footMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.4 });
    const footGeo = new THREE.SphereGeometry(0.16, 16, 14);
    footGeo.scale(1.1, 0.7, 1.4);

    const leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-0.28, -0.15, 0.12);
    belaGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, footMat);
    rightFoot.position.set(0.28, -0.15, 0.12);
    belaGroup.add(rightFoot);

    // 9. Contact Shadow plane beneath feet
    const shadowGeo = new THREE.PlaneGeometry(1.4, 1.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.22,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.28;
    belaGroup.add(shadowMesh);

    // 10. Floating 3D Star Sparkles for XP Celebrations!
    const starCount = 14;
    const starGroup = new THREE.Group();
    scene.add(starGroup);

    const starMeshes: THREE.Mesh[] = [];
    const starSpeeds: number[] = [];
    const starRadii: number[] = [];
    const starAngles: number[] = [];

    const starGeo = new THREE.OctahedronGeometry(0.09, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      metalness: 0.4,
      roughness: 0.2,
    });

    for (let i = 0; i < starCount; i++) {
      const mesh = new THREE.Mesh(starGeo, starMat);
      mesh.scale.setScalar(0.7 + Math.random() * 0.6);
      starMeshes.push(mesh);
      starGroup.add(mesh);

      starSpeeds.push(1.5 + Math.random() * 2);
      starRadii.push(0.9 + Math.random() * 0.6);
      starAngles.push(Math.random() * Math.PI * 2);
    }
    starGroup.visible = false;

    // Interactive pointer drag
    let isDragging = false;
    let prevPointerX = 0;
    let targetRotationY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevPointerX = e.clientX;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !interactive) return;
      const deltaX = e.clientX - prevPointerX;
      targetRotationY += deltaX * 0.015;
      prevPointerX = e.clientX;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const handleClick = () => {
      if (onInteract) {
        onInteract();
      }
    };

    if (interactive) {
      container.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      container.addEventListener('click', handleClick);
    }

    // Animation Loop
    let animId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const currentMood = moodRef.current;

      // Smooth rotation damping
      belaGroup.rotation.y += (targetRotationY - belaGroup.rotation.y) * 0.1;

      // Sprout leaves flutter
      leftLeaf.rotation.z = 0.45 + Math.sin(elapsed * 4) * 0.08;
      rightLeaf.rotation.z = -0.45 - Math.sin(elapsed * 4) * 0.08;

      // Periodic natural eye blinking (every 3.8s, closes for 120ms)
      const blinkCycle = elapsed % 3.8;
      const isBlinking = blinkCycle > 3.65;
      leftEye.scale.y = isBlinking ? 0.15 : 1.3;
      rightEye.scale.y = isBlinking ? 0.15 : 1.3;
      leftShine.visible = !isBlinking;
      rightShine.visible = !isBlinking;

      // Responsive Mood Kinematics & XP Reaction
      if (currentMood === 'xp_reward' || currentMood === 'celebrate') {
        // Joyful jumping celebration with star orbit!
        starGroup.visible = true;
        const jump = Math.abs(Math.sin(elapsed * 8)) * 0.45;
        belaGroup.position.y = jump;
        belaGroup.rotation.z = Math.sin(elapsed * 6) * 0.08;

        // Hands cheering up high with pencil & book!
        rightHand.position.y = 0.65 + Math.sin(elapsed * 12) * 0.1;
        pencilGroup.position.y = 0.68 + Math.sin(elapsed * 12) * 0.1;
        pencilGroup.rotation.z = 0.8 + Math.sin(elapsed * 10) * 0.3;

        leftHand.position.y = 0.65 + Math.sin(elapsed * 12) * 0.1;
        bookGroup.position.y = 0.65 + Math.sin(elapsed * 12) * 0.1;
        bookGroup.rotation.z = -0.6 + Math.sin(elapsed * 10) * 0.3;

        shadowMesh.scale.setScalar(1 - jump * 0.7);

        // Orbiting star sparkles
        starMeshes.forEach((mesh, idx) => {
          starAngles[idx] += starSpeeds[idx] * 0.025;
          const r = starRadii[idx];
          const a = starAngles[idx];
          mesh.position.set(Math.cos(a) * r, 0.6 + Math.sin(elapsed * 4 + idx) * 0.5, Math.sin(a) * r);
          mesh.rotation.y += 0.08;
          mesh.rotation.x += 0.05;
        });
      } else if (currentMood === 'happy') {
        starGroup.visible = false;
        const jump = Math.abs(Math.sin(elapsed * 7)) * 0.35;
        belaGroup.position.y = jump;
        belaGroup.rotation.z = 0;
        rightHand.position.y = 0.45;
        pencilGroup.position.y = 0.45;
        leftHand.position.y = 0.45;
        bookGroup.position.y = 0.42;
        shadowMesh.scale.setScalar(1 - jump * 0.6);
      } else if (currentMood === 'thinking') {
        starGroup.visible = false;
        belaGroup.position.y = Math.sin(elapsed * 2) * 0.05;
        belaGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.08;
        rightHand.position.y = 0.55;
        pencilGroup.position.y = 0.58;
        pencilGroup.rotation.z = 0.6;
        leftHand.position.y = 0.45;
        bookGroup.position.y = 0.42;
      } else {
        // Idle gentle breathing float
        starGroup.visible = false;
        belaGroup.position.y = Math.sin(elapsed * 2.5) * 0.08;
        belaGroup.rotation.z = 0;
        bodyMesh.scale.y = 1.1 + Math.sin(elapsed * 2.5) * 0.03;

        rightHand.position.y = 0.45 + Math.sin(elapsed * 2.5) * 0.04;
        pencilGroup.position.y = 0.42 + Math.sin(elapsed * 2.5) * 0.04;
        pencilGroup.rotation.z = 0.3 + Math.sin(elapsed * 1.5) * 0.05;

        leftHand.position.y = 0.45 + Math.sin(elapsed * 2.5) * 0.04;
        bookGroup.position.y = 0.42 + Math.sin(elapsed * 2.5) * 0.04;
        bookGroup.rotation.z = -0.2 + Math.sin(elapsed * 1.5) * 0.05;

        shadowMesh.scale.setScalar(1 - Math.sin(elapsed * 2.5) * 0.1);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (interactive) {
        container.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        container.removeEventListener('click', handleClick);
      }
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      bodyGeo.dispose();
      bodyMat.dispose();
      eyeGeo.dispose();
      eyeMat.dispose();
      leafGeo.dispose();
      leafMat.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, [size, interactive]);

  return (
    <div
      ref={mountRef}
      className="inline-block relative cursor-grab active:cursor-grabbing select-none"
      style={{ width: size, height: size }}
      title="Sentuh atau klik Bela untuk melihat reaksinya!"
    />
  );
};
