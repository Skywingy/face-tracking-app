// src/App.tsx
import React, { useState } from "react";
import FaceTracker from "./components/FaceTracker";
import AvatarScene from "./components/AvatarScene";
import CameraView from "./components/CameraView";

export default function App() {
  const [data, setData] = useState({
    blendshapes: {} as Record<string, number>,
    headRotation: { x: 0, y: 0, z: 0 },
  });

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
      {/* left: raw camera */}
      <CameraView />

      {/* middle: mediapipe overlay */}
      <FaceTracker
        // ✅ NEW: send both blendshapes + headRotation
        onFaceData={(d) => setData(d)}
      />

      {/* right: avatar driven by data */}
      <AvatarScene
        blendshapes={data.blendshapes}
        headRotation={data.headRotation}
      />
    </div>
  );
}
