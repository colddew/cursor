/**
 * 手势检测器 - 封装MediaPipe Hands
 */
class GestureDetector {
    constructor(options = {}) {
        this.options = { maxHands: 2, minDetectionConfidence: 0.8, minTrackingConfidence: 0.5, ...options };
        this.hands = null;
        this.camera = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.isRunning = false;
        this.lastResults = null;
        this.onResultsCallback = null;
        this.onStatusChangeCallback = null;
        this.handDistance = 0;
        this.leftHandOpen = false;
        this.rightHandOpen = false;

        // Stability tracking
        this.confidenceMap = { left: 0, right: 0 }; // Range 0-10
        this.confidenceThreshold = 6; // Trigger at 6

        // Scale smoothing
        this.smoothedDistance = 0;
        this.distanceAlpha = 0.2; // Low pass filter factor (lower = smoother)
    }

    async init(videoElement, canvasElement) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.canvasCtx = canvasElement.getContext('2d');

        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
        });

        this.hands.setOptions({
            maxNumHands: this.options.maxHands,
            modelComplexity: 1,
            minDetectionConfidence: this.options.minDetectionConfidence,
            minTrackingConfidence: this.options.minTrackingConfidence
        });

        this.hands.onResults((results) => this.handleResults(results));
        return this;
    }

    async start() {
        if (this.isRunning) return;
        try {
            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.hands && this.isRunning) await this.hands.send({ image: this.videoElement });
                },
                width: 640, height: 480
            });
            await this.camera.start();
            this.isRunning = true;
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('active', '手势检测已启动');
        } catch (error) {
            console.error('摄像头启动失败:', error);
            if (this.onStatusChangeCallback) this.onStatusChangeCallback('error', '摄像头访问失败');
            throw error;
        }
    }

    stop() {
        if (this.camera) this.camera.stop();
        this.isRunning = false;
        if (this.onStatusChangeCallback) this.onStatusChangeCallback('stopped', '手势检测已停止');
    }

    handleResults(results) {
        this.lastResults = results;
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        if (this.canvasElement.width !== this.videoElement.videoWidth) {
            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;
        }

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) this.drawHand(landmarks);
            this.analyzeGestures(results);
        } else {
            this.handDistance = 0;
        }

        this.canvasCtx.restore();
        if (this.onResultsCallback) {
            this.onResultsCallback({
                handsDetected: results.multiHandLandmarks?.length || 0,
                distance: this.handDistance,
                leftHandOpen: this.leftHandOpen,
                rightHandOpen: this.rightHandOpen
            });
        }
    }

    drawHand(landmarks) {
        const ctx = this.canvasCtx;
        const w = this.canvasElement.width, h = this.canvasElement.height;
        const connections = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16], [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17]];

        ctx.strokeStyle = 'rgba(255, 107, 157, 0.6)';
        ctx.lineWidth = 2;
        for (const [s, e] of connections) {
            ctx.beginPath();
            ctx.moveTo(landmarks[s].x * w, landmarks[s].y * h);
            ctx.lineTo(landmarks[e].x * w, landmarks[e].y * h);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (const p of landmarks) { ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2); ctx.fill(); }

        ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
        ctx.beginPath(); ctx.arc(landmarks[9].x * w, landmarks[9].y * h, 8, 0, Math.PI * 2); ctx.fill();
    }

    analyzeGestures(results) {
        const hands = results.multiHandLandmarks;
        const handedness = results.multiHandedness;

        let rawLeftOpen = false;
        let rawRightOpen = false;

        if (hands.length >= 2) {
            const c1 = this.getPalmCenter(hands[0]), c2 = this.getPalmCenter(hands[1]);
            this.handDistance = Math.sqrt((c1.x - c2.x) ** 2 + (c1.y - c2.y) ** 2);

            for (let i = 0; i < hands.length; i++) {
                const isOpen = this.isHandOpen(hands[i]);
                if (handedness[i].label === 'Left') rawRightOpen = isOpen; // Mirror effect
                else rawLeftOpen = isOpen;
            }
        } else if (hands.length === 1) {
            const isOpen = this.isHandOpen(hands[0]);
            this.handDistance = this.getFingerSpread(hands[0]);
            // Depending on which hand is shown
            if (handedness[0].label === 'Left') rawRightOpen = isOpen;
            else rawLeftOpen = isOpen;
        }


        // Apply confidence logic instead of simple history
        this.leftHandOpen = this.updateConfidence('left', rawLeftOpen);
        this.rightHandOpen = this.updateConfidence('right', rawRightOpen);

        // Smooth distances
        if (this.handDistance > 0) {
            if (this.smoothedDistance === 0) this.smoothedDistance = this.handDistance;
            this.smoothedDistance = this.smoothedDistance * (1 - this.distanceAlpha) + this.handDistance * this.distanceAlpha;
        } else {
            // Decay slowly or reset? Let's hold
            // this.smoothedDistance *= 0.9;
        }
    }

    updateConfidence(hand, rawState) {
        // Increment if true, decrement if false
        if (rawState) {
            this.confidenceMap[hand]++;
        } else {
            this.confidenceMap[hand] -= 2; // Decay faster than build up to prevent sticky false positives
        }

        // Clamp
        this.confidenceMap[hand] = Math.max(0, Math.min(10, this.confidenceMap[hand]));

        // Hysteresis
        // If already open, stay open until low confidence
        if (hand === 'left' && this.leftHandOpen || hand === 'right' && this.rightHandOpen) {
            return this.confidenceMap[hand] > 2; // Stay open until drops below 2
        } else {
            return this.confidenceMap[hand] > this.confidenceThreshold; // Trigger open at 6
        }
    }

    getPalmCenter(lm) {
        const pts = [lm[0], lm[5], lm[9], lm[13], lm[17]];
        return { x: pts.reduce((s, p) => s + p.x, 0) / 5, y: pts.reduce((s, p) => s + p.y, 0) / 5 };
    }

    isHandOpen(lm) {
        // Detect "Open Side-C" gesture (Gaps between thumb and index)
        // User wants "open into C triggers shape", so we detect when C shape is FORMED but OPEN

        // 4 = thumb tip, 8 = index tip, 0 = wrist, 9 = middle MCP
        const thumbTip = lm[4];
        const indexTip = lm[8];
        const wrist = lm[0];
        const middleMCP = lm[9];

        const thumbIndexDist = Math.sqrt((thumbTip.x - indexTip.x) ** 2 + (thumbTip.y - indexTip.y) ** 2);
        const handScale = Math.sqrt((wrist.x - middleMCP.x) ** 2 + (wrist.y - middleMCP.y) ** 2);

        const normalizedDist = thumbIndexDist / handScale;

        // Logic Inversion & Relaxation:
        // New (Open C): normalizedDist in range [0.15, 1.8]
        // Widen detection significantly.
        // Even a flat hand (large dist) is technically "Open Side C" in concept if we want to be permissive.
        // But mainly we want to capture that specific C-shape gap.
        const isOpenC = normalizedDist > 0.15 && normalizedDist < 1.8;

        // REMOVED: "Other fingers extended" check.
        // This was causing issues because in side view, ring/pinky might fail the check.
        // Now rely purely on thumb/index relationship.

        return isOpenC;
    }

    getFingerSpread(lm) {
        const tips = [4, 8, 12, 16, 20];
        let total = 0, cnt = 0;
        for (let i = 0; i < tips.length - 1; i++) {
            for (let j = i + 1; j < tips.length; j++) {
                total += Math.sqrt((lm[tips[i]].x - lm[tips[j]].x) ** 2 + (lm[tips[i]].y - lm[tips[j]].y) ** 2);
                cnt++;
            }
        }
        return total / cnt;
    }

    onResults(cb) { this.onResultsCallback = cb; }
    onStatusChange(cb) { this.onStatusChangeCallback = cb; }

    togglePreview() {
        if (this.videoElement) {
            const isHidden = this.videoElement.style.display === 'none';
            this.videoElement.style.display = isHidden ? 'block' : 'none';
            if (this.canvasElement) this.canvasElement.style.display = isHidden ? 'block' : 'none';
            return !isHidden;
        }
        return true;
    }

    getGestureData() {
        return {
            handsDetected: this.lastResults?.multiHandLandmarks?.length || 0,
            distance: this.smoothedDistance || this.handDistance, // Return smoothed
            leftHandOpen: this.leftHandOpen,
            rightHandOpen: this.rightHandOpen,
            isRunning: this.isRunning
        };
    }
}

window.GestureDetector = GestureDetector;
