/**
 * MediaPipe Singleton Service
 * Initializes MediaPipe Pose once and reuses it across component mounts
 * This dramatically improves loading times after the first use
 */

import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

// Re-export for convenience
export { POSE_CONNECTIONS, drawConnectors, drawLandmarks };

// Singleton instance
let poseInstance: Pose | null = null;
let isInitializing = false;
let initPromise: Promise<Pose> | null = null;
let onResultsCallback: ((results: any) => void) | null = null;

// Status for UI feedback
export type MediaPipeStatus = 'idle' | 'loading' | 'ready' | 'error';
let status: MediaPipeStatus = 'idle';
let statusListeners: ((status: MediaPipeStatus) => void)[] = [];

const notifyStatusChange = (newStatus: MediaPipeStatus) => {
    status = newStatus;
    statusListeners.forEach(listener => listener(newStatus));
};

export const getMediaPipeStatus = () => status;

export const subscribeToStatus = (listener: (status: MediaPipeStatus) => void) => {
    statusListeners.push(listener);
    // Immediately notify with current status
    listener(status);
    return () => {
        statusListeners = statusListeners.filter(l => l !== listener);
    };
};

/**
 * Get or initialize the MediaPipe Pose instance
 * Uses singleton pattern to avoid re-initializing on every component mount
 */
export const getPoseInstance = async (): Promise<Pose> => {
    // Already ready
    if (poseInstance && status === 'ready') {
        return poseInstance;
    }

    // Already initializing, wait for it
    if (isInitializing && initPromise) {
        return initPromise;
    }

    // Start initialization
    isInitializing = true;
    notifyStatusChange('loading');

    initPromise = new Promise<Pose>((resolve, reject) => {
        try {
            console.log('[MediaPipeService] Initializing Pose singleton...');

            const pose = new Pose({
                locateFile: (file: string) => {
                    // Determine base path based on environment
                    const basePath = window.location.hostname.includes('github.io')
                        ? '/squat-to-scroll/'
                        : '/';
                    const url = `${basePath}${file}`;
                    console.log(`[MediaPipeService] Loading asset: ${url}`);
                    return url;
                },
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.65,
                minTrackingConfidence: 0.65,
            });

            // Wrapper to allow changing callback without re-initializing
            pose.onResults((results: any) => {
                if (onResultsCallback) {
                    onResultsCallback(results);
                }
            });

            // Trigger model loading by sending a blank frame
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, 640, 480);
            }

            pose.send({ image: canvas }).then(() => {
                console.log('[MediaPipeService] Pose initialized and warmed up!');
                poseInstance = pose;
                isInitializing = false;
                notifyStatusChange('ready');
                resolve(pose);
            }).catch((err) => {
                console.error('[MediaPipeService] Warmup failed:', err);
                // Still resolve - the model might work
                poseInstance = pose;
                isInitializing = false;
                notifyStatusChange('ready');
                resolve(pose);
            });

        } catch (error) {
            console.error('[MediaPipeService] Initialization error:', error);
            isInitializing = false;
            notifyStatusChange('error');
            reject(error);
        }
    });

    return initPromise;
};

/**
 * Set the callback for pose results
 * This allows components to receive results without re-initializing
 */
export const setOnResultsCallback = (callback: (results: any) => void) => {
    onResultsCallback = callback;
};

/**
 * Clear the callback (for cleanup)
 */
export const clearOnResultsCallback = () => {
    onResultsCallback = null;
};

/**
 * Preload MediaPipe (call from HomeScreen or App)
 * This starts loading in the background before the user clicks "Start"
 */
export const preloadMediaPipe = () => {
    if (status === 'idle') {
        console.log('[MediaPipeService] Preloading MediaPipe in background...');
        getPoseInstance().catch(err => {
            console.warn('[MediaPipeService] Preload failed:', err);
        });
    }
};

/**
 * Send a frame to process
 */
export const sendFrame = async (image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => {
    if (poseInstance && status === 'ready') {
        try {
            await poseInstance.send({ image });
        } catch (err) {
            // Silently handle send errors (can happen during cleanup)
            console.warn('[MediaPipeService] Send frame error:', err);
        }
    }
};
