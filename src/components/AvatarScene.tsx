// src/components/AvatarScene.tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

interface AvatarModelProps {
  blendshapes: Record<string, number>;
}

// ✅ MAPPING: MediaPipe blendshapes → model morph target names
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

function AvatarModel({ blendshapes }: AvatarModelProps) {
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

  // 🧠 UPDATED: Apply all morph targets dynamically
  useFrame(() => {
    if (!headMeshRef.current || !blendshapes) return;

    const head = headMeshRef.current;

    // ✅ Apply MediaPipe → morph influences
    for (const [mediaPipeName, score] of Object.entries(blendshapes)) {
      const targetName = blendshapeMap[mediaPipeName];
      if (
        targetName &&
        head.morphTargetDictionary?.[targetName] !== undefined
      ) {
        const index = head.morphTargetDictionary[targetName];
        head.morphTargetInfluences![index] = score;
      }
    }

    // Optional: simple head tilt using brow movement
    if (headRef.current) {
      headRef.current.rotation.x = (blendshapes.browInnerUp ?? 0) * 0.3;
      headRef.current.rotation.y =
        ((blendshapes.browOuterUpLeft ?? 0) -
          (blendshapes.browOuterUpRight ?? 0)) *
        0.3;
    }

    // Optional: simple eye rotation example
    if (leftEyeRef.current && rightEyeRef.current) {
      const lookLeft =
        (blendshapes.eyeLookOutRight ?? 0) - (blendshapes.eyeLookOutLeft ?? 0);
      leftEyeRef.current.rotation.y = lookLeft * 0.3;
      rightEyeRef.current.rotation.y = lookLeft * 0.3;
    }
  });

  return <primitive object={gltf.scene} scale={1.5} position={[0, -1, 0]} />;
}

interface AvatarSceneProps {
  blendshapes: Record<string, number>;
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
        {/* ✅ Pass blendshapes to the model */}
        <AvatarModel blendshapes={blendshapes} />
        <Environment preset="studio" />
        <OrbitControls target={[0, 1.5, 0]} enablePan={false} />
      </Canvas>
    </div>
  );
}
