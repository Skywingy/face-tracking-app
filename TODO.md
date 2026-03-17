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
