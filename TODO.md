# TODO: Face Tracking App Enhancements

## Hand Tracking Integration

- [x] Re-enable hand tracking in `FaceTracker.tsx` (basic detection enabled)
- [x] Implement left index finger animation (basic curl detection) - WORKS but causes noticeable lag
- [ ] Expand to full left hand (thumb, middle, ring, pinky)
- [ ] Add right hand support
- [ ] Optimize performance (e.g., lower frame rate if needed) - Tested optimizations (modelComplexity:0, frame skipping, lower confidence) but still laggy
- [ ] Add hand pose recognition for gestures (optional)
- [ ] Consider adding MediaPipe Pose for arm/chest tracking (performance impact: high - may cause lag)

## Avatar Improvements

- [ ] Fine-tune blendshape mappings if needed
- [ ] Add more eye tracking (up/down, not just left/right)
- [ ] Implement head rotation smoothing if flickering returns
- [ ] Add avatar customization options (e.g., different models)

## Web Worker + MediaPipe (priority)

- [ ] Implement module web worker for face landmark detection (no importScripts in module worker)
- [ ] In worker (`src/workers/detection.worker.ts`), import `{ FaceLandmarker, FilesetResolver }` from `@mediapipe/tasks-vision`
- [ ] Use `FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm")`
- [ ] Initialize with `FaceLandmarker.createFromOptions({ baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task" }, runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true })`
- [ ] In main `FaceTracker.tsx`, create worker as `new Worker(new URL("../workers/detection.worker.ts", import.meta.url), { type: "module" })`
- [ ] Post frames: `worker.postMessage({ videoFrame: imageData, timestamp: performance.now() })`
- [ ] Handle messages: `initialized`, `detection`, `error`

WITHOUT Web Worker (Current):
┌─────────────────────────────────────────────┐
│ MAIN THREAD (blocked during inference) │
├─────────────────────────────────────────────┤
│ 1. Capture video [1ms] │
│ 2. MediaPipe inference (face/hands) [15ms] │ ← BLOCKS UI
│ 3. React re-renders [5ms] │
│ 4. Update 3D avatar [3ms] │
│ TOTAL: ~24ms per frame = 41 FPS max │
└─────────────────────────────────────────────┘

WITH Web Worker (Proposed):
┌─────────────────────────────┐ ┌──────────────────────┐
│ MAIN THREAD (responsive) │ │ WORKER THREAD │
├─────────────────────────────┤ ├──────────────────────┤
│ 1. Capture video [1ms] │ │ MediaPipe inference │
│ 2. React re-render [5ms] │ │ (face/hands/pose) │
│ 3. Update avatar [3ms] │◄┤ [15ms, runs parallel]│
│ TOTAL: ~9ms = 60 FPS ✓ │ │ │
└─────────────────────────────┘ └──────────────────────┘

## General

- [ ] Add error handling for camera access failures
- [ ] Optimize for mobile devices
- [ ] Add UI controls (e.g., toggle mirroring, reset avatar)
- [ ] Document setup and usage in README.md

## Future Features

- [ ] Body tracking integration
- [ ] Voice lip-sync
- [ ] Multi-user support
- [ ] Export animations
