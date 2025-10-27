import FaceTracker from "./components/FaceTracker";
import AvatarScene from "./components/AvatarScene";
import { useState } from "react";

function App() {
  const [blendshapes, setBlendshapes] = useState<Record<string, number>>({});

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
      <FaceTracker onBlendShapes={setBlendshapes} />
      <AvatarScene />
    </div>
  );
}

export default App;
