// src/components/AvatarScene.tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

interface AvatarModelProps {
  dataRef: React.MutableRefObject<{
    blendshapes: Record<string, number>;
    headRotation: { x: number; y: number; z: number };
    hands?: any;
  }>;
}

// Mapping MediaPipe blendshapes -> model morph target names (swapped for mirroring) (kept same as before)
const blendshapeMap: Record<string, string> = {
  browDownLeft: "browDownRight",
  browDownRight: "browDownLeft",
  browInnerUp: "browInnerUp",
  browOuterUpLeft: "browOuterUpRight",
  browOuterUpRight: "browOuterUpLeft",

  cheekPuff: "cheekPuff",
  cheekSquintLeft: "cheekSquintRight",
  cheekSquintRight: "cheekSquintLeft",

  eyeBlinkLeft: "eyeBlinkRight",
  eyeBlinkRight: "eyeBlinkLeft",
  eyeSquintLeft: "eyeSquintRight",
  eyeSquintRight: "eyeSquintLeft",
  eyeWideLeft: "eyeWideRight",
  eyeWideRight: "eyeWideLeft",

  eyeLookDownLeft: "eyeLookDownRight",
  eyeLookDownRight: "eyeLookDownLeft",
  eyeLookInLeft: "eyeLookInRight",
  eyeLookInRight: "eyeLookInLeft",
  eyeLookOutLeft: "eyeLookOutRight",
  eyeLookOutRight: "eyeLookOutLeft",
  eyeLookUpLeft: "eyeLookUpRight",
  eyeLookUpRight: "eyeLookUpLeft",

  jawForward: "jawForward",
  jawLeft: "jawRight",
  jawRight: "jawLeft",
  jawOpen: "jawOpen",

  mouthClose: "mouthClose",
  mouthFunnel: "mouthFunnel",
  mouthPucker: "mouthPucker",
  mouthLeft: "mouthRight",
  mouthRight: "mouthLeft",
  mouthSmileLeft: "mouthSmileRight",
  mouthSmileRight: "mouthSmileLeft",
  mouthFrownLeft: "mouthFrownRight",
  mouthFrownRight: "mouthFrownLeft",
  mouthDimpleLeft: "mouthDimpleRight",
  mouthDimpleRight: "mouthDimpleLeft",
  mouthStretchLeft: "mouthStretchRight",
  mouthStretchRight: "mouthStretchLeft",
  mouthRollLower: "mouthRollLower",
  mouthRollUpper: "mouthRollUpper",
  mouthShrugLower: "mouthShrugLower",
  mouthShrugUpper: "mouthShrugUpper",
  mouthPressLeft: "mouthPressRight",
  mouthPressRight: "mouthPressLeft",
  mouthLowerDownLeft: "mouthLowerDownRight",
  mouthLowerDownRight: "mouthLowerDownLeft",
  mouthUpperUpLeft: "mouthUpperUpRight",
  mouthUpperUpRight: "mouthUpperUpLeft",

  noseSneerLeft: "noseSneerRight",
  noseSneerRight: "noseSneerLeft",
  tongueOut: "tongueOut",
};

function AvatarModel({ dataRef }: AvatarModelProps) {
  const gltf = useGLTF("/models/avatar.glb");

  const headRef = useRef<THREE.Bone>();
  const leftEyeRef = useRef<THREE.Bone>();
  const rightEyeRef = useRef<THREE.Bone>();
  const headMeshRef = useRef<THREE.SkinnedMesh>();

  const leftIndex1 = useRef<THREE.Bone>();
  const leftIndex2 = useRef<THREE.Bone>();
  const leftIndex3 = useRef<THREE.Bone>();
  const leftIndex4 = useRef<THREE.Bone>();
  const rightIndex1 = useRef<THREE.Bone>();
  const rightIndex2 = useRef<THREE.Bone>();
  const rightIndex3 = useRef<THREE.Bone>();
  const rightIndex4 = useRef<THREE.Bone>();

  const getFingerCurl = (
    landmarks: any[],
    mcp: number,
    pip: number,
    dip: number,
    tip: number,
  ) => {
    const mcpPos = new THREE.Vector3(
      landmarks[mcp].x,
      landmarks[mcp].y,
      landmarks[mcp].z,
    );
    const tipPos = new THREE.Vector3(
      landmarks[tip].x,
      landmarks[tip].y,
      landmarks[tip].z,
    );
    const distance = mcpPos.distanceTo(tipPos);
    return distance < 0.15 ? 1 : 0; // 1 = curled, adjust threshold
  };

  useEffect(() => {
    const nodes = gltf.nodes as any;
    headRef.current = nodes.Head;
    leftEyeRef.current = nodes.LeftEye;
    rightEyeRef.current = nodes.RightEye;
    headMeshRef.current = nodes.Wolf3D_Head;

    leftIndex1.current = nodes.LeftHandIndex1;
    leftIndex2.current = nodes.LeftHandIndex2;
    leftIndex3.current = nodes.LeftHandIndex3;
    leftIndex4.current = nodes.LeftHandIndex4;
    rightIndex1.current = nodes.RightHandIndex1;
    rightIndex2.current = nodes.RightHandIndex2;
    rightIndex3.current = nodes.RightHandIndex3;
    rightIndex4.current = nodes.RightHandIndex4;
  }, [gltf.nodes]);

  useFrame(() => {
    if (!headMeshRef.current) return;
    const headMesh = headMeshRef.current;

    // read live values from ref (no React re-renders)
    const blendshapes = dataRef.current.blendshapes || {};
    const headRotation = dataRef.current.headRotation || { x: 0, y: 0, z: 0 };
    const hands = dataRef.current.hands || [];

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

    // if (hands.length > 0) {
    //   const leftLandmarks = hands[0]; // assume first detected hand is left
    //   if (leftLandmarks && leftLandmarks.length >= 21) {
    //     // Index finger only
    //     const indexCurl = getFingerCurl(leftLandmarks, 5, 6, 7, 8);
    //     console.log("Index curl:", indexCurl);
    //     const indexRot = indexCurl * 0.5; // positive for curl
    //     rightIndex1.current!.rotation.x = indexRot; // try right instead
    //     rightIndex2.current!.rotation.x = indexRot;
    //     rightIndex3.current!.rotation.x = indexRot;
    //     rightIndex4.current!.rotation.x = indexRot;
    //   }
    // }
  });

  return <primitive object={gltf.scene} scale={1.5} position={[0, -1, 0]} />;
}

interface AvatarSceneProps {
  dataRef: React.MutableRefObject<{
    blendshapes: Record<string, number>;
    headRotation: { x: number; y: number; z: number };
    hands?: any;
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
