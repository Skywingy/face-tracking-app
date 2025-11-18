// src/components/AvatarScene.tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

interface AvatarModelProps {
  blendshapes: Record<string, number>;
  headRotation: { x: number; y: number; z: number };
}

// Mapping MediaPipe blendshapes -> model morph target names
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

function AvatarModel({ blendshapes, headRotation }: AvatarModelProps) {
  const gltf = useGLTF("/models/avatar.glb");

  const headRef = useRef<THREE.Bone>();
  const leftEyeRef = useRef<THREE.Bone>();
  const rightEyeRef = useRef<THREE.Bone>();
  const headMeshRef = useRef<THREE.SkinnedMesh>();

  // smoothed quaternion for head
  const smoothedQuat = useRef(new THREE.Quaternion());
  const targetQuat = useRef(new THREE.Quaternion());

  useEffect(() => {
    const nodes = gltf.nodes as any;
    headRef.current = nodes.Head;
    leftEyeRef.current = nodes.LeftEye;
    rightEyeRef.current = nodes.RightEye;
    headMeshRef.current = nodes.Wolf3D_Head;

    // initialize smoothedQuat to current head rotation if available
    if (headRef.current) {
      smoothedQuat.current.copy(headRef.current.quaternion);
    }
  }, [gltf.nodes]);

  useFrame(() => {
    if (!headMeshRef.current) return;
    const headMesh = headMeshRef.current;

    // Apply morph targets
    for (const [mediaPipeName, score] of Object.entries(blendshapes)) {
      const targetName = blendshapeMap[mediaPipeName];
      if (
        targetName &&
        headMesh.morphTargetDictionary?.[targetName] !== undefined
      ) {
        const index = headMesh.morphTargetDictionary[targetName];
        // small scale tweak for some targets might be useful later
        headMesh.morphTargetInfluences![index] = score;
      }
    }

    // Apply head rotation from headRotation prop directly (no smoothing)
    if (headRef.current) {
      const euler = new THREE.Euler(
        headRotation.x,
        headRotation.y,
        headRotation.z,
        "XYZ"
      );
      headRef.current.quaternion.setFromEuler(euler);
    }

    // Eyes: make a subtle smoothed rotation using eyeLook values if available
    if (leftEyeRef.current && rightEyeRef.current) {
      const lookUp =
        (blendshapes.eyeLookUpLeft ?? 0) - (blendshapes.eyeLookDownLeft ?? 0);
      const lookRight =
        (blendshapes.eyeLookOutRight ?? 0) - (blendshapes.eyeLookInRight ?? 0);

      // target rotations (small)
      const eyeTargetY = (lookRight - lookUp) * 0.2;
      // lerp eye rotations
      leftEyeRef.current.rotation.y +=
        (eyeTargetY - leftEyeRef.current.rotation.y) * 0.2;
      rightEyeRef.current.rotation.y +=
        (eyeTargetY - rightEyeRef.current.rotation.y) * 0.2;
    }
  });

  return <primitive object={gltf.scene} scale={1.5} position={[0, -1, 0]} />;
}

interface AvatarSceneProps {
  blendshapes: Record<string, number>;
  headRotation: { x: number; y: number; z: number };
}

export default function AvatarScene({
  blendshapes,
  headRotation,
}: AvatarSceneProps) {
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
        <AvatarModel blendshapes={blendshapes} headRotation={headRotation} />
        <Environment files="/src/assets/studio.hdr" />
        <OrbitControls target={[0, 1.5, 0]} enablePan={false} />
      </Canvas>
    </div>
  );
}
