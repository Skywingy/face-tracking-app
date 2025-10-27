import { useState } from "react";
import "./App.css";
import FaceTracker from "./components/FaceTracker";
import AvatarScene from "./components/AvatarScene";

function App() {
  const [blendshapes, setBlendshapes] = useState<Record<string, number>>({});

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 items-center justify-center h-screen">
        <FaceTracker onBlendShapes={setBlendshapes} />
        <AvatarScene blendshapes={blendshapes} />
      </div>
    </>
  );
}

export default App;
