// src/components/FaceTracker.tsx
import { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

// This component writes realtime results into a mutable ref provided by the parent.
// That avoids React state updates each frame and prevents re-render flicker.
export default function FaceTracker({
  outRef,
}: {
  outRef: React.MutableRefObject<{
    blendshapes: Record<string, number>;
    headRotation: { x: number; y: number; z: number };
  }>;
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
        try {
          await videoRef.current.play();
        } catch (err) {
          console.warn("Video play interrupted:", err);
        }
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

        // prepare outputs
        let shapes: Record<string, number> = {};
        let headRotation = { x: 0, y: 0, z: 0 };

        if (result?.faceBlendshapes?.length) {
          shapes = Object.fromEntries(
            result.faceBlendshapes[0].categories.map((c) => [
              c.categoryName,
              c.score,
            ])
          );
        }

        if (result?.facialTransformationMatrixes?.length) {
          const m = result.facialTransformationMatrixes[0].data;
          const r00 = m[0],
            r01 = m[1],
            r02 = m[2];
          const r10 = m[4],
            r11 = m[5],
            r12 = m[6];
          const r20 = m[8],
            r21 = m[9],
            r22 = m[10];

          headRotation = {
            x: Math.atan2(r21, r22),
            y: Math.atan2(-r20, Math.sqrt(r21 * r21 + r22 * r22)),
            z: Math.atan2(r10, r00),
          };
        }

        // write into outRef (no React state updates -> no re-render flicker)
        try {
          outRef.current.blendshapes = shapes;
          outRef.current.headRotation = headRotation;
        } catch (err) {
          // ignore if outRef isn't ready
        }

        animationFrameId = requestAnimationFrame(detectFrame);
      };

      detectFrame();
    }

    init();

    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outRef]);

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
        muted
        width={640}
        height={480}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          objectFit: "cover",
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
