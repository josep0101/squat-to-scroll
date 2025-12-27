import { useRef, useEffect, useState, useCallback } from 'react';
import { Pose, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

interface SquatDetectorProps {
    onSquat: () => void;
    isScrolling: boolean;
}

export const SquatDetector = ({ onSquat, isScrolling }: SquatDetectorProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isSquatting, setIsSquatting] = useState(false);
    const [squatCount, setSquatCount] = useState(0);
    const loadingRef = useRef(true);

    // Squat detection logic
    const detectSquat = useCallback((results: Results) => {
        if (!results.poseLandmarks) return;

        const landmarks = results.poseLandmarks;

        // Key points for squat detection (left side)
        const leftHip = landmarks[23];
        const leftKnee = landmarks[25];
        const leftAnkle = landmarks[27];

        // Key points (right side)
        const rightHip = landmarks[24];
        const rightKnee = landmarks[26];
        const rightAnkle = landmarks[28];

        // Calculate angles
        const calculateAngle = (a: any, b: any, c: any) => {
            const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
            let angle = Math.abs(radians * 180.0 / Math.PI);
            if (angle > 180.0) angle = 360 - angle;
            return angle;
        };

        const leftAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

        // Threshold for squat (knee bent < 100 degrees usually indicates a squat)
        // Adjust threshold as needed. Standard standing is ~180.
        const SQUAT_THRESHOLD = 140;
        const STAND_THRESHOLD = 160;

        const isSquatPose = leftAngle < SQUAT_THRESHOLD || rightAngle < SQUAT_THRESHOLD;

        // State machine for squat counting/triggering
        // We used a ref for immediate state in loop, but here we can use state or refs.
        // Since onResults is called frequently, let's just trigger callback.

        // Simple logic: Trigger onSquat when entering squat state?
        // Or continuously scroll while squatting? 
        // "Squat to Scroll" implies action. 
        // Let's fire the callback if squatting.

        if (isSquatPose) {
            setIsSquatting(true);
            if (onSquat) onSquat();
        } else if (leftAngle > STAND_THRESHOLD && rightAngle > STAND_THRESHOLD) {
            setIsSquatting(false);
        }

        // Draw
        const canvasCtx = canvasRef.current?.getContext('2d');
        if (canvasCtx && canvasRef.current) {
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

            // Only draw landmarks if needed for debug/feedback
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
            drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });

            canvasCtx.restore();
        }

        loadingRef.current = false;
    }, [onSquat]);

    useEffect(() => {
        const pose = new Pose({
            locateFile: (file) => {
                // We configured vite-plugin-static-copy to put these in the root
                return `/${file}`;
            },
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        pose.onResults(detectSquat);

        let camera: Camera | null = null;

        if (videoRef.current) {
            camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current) {
                        await pose.send({ image: videoRef.current });
                    }
                },
                width: 1280,
                height: 720, // 720p is good balance
            });
            camera.start();
        }

        return () => {
            if (camera) {
                // Camera stop logic if available in this version of utils, otherwise just unmount
                // camera.stop(); 
            }
            pose.close();
        };
    }, [detectSquat]);

    return (
        <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-2xl border border-white/20">
            {/* Video is hidden, we draw on canvas */}
            <video ref={videoRef} className="hidden" playsInline />
            <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="w-full h-auto block transform -scale-x-100" // Mirror effect
            />
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-mono text-sm">
                {isSquatting ? "SQUATTING ⬇️" : "STANDING 🧍"}
            </div>
            {/* Overlay info */}
            <div className="absolute bottom-4 left-4 text-white text-xs opacity-70">
                Powered by MediaPipe
            </div>
        </div>
    );
};
