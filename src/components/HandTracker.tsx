import { useEffect, useRef } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export default function HandTracker({
  onHandData,
}: {
  onHandData: (hands: any) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationId: number;

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      detectHands();
    }

    async function detectHands() {
      if (!handLandmarker || !videoRef.current) {
        animationId = requestAnimationFrame(detectHands);
        return;
      }

      const now = performance.now();
      const result = await handLandmarker.detectForVideo(videoRef.current, now);

      // Return hand landmarks
      if (result?.landmarks) {
        onHandData(result.landmarks); // array of 21 joints per hand
      }

      animationId = requestAnimationFrame(detectHands);
    }

    init();

    return () => cancelAnimationFrame(animationId);
  }, [onHandData]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{ width: 640, height: 480, borderRadius: "8px" }}
    />
  );
}
