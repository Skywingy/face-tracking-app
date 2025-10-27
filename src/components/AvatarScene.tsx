import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh } from "three";

function AvatarModel({ blendshapes }: { blendshapes: Record<string, number> }) {
  const leftEye = useRef<Mesh>(null);
  const brow = useRef<Mesh>(null);

  useFrame(() => {
    if (leftEye.current && brow.current) {
      const blink = blendshapes["eyeBlinkLeft"] ?? 0;
      const browUp = blendshapes["browInnerUp"] ?? 0;

      leftEye.current.scale.y = 1 - blink * 0.8;
      brow.current.position.y = 0.3 + browUp * 0.2;
    }
  });

  return (
    <>
      <ambientLight />
      <mesh ref={leftEye} position={[-0.3, 0, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh ref={brow} position={[0, 0.3, 0]}>
        <boxGeometry args={[0.5, 0.05, 0.05]} />
        <meshStandardMaterial color="brown" />
      </mesh>
    </>
  );
}

export default function AvatarScene({
  blendshapes,
}: {
  blendshapes: Record<string, number>;
}) {
  return (
    <Canvas camera={{ position: [0, 0, 3] }}>
      <AvatarModel blendshapes={blendshapes} />
    </Canvas>
  );
}
