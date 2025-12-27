import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Dumbbell, ArrowDown, ArrowUp, Pause, Check, AlertTriangle } from 'lucide-react';
import { SoundFX } from '../utils/audio';
import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

interface DetectionScreenProps {
  targetSquats: number;
  onComplete: () => void;
  onCancel: () => void;
}

// Geometry helper to calculate angle between three points
const calculateAngle = (a: any, b: any, c: any) => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return angle;
};

// Strict Thresholds
const THRESHOLD_STAND = 165; // Must extend legs fully
const THRESHOLD_SQUAT = 100; // Must go below parallel-ish
const THRESHOLD_WARN_DEPTH = 130; // Zone where user thinks they are low enough but aren't

const DetectionScreen: React.FC<DetectionScreenProps> = ({ targetSquats, onComplete, onCancel }) => {
  // UI State
  const [squatsDoneUI, setSquatsDoneUI] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [feedback, setFeedback] = useState<string>("Initializing Camera...");
  const [feedbackColor, setFeedbackColor] = useState<string>("text-white");
  const [loading, setLoading] = useState(true);
  const [poseStateUI, setPoseStateUI] = useState<'UP' | 'DOWN'>('UP');

  // Logic State (Refs) - Critical for avoiding stale closures in the loop
  const squatsDoneRef = useRef(0);
  const poseStateRef = useRef<'UP' | 'DOWN'>('UP');
  const lowestAngleRef = useRef(180); // Track lowest angle achieved in current rep
  const isPausedRef = useRef(false);
  const targetSquatsRef = useRef(targetSquats);

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const poseRef = useRef<any>(null);

  // Update refs when props/state change
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    targetSquatsRef.current = targetSquats;
  }, [targetSquats]);

  useEffect(() => {
    // Initialize Audio Engine
    SoundFX.init();

    // MediaPipe Initialization
    // MediaPipe Initialization
    const initMediaPipe = async () => {
      // NOTE: We are using the imported classes, so we don't check window.Pose
      try {
        setFeedback("Loading AI Model...");
        console.log("Initializing Pose...");
        const pose = new Pose({
          locateFile: (file: string) => {
            // Files are copied to root by vite-plugin-static-copy
            const url = `/${file}`;
            console.log(`Loading MediaPipe asset: ${url}`);
            return url;
          },
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.65, // Increased confidence for better accuracy
          minTrackingConfidence: 0.65,
        });

        pose.onResults(onResults);
        poseRef.current = pose;

        if (videoRef.current) {
          setFeedback("Requesting Camera...");
          console.log("Requesting Camera access...");
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (!isPausedRef.current && poseRef.current) {
                await poseRef.current.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720,
          });
          cameraRef.current = camera;

          // Camera Start Promise with Timeout
          const cameraStartPromise = camera.start();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Camera start timeout")), 10000)
          );

          try {
            await Promise.race([cameraStartPromise, timeoutPromise]);
            console.log("Camera started successfully");
            setLoading(false);
            setFeedback("Stand in frame");
          } catch (camError) {
            console.error("Camera failed to start:", camError);
            setLoading(false);
            setFeedback("Camera Error: Check Permissions");
            setFeedbackColor("text-accent-red");
          }
        }
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
        setLoading(false);
        setFeedback("AI Init Error");
        setFeedbackColor("text-accent-red");
      }
    };

    const timeout = setTimeout(initMediaPipe, 100);

    return () => {
      clearTimeout(timeout);
      if (cameraRef.current) cameraRef.current.stop();
      if (poseRef.current) poseRef.current.close();
    };
  }, []);

  // Update loop for results
  const onResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Maintain aspect ratio for drawing
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // 1. Draw Video
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image scaling to cover
    const videoRatio = results.image.width / results.image.height;
    const canvasRatio = canvas.width / canvas.height;
    let drawWidth, drawHeight, startX, startY;

    if (videoRatio > canvasRatio) {
      drawHeight = canvas.height;
      drawWidth = drawHeight * videoRatio;
      startX = (canvas.width - drawWidth) / 2;
      startY = 0;
    } else {
      drawWidth = canvas.width;
      drawHeight = drawWidth / videoRatio;
      startX = 0;
      startY = (canvas.height - drawHeight) / 2;
    }

    ctx.drawImage(results.image, startX, startY, drawWidth, drawHeight);

    // Darken video slightly for UI contrast
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // Slightly darker for better visibility
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Skeleton
    if (results.poseLandmarks) {

      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#ffffff',
        lineWidth: 3,
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: '#00ff9d',
        lineWidth: 2,
        radius: 4,
      });

      // 3. Calculate Squat Logic
      const landmarks = results.poseLandmarks;

      // Visibility threshold - ensure legs are visible
      if (landmarks[23].visibility > 0.6 && landmarks[25].visibility > 0.6 && landmarks[27].visibility > 0.6) {

        const leftHip = landmarks[23];
        const leftKnee = landmarks[25];
        const leftAnkle = landmarks[27];
        const rightHip = landmarks[24];
        const rightKnee = landmarks[26];
        const rightAnkle = landmarks[28];

        const leftAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

        const angle = (leftAngle + rightAngle) / 2;

        // Visual Feedback: Angle Coloring
        let angleColor = "#ffffff";
        if (angle < THRESHOLD_SQUAT) angleColor = "#00ff9d"; // Good
        else if (angle < THRESHOLD_WARN_DEPTH) angleColor = "#fbbf24"; // Warning

        // Draw Angle
        const textX = leftKnee.x * canvas.width + 30;
        const textY = leftKnee.y * canvas.height;

        ctx.font = "bold 40px 'Lexend', sans-serif";
        ctx.fillStyle = angleColor;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeText(`${Math.round(angle)}°`, textX, textY);
        ctx.fillText(`${Math.round(angle)}°`, textX, textY);

        // --- STATE MACHINE ---

        // Track lowest point of this movement
        if (poseStateRef.current === 'UP' && angle < 160) {
          if (angle < lowestAngleRef.current) {
            lowestAngleRef.current = angle;
          }
        }

        // 1. Transition to DOWN (Squatting)
        if (angle < THRESHOLD_SQUAT) {
          if (poseStateRef.current === 'UP') {
            poseStateRef.current = 'DOWN';
            setPoseStateUI('DOWN');
            lowestAngleRef.current = angle; // Reset tracking

            SoundFX.playSquatDown();
            setFeedback("NOW STAND UP!");
            setFeedbackColor("text-success");
          } else {
            // Already down
            setFeedback("HOLD / UP");
            setFeedbackColor("text-success");
          }
        }
        // 2. Transition to UP (Standing)
        else if (angle > THRESHOLD_STAND) {
          if (poseStateRef.current === 'DOWN') {
            // Successful Rep
            poseStateRef.current = 'UP';
            setPoseStateUI('UP');
            squatsDoneRef.current += 1;
            setSquatsDoneUI(squatsDoneRef.current);
            lowestAngleRef.current = 180; // Reset

            if (squatsDoneRef.current >= targetSquatsRef.current) {
              SoundFX.playVictory();
              isPausedRef.current = true;
              setIsPaused(true);
              setTimeout(onComplete, 800);
            } else {
              SoundFX.playRepComplete();
            }

            setFeedback("GOOD REP!");
            setFeedbackColor("text-success");
          }
          else {
            // We are UP, checking for failed reps (cheating)
            // If user dipped but didn't hit threshold, and is now standing again
            if (lowestAngleRef.current < 160 && lowestAngleRef.current > THRESHOLD_SQUAT) {
              SoundFX.playFailure();
              setFeedback("NOT LOW ENOUGH!");
              setFeedbackColor("text-accent-red");
              // Reset tracker so we don't spam error
              lowestAngleRef.current = 180;
            } else {
              setFeedback("SQUAT DOWN");
              setFeedbackColor("text-white");
              lowestAngleRef.current = 180;
            }
          }
        }
        // 3. Intermediate Zone
        else {
          if (poseStateRef.current === 'UP') {
            if (angle < THRESHOLD_WARN_DEPTH) {
              setFeedback("GO LOWER!");
              setFeedbackColor("text-accent-red animate-pulse");
            } else {
              setFeedback("GO DOWN");
              setFeedbackColor("text-white");
            }
          } else if (poseStateRef.current === 'DOWN') {
            setFeedback("STAND UP FULLY!");
            setFeedbackColor("text-white");
          }
        }

      } else {
        setFeedback("Show full body");
        setFeedbackColor("text-white");
      }
    } else {
      setFeedback(loading ? (feedback === "Initializing Camera..." ? "Loading..." : feedback) : "No person detected");
      setFeedbackColor(feedbackColor.includes('red') ? "text-accent-red" : "text-white");
    }
    ctx.restore();
  };

  return (
    <div className="bg-background-dark font-display text-white overflow-hidden h-screen w-full flex flex-col relative">
      {/* Scanlines Overlay */}
      <div className="fixed inset-0 scanlines opacity-30 pointer-events-none z-50"></div>

      <div className="flex flex-col lg:flex-row h-full w-full">

        {/* Video Zone */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center lg:border-r border-white/10 order-2 lg:order-1 h-full max-h-screen">
          <video ref={videoRef} className="absolute opacity-0 pointer-events-none" playsInline muted></video>
          <canvas ref={canvasRef} className="w-full h-full object-cover"></canvas>

          {/* Floating Feedback */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
            <div className={`bg-surface-dark/95 backdrop-blur-xl border-2 ${feedbackColor.includes('red') ? 'border-accent-red' : (poseStateUI === 'DOWN' ? 'border-success' : 'border-white/20')} px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 transition-all duration-200 transform hover:scale-105`}>
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                feedbackColor.includes('red') ? <AlertTriangle className="text-accent-red text-3xl animate-bounce" /> :
                  (poseStateUI === 'DOWN' ? <ArrowUp className="text-success text-3xl animate-bounce" /> : <ArrowDown className="text-accent-green text-3xl animate-bounce" />)
              )}
              <p className={`font-black text-2xl leading-none tracking-wide whitespace-nowrap ${feedbackColor}`}>{feedback}</p>
            </div>
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none z-10"></div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-[400px] xl:w-[480px] bg-background-dark/95 backdrop-blur-sm z-30 flex flex-col justify-between p-6 lg:p-10 order-1 lg:order-2 shadow-2xl">
          <div className="flex justify-between items-start mb-4 lg:mb-12">
            <button
              onClick={() => { SoundFX.playClick(); onCancel(); }}
              className="p-3 rounded-xl bg-surface-dark border border-white/10 hover:bg-white/10 transition"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10">
              <span className={`w-2 h-2 rounded-full ${loading ? 'bg-red-500' : 'bg-accent-red'} animate-pulse`}></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">LIVE FEED</span>
            </div>
            <button
              onClick={() => SoundFX.playClick()}
              className="p-3 rounded-xl bg-surface-dark border border-white/10 hover:bg-white/10 transition"
            >
              <Settings size={24} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center my-4 lg:my-0">
            <div className="relative mb-2">
              <div className="absolute inset-0 bg-accent-green/10 blur-3xl rounded-full"></div>
              <h1 className="relative z-10 text-[6rem] lg:text-[10rem] leading-none font-black tracking-tighter text-white drop-shadow-2xl tabular-nums">
                {squatsDoneUI}
              </h1>
            </div>
            <div className="h-1 w-24 bg-white/20 rounded-full my-4"></div>
            <p className="text-3xl lg:text-4xl font-bold text-white/40">{targetSquats}</p>
            <p className="text-accent-green font-bold uppercase tracking-[0.3em] text-sm mt-2 shadow-glow-green">Target Squats</p>
          </div>

          <div className="mt-4 lg:mt-auto">
            <div className="flex justify-between text-xs font-mono font-bold text-white/40 mb-2">
              <span>PROGRESS</span>
              <span>{Math.round((squatsDoneUI / targetSquats) * 100)}%</span>
            </div>
            <div className="h-3 bg-surface-dark rounded-full overflow-hidden border border-white/5 mb-8">
              <div
                className="h-full bg-accent-green shadow-[0_0_15px_rgba(0,255,157,0.5)] transition-all duration-500 ease-out"
                style={{ width: `${(squatsDoneUI / targetSquats) * 100}%` }}
              ></div>
            </div>

            <button
              onClick={() => {
                SoundFX.playClick();
                const next = !isPaused;
                setIsPaused(next);
              }}
              className="w-full bg-white hover:bg-gray-100 text-black active:scale-[0.98] transition-all rounded-2xl py-5 flex items-center justify-center gap-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] group cursor-pointer"
            >
              {isPaused ? <Check className="text-black" size={24} /> : <Pause className="text-black" size={24} />}
              <span className="font-black text-xl uppercase tracking-wider">{isPaused ? "Resume" : "Pause"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionScreen;