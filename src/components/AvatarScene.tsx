// src/components/AvatarScene.tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";

interface AvatarModelProps {
  blendshapes: Record<string, number>; // ✨ NEW: receive blendshapes
}

function AvatarModel({ blendshapes }: AvatarModelProps) {
  const gltf = useGLTF("/models/avatar.glb"); // GLB file

  // ✨ Refs to head and eyes for rotation
  const headRef = useRef<THREE.Bone>();
  const leftEyeRef = useRef<THREE.Bone>();
  const rightEyeRef = useRef<THREE.Bone>();
  const headMeshRef = useRef<THREE.SkinnedMesh>();

  // ✨ Initialize refs to bones and meshes
  useEffect(() => {
    const nodes = gltf.nodes as any;
    headRef.current = nodes.Head;
    leftEyeRef.current = nodes.LeftEye;
    rightEyeRef.current = nodes.RightEye;
    headMeshRef.current = nodes.Wolf3D_Head;
  }, [gltf.nodes]);

  // ✨ Apply morph targets & head/eye rotation every frame
  useFrame(() => {
    if (!headMeshRef.current || !blendshapes) return;

    // --- Morph target mapping ---
    const morphMap: Record<string, string> = {
      browDownLeft: "browDownLeft",
      browDownRight: "browDownRight",
      browInnerUp: "browInnerUp",
      browOuterUpLeft: "browOuterUpLeft",
      browOuterUpRight: "browOuterUpRight",
      cheekPuff: "cheekPuff",
      cheekSquintLeft: "cheekSquintLeft",
      // ...add more as needed
    };

    Object.entries(morphMap).forEach(([blendshapeName, morphName]) => {
      const index = headMeshRef.current!.morphTargetDictionary?.[morphName];
      if (index !== undefined) {
        headMeshRef.current!.morphTargetInfluences![index] =
          blendshapes[blendshapeName] ?? 0;
      }
    });

    // --- Head rotation (optional) ---
    // Example: using browInnerUp to tilt head slightly
    if (headRef.current) {
      headRef.current.rotation.x = (blendshapes.browInnerUp ?? 0) * 0.3;
      headRef.current.rotation.y =
        ((blendshapes.browOuterUpLeft ?? 0) -
          (blendshapes.browOuterUpRight ?? 0)) *
        0.3;
    }

    // --- Eye rotation (optional) ---
    if (leftEyeRef.current && rightEyeRef.current) {
      // simple horizontal eye movement
      const eyeLR =
        (blendshapes.eyeLookLeft ?? 0) - (blendshapes.eyeLookRight ?? 0);
      leftEyeRef.current.rotation.y = eyeLR * 0.3;
      rightEyeRef.current.rotation.y = eyeLR * 0.3;
    }
  });

  return <primitive object={gltf.scene} scale={1.5} position={[0, -1, 0]} />;
}

interface AvatarSceneProps {
  blendshapes: Record<string, number>; // ✨ NEW: receive blendshapes
}

export default function AvatarScene({ blendshapes }: AvatarSceneProps) {
  return (
    <div
      style={{
        width: 640,
        height: 480,
        border: "1px solid #444",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[1, 1, 1]} intensity={1.5} />
        {/* ✨ Pass blendshapes to model */}
        <AvatarModel blendshapes={blendshapes} />
        <Environment preset="studio" />
        <OrbitControls target={[0, 1.5, 0]} enablePan={false} />
      </Canvas>
    </div>
  );
}
