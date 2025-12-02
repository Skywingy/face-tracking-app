// src/App.tsx
import React, { useRef } from "react";
import FaceTracker from "./components/FaceTracker";
import AvatarScene from "./components/AvatarScene";
import CameraView from "./components/CameraView";

// Use a mutable ref shared between FaceTracker and AvatarScene to avoid React re-renders
const initial = {
  blendshapes: {} as Record<string, number>,
  headRotation: { x: 0, y: 0, z: 0 },
};

export default function App() {
  const dataRef = useRef(initial);

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#111",
      }}
    >
      <CameraView />

      {/* FaceTracker writes live data into dataRef.current */}
      <FaceTracker outRef={dataRef as any} />

      {/* AvatarScene reads live data from the same ref */}
      <AvatarScene dataRef={dataRef as any} />
    </div>
  );
}
