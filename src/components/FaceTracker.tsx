// src/components/FaceTracker.tsx
import { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

export default function FaceTracker({
  outRef,
}: {
  outRef: React.MutableRefObject<{
    blendshapes: Record<string, number>;
    headRotation: { x: number; y: number; z: number };
    hands?: any[];
  }>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let faceLandmarker: FaceLandmarker | null = null;
    // let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
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

      // handLandmarker = await HandLandmarker.createFromOptions(vision, {
      //   baseOptions: {
      //     modelAssetPath:
      //       "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
      //   },
      //   runningMode: "VIDEO",
      //   numHands: 2,
      // });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

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
        const nowInMs = performance.now();

        const faceResult = faceLandmarker
          ? await faceLandmarker.detectForVideo(videoRef.current!, nowInMs)
          : null;

        // const handResult = handLandmarker
        //   ? await handLandmarker.detectForVideo(videoRef.current!, nowInMs)
        //   : null;

        // CLEAR OVERLAY
        ctx.clearRect(
          0,
          0,
          canvasRef.current!.width,
          canvasRef.current!.height,
        );

        // -------------------------------
        // 🎭 DRAW FACE MESH
        // -------------------------------
        if (faceResult?.faceLandmarks?.length) {
          for (const lm of faceResult.faceLandmarks) {
            drawingUtils.drawConnectors(
              lm,
              FaceLandmarker.FACE_LANDMARKS_TESSELATION,
              { color: "#C0C0C070", lineWidth: 1 },
            );
            drawingUtils.drawConnectors(
              lm,
              FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
              { color: "#FF3030" },
            );
            drawingUtils.drawConnectors(
              lm,
              FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
              { color: "#FF3030" },
            );
            drawingUtils.drawConnectors(
              lm,
              FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
              { color: "#30FF30" },
            );
            drawingUtils.drawConnectors(
              lm,
              FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
              { color: "#30FF30" },
            );
            drawingUtils.drawConnectors(
              lm,
              FaceLandmarker.FACE_LANDMARKS_LIPS,
              { color: "#E0E0E0" },
            );
          }
        }

        // // -------------------------------
        // // ✋ DRAW HAND LANDMARKS (disabled)
        // // -------------------------------
        // if (handResult?.landmarks?.length) {
        //   for (const hand of handResult.landmarks) {
        //     if (!hand) continue;

        //     const fingerChains = [
        //       [0, 1, 2, 3, 4],
        //       [0, 5, 6, 7, 8],
        //       [0, 9, 10, 11, 12],
        //       [0, 13, 14, 15, 16],
        //       [0, 17, 18, 19, 20],
        //     ];

        //     // Draw finger bones
        //     for (const chain of fingerChains) {
        //       for (let i = 0; i < chain.length - 1; i++) {
        //         const a = hand[chain[i]];
        //         const b = hand[chain[i + 1]];

        //         const pts = [a, b];

        //         drawingUtils.drawConnectors(pts, [{ start: 0, end: 1 }], {
        //           color: "#FFD166",
        //           lineWidth: 2,
        //         });
        //       }
        //     }

        //     // Draw dots
        //     drawingUtils.drawLandmarks(hand, {
        //       color: "#EF476F",
        //       radius: 2,
        //     });
        //   }
        // }

        // -------------------------------
        // 📤 OUTPUT DATA
        // -------------------------------
        let blendshapes: Record<string, number> = {};
        let headRotation = { x: 0, y: 0, z: 0 };

        // BLENDSHAPES
        if (faceResult?.faceBlendshapes?.length) {
          blendshapes = Object.fromEntries(
            faceResult.faceBlendshapes[0].categories.map((c) => [
              c.categoryName,
              c.score,
            ]),
          );
        }

        // HEAD ROTATION
        if (faceResult?.facialTransformationMatrixes?.length) {
          const m = faceResult.facialTransformationMatrixes[0].data;

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

          // If mirroring is enabled later:
          // headRotation.y *= -1;
        }

        // HANDS
        // const hands = handResult?.landmarks ?? [];
        const hands: any[] = [];

        // WRITE TO REF
        outRef.current.blendshapes = blendshapes;
        outRef.current.headRotation = headRotation;
        outRef.current.hands = hands;

        animationFrameId = requestAnimationFrame(detectFrame);
      };

      detectFrame();
    }

    init();

    return () => cancelAnimationFrame(animationFrameId);
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
      {/* CAMERA */}
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
          transform: "scaleX(-1)", // enable if you want mirror
        }}
      />

      {/* OVERLAY */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          transform: "scaleX(-1)", // mirror together with video
        }}
      />

      {!ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          Loading face model…
        </div>
      )}
    </div>
  );
}
