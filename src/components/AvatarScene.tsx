// src/components/AvatarScene.tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { useEffect } from "react";

function AvatarModel() {
  const gltf = useGLTF("/models/avatar.glb"); // 👈 put your .glb file in public/models/

  useEffect(() => {
    console.log("GLTF scene:", gltf.scene);
    console.log("Nodes:", gltf.nodes);
    console.log("Materials:", gltf.materials);
    console.log("Animations:", gltf.animations);
  }, [gltf]);

  return <primitive object={gltf.scene} scale={1.5} position={[0, -1, 0]} />;
}

export default function AvatarScene() {
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
        <AvatarModel />
        <Environment preset="studio" />
        <OrbitControls target={[0, 1.5, 0]} enablePan={false} />
      </Canvas>
    </div>
  );
}
