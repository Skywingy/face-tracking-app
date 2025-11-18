import { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

export default function FaceTracker({
  onBlendShapes,
}: {
  onBlendShapes: (blendshapes: Record<string, number>) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let faceLandmarker: FaceLandmarker | null = null;
    let animationFrameId: number;

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setReady(true);
      startTracking();
    }

    async function startTracking() {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || !videoRef.current) return;
      const drawingUtils = new DrawingUtils(ctx);

      const detectFrame = async () => {
        if (!faceLandmarker || !videoRef.current) {
          animationFrameId = requestAnimationFrame(detectFrame);
          return;
        }

        const nowInMs = performance.now();
        const result = await faceLandmarker.detectForVideo(
          videoRef.current,
          nowInMs
        );

        ctx.clearRect(
          0,
          0,
          canvasRef.current!.width,
          canvasRef.current!.height
        );

        if (result?.faceLandmarks?.length) {
          for (const landmarks of result.faceLandmarks) {
            // ✨ Face mesh overlay with different colors per region
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_TESSELATION,
              { color: "#C0C0C070", lineWidth: 1 }
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
              { color: "#FF3030", lineWidth: 1.5 }
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
              { color: "#FF3030", lineWidth: 1.5 }
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
              { color: "#30FF30", lineWidth: 1.5 }
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
              { color: "#30FF30", lineWidth: 1.5 }
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
              { color: "#E0E0E0", lineWidth: 1.5 }
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LIPS,
              { color: "#E0E0E0", lineWidth: 1.5 }
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
              { color: "#FF3030", lineWidth: 1.5 }
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
              { color: "#30FF30", lineWidth: 1.5 }
            );
          }
        }

        if (result?.faceBlendshapes?.length) {
          const shapes = Object.fromEntries(
            result.faceBlendshapes[0].categories.map((c) => [
              c.categoryName,
              c.score,
            ])
          );
          onBlendShapes(shapes);
        }

        animationFrameId = requestAnimationFrame(detectFrame);
      };

      detectFrame();
    }

    init();

    return () => cancelAnimationFrame(animationFrameId);
  }, [onBlendShapes]);

  return (
    <div
      style={{
        position: "relative",
        width: 640,
        height: 480,
        border: "1px solid #444",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={640}
        height={480}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          //transform: "scaleX(-1)",
        }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          //transform: "scaleX(-1)",
        }}
      />
      {!ready && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            color: "white",
          }}
        >
          Loading face model...
        </div>
      )}
    </div>
  );
}
