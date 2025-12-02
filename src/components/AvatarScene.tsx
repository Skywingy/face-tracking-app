// src/components/AvatarScene.tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

interface AvatarModelProps {
  dataRef: React.MutableRefObject<{
    blendshapes: Record<string, number>;
    headRotation: { x: number; y: number; z: number };
  }>;
}

// Mapping MediaPipe blendshapes -> model morph target names (kept same as before)
const blendshapeMap: Record<string, string> = {
  browDownLeft: "browDownLeft",
  browDownRight: "browDownRight",
  browInnerUp: "browInnerUp",
  browOuterUpLeft: "browOuterUpLeft",
  browOuterUpRight: "browOuterUpRight",

  cheekPuff: "cheekPuff",
  cheekSquintLeft: "cheekSquintLeft",
  cheekSquintRight: "cheekSquintRight",

  eyeBlinkLeft: "eyeBlinkLeft",
  eyeBlinkRight: "eyeBlinkRight",
  eyeSquintLeft: "eyeSquintLeft",
  eyeSquintRight: "eyeSquintRight",
  eyeWideLeft: "eyeWideLeft",
  eyeWideRight: "eyeWideRight",

  eyeLookDownLeft: "eyeLookDownLeft",
  eyeLookDownRight: "eyeLookDownRight",
  eyeLookInLeft: "eyeLookInLeft",
  eyeLookInRight: "eyeLookInRight",
  eyeLookOutLeft: "eyeLookOutLeft",
  eyeLookOutRight: "eyeLookOutRight",
  eyeLookUpLeft: "eyeLookUpLeft",
  eyeLookUpRight: "eyeLookUpRight",

  jawForward: "jawForward",
  jawLeft: "jawLeft",
  jawRight: "jawRight",
  jawOpen: "jawOpen",

  mouthClose: "mouthClose",
  mouthFunnel: "mouthFunnel",
  mouthPucker: "mouthPucker",
  mouthLeft: "mouthLeft",
  mouthRight: "mouthRight",
  mouthSmileLeft: "mouthSmileLeft",
  mouthSmileRight: "mouthSmileRight",
  mouthFrownLeft: "mouthFrownLeft",
  mouthFrownRight: "mouthFrownRight",
  mouthDimpleLeft: "mouthDimpleLeft",
  mouthDimpleRight: "mouthDimpleRight",
  mouthStretchLeft: "mouthStretchLeft",
  mouthStretchRight: "mouthStretchRight",
  mouthRollLower: "mouthRollLower",
  mouthRollUpper: "mouthRollUpper",
  mouthShrugLower: "mouthShrugLower",
  mouthShrugUpper: "mouthShrugUpper",
  mouthPressLeft: "mouthPressLeft",
  mouthPressRight: "mouthPressRight",
  mouthLowerDownLeft: "mouthLowerDownLeft",
  mouthLowerDownRight: "mouthLowerDownRight",
  mouthUpperUpLeft: "mouthUpperUpLeft",
  mouthUpperUpRight: "mouthUpperUpRight",

  noseSneerLeft: "noseSneerLeft",
  noseSneerRight: "noseSneerRight",
  tongueOut: "tongueOut",
};

function AvatarModel({ dataRef }: AvatarModelProps) {
  const gltf = useGLTF("/models/avatar.glb");

  const headRef = useRef<THREE.Bone>();
  const leftEyeRef = useRef<THREE.Bone>();
  const rightEyeRef = useRef<THREE.Bone>();
  const headMeshRef = useRef<THREE.SkinnedMesh>();

  useEffect(() => {
    const nodes = gltf.nodes as any;
    headRef.current = nodes.Head;
    leftEyeRef.current = nodes.LeftEye;
    rightEyeRef.current = nodes.RightEye;
    headMeshRef.current = nodes.Wolf3D_Head;
  }, [gltf.nodes]);

  useFrame(() => {
    if (!headMeshRef.current) return;
    const headMesh = headMeshRef.current;

    // read live values from ref (no React re-renders)
    const blendshapes = dataRef.current.blendshapes || {};
    const headRotation = dataRef.current.headRotation || { x: 0, y: 0, z: 0 };

    // Apply morph targets
    for (const [mediaPipeName, score] of Object.entries(blendshapes)) {
      const targetName = blendshapeMap[mediaPipeName];
      if (
        targetName &&
        headMesh.morphTargetDictionary?.[targetName] !== undefined
      ) {
        const index = headMesh.morphTargetDictionary[targetName];
        headMesh.morphTargetInfluences![index] = score;
      }
    }

    // Apply raw head rotation (NO smoothing, NO eyebrow mapping)
    if (headRef.current) {
      headRef.current.rotation.x = -headRotation.x;
      headRef.current.rotation.y = headRotation.y;
      headRef.current.rotation.z = headRotation.z;
    }

    // Eyes: simple mapping (small)
    if (leftEyeRef.current && rightEyeRef.current) {
      const lookRight =
        (blendshapes.eyeLookOutRight ?? 0) - (blendshapes.eyeLookInRight ?? 0);
      leftEyeRef.current.rotation.y = lookRight * 0.25;
      rightEyeRef.current.rotation.y = lookRight * 0.25;
    }
  });

  return <primitive object={gltf.scene} scale={1.5} position={[0, -1, 0]} />;
}

interface AvatarSceneProps {
  dataRef: React.MutableRefObject<{
    blendshapes: Record<string, number>;
    headRotation: { x: number; y: number; z: number };
  }>;
}

export default function AvatarScene({ dataRef }: AvatarSceneProps) {
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
        <AvatarModel dataRef={dataRef} />
        <Environment preset="studio" />
        <OrbitControls target={[0, 1.5, 0]} enablePan={false} />
      </Canvas>
    </div>
  );
}
