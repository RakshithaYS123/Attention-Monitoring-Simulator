import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";

const AttentionMonitor = ({ user }) => {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // State
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [attention, setAttention] = useState({
    isAttentive: true,
    attentiveTime: 0,
    distractedTime: 0,
    attentionSwitches: 0,
    currentState: "attentive",
    stateStartTime: Date.now(),
    sessionStartTime: null,
  });
  const [error, setError] = useState("");
  const [webcamInitialized, setWebcamInitialized] = useState(false);

  // Constants for attention detection
  const FACE_DETECTION_THRESHOLD = 0.7; // Threshold for face detection confidence
  const NO_FACE_TIMEOUT = 1500; // Time in ms before marking as distracted when no face is detected
  const lastFaceDetectionRef = useRef(Date.now()); // Time of last successful face detection

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      try {
        // Use the correct path to your models directory
        // Models should be in the public folder for proper access
        const MODEL_URL = process.env.PUBLIC_URL + "/models";

        console.log("Loading models from:", MODEL_URL);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        console.log("Models loaded successfully");
        setModelsLoaded(true);
        setIsLoading(false);
      } catch (err) {
        setError(`Failed to load facial recognition models: ${err.message}`);
        setIsLoading(false);
        console.error("Error loading models:", err);
      }
    };

    loadModels();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Start webcam - only initialize once
  const startWebcam = async () => {
    if (!modelsLoaded) {
      setError("Face detection models not loaded yet");
      return;
    }

    if (webcamInitialized) return; // Prevent multiple initializations

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setWebcamInitialized(true);
      }

      setError("");
    } catch (err) {
      setError("Failed to access webcam");
      console.error("Error accessing webcam:", err);
    }
  };

  // Start monitoring session
  const startMonitoring = () => {
    if (!streamRef.current) {
      startWebcam().then(() => {
        initializeMonitoring();
      });
    } else {
      initializeMonitoring();
    }
  };

  const initializeMonitoring = () => {
    lastFaceDetectionRef.current = Date.now(); // Reset the face detection time
    setAttention({
      ...attention,
      isAttentive: true,
      currentState: "attentive",
      stateStartTime: Date.now(),
      sessionStartTime: Date.now(),
      attentiveTime: 0,
      distractedTime: 0,
      attentionSwitches: 0,
    });
    setIsMonitoring(true);
  };

  // Stop monitoring session
  const stopMonitoring = async () => {
    setIsMonitoring(false);

    // Calculate final metrics before stopping
    const now = Date.now();
    let finalAttentiveTime = attention.attentiveTime;
    let finalDistractedTime = attention.distractedTime;

    // Add the current state duration
    const currentStateDuration = (now - attention.stateStartTime) / 1000;
    if (attention.currentState === "attentive") {
      finalAttentiveTime += currentStateDuration;
    } else {
      finalDistractedTime += currentStateDuration;
    }

    // Save session to database
    try {
      const token = localStorage.getItem("token");
      const totalDuration = (now - attention.sessionStartTime) / 1000;

      await axios.post(
        "http://localhost:5000/api/sessions",
        {
          attentiveTime: finalAttentiveTime,
          distractedTime: finalDistractedTime,
          attentionSwitches: attention.attentionSwitches,
          totalDuration: totalDuration,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      console.error("Error saving session:", err);
    }
  };

  // Reset monitoring session
  const resetMonitoring = () => {
    lastFaceDetectionRef.current = Date.now(); // Reset the face detection time
    setAttention({
      ...attention,
      isAttentive: true,
      currentState: "attentive",
      stateStartTime: Date.now(),
      sessionStartTime: Date.now(),
      attentiveTime: 0,
      distractedTime: 0,
      attentionSwitches: 0,
    });
  };

  // Function to determine if the person is attentive
  const determineAttention = (detections) => {
    const now = Date.now();

    // If we have face detections
    if (detections && detections.length > 0) {
      const bestDetection = detections.reduce((prev, current) =>
        prev.detection.score > current.detection.score ? prev : current
      );

      // If we have a good face detection
      if (bestDetection.detection.score > FACE_DETECTION_THRESHOLD) {
        lastFaceDetectionRef.current = now; // Update the last time we saw a face
        return true; // Person is attentive
      }
    }

    // No good face detection - check if we're within the timeout period before marking as distracted
    const timeSinceLastFace = now - lastFaceDetectionRef.current;
    return timeSinceLastFace < NO_FACE_TIMEOUT;
  };

  // Function to update attention state - using useCallback to fix dependency warning
  const updateAttentionState = useCallback((isCurrentlyAttentive) => {
    const now = Date.now();
    setAttention((prev) => {
      const prevState = prev.currentState;
      const newState = isCurrentlyAttentive ? "attentive" : "distracted";

      // If state hasn't changed, return the previous state
      if (prevState === newState) {
        return prev;
      }

      // Calculate time spent in previous state
      const stateDuration = (now - prev.stateStartTime) / 1000;

      // Create a new state object
      const newAttention = { ...prev };

      // Update appropriate time counter
      if (prevState === "attentive") {
        newAttention.attentiveTime += stateDuration;
      } else {
        newAttention.distractedTime += stateDuration;
      }

      // Update state and counters
      newAttention.currentState = newState;
      newAttention.isAttentive = isCurrentlyAttentive;
      newAttention.stateStartTime = now;
      newAttention.attentionSwitches += 1;

      return newAttention;
    });
  }, []);

  // Face detection logic
  useEffect(() => {
    if (
      !isMonitoring ||
      !videoRef.current ||
      !canvasRef.current ||
      !modelsLoaded
    )
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    let animationId;

    // Set canvas dimensions to match video
    canvas.width = video.width;
    canvas.height = video.height;

    const detectFaces = async () => {
      if (!video.paused && !video.ended && video.readyState >= 2) {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw detections
        if (detections && detections.length > 0) {
          faceapi.draw.drawDetections(canvas, detections);
          faceapi.draw.drawFaceLandmarks(canvas, detections);
        }

        // Determine attention state using our improved logic
        const isCurrentlyAttentive = determineAttention(detections);
        updateAttentionState(isCurrentlyAttentive);
      }

      animationId = requestAnimationFrame(detectFaces);
    };

    detectFaces();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isMonitoring, modelsLoaded, updateAttentionState]);

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Calculate session duration
  const getSessionDuration = () => {
    if (!attention.sessionStartTime) return 0;
    return (Date.now() - attention.sessionStartTime) / 1000;
  };

  // Initialize webcam only when video element is ready
  useEffect(() => {
    if (videoRef.current && modelsLoaded && !webcamInitialized) {
      startWebcam();
    }
  }, [videoRef.current, modelsLoaded, webcamInitialized]);

  return (
    <div className="monitor-container">
      <h2>Attention Monitoring</h2>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <p>Loading face detection models...</p>
      ) : (
        <>
          <div className="video-container">
            <video
              ref={videoRef}
              className="video-feed"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="canvas-overlay" />
          </div>

          <div className="status-indicator">
            <div
              className={`status-dot ${
                attention.isAttentive ? "attentive" : "distracted"
              }`}
            ></div>
            <span>
              Status: {attention.isAttentive ? "Attentive" : "Distracted"}
            </span>
          </div>

          <div className="metrics-container">
            <div className="metric-card">
              <div className="metric-value">
                {formatTime(attention.attentiveTime)}
              </div>
              <div className="metric-label">Time Attentive</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">
                {formatTime(attention.distractedTime)}
              </div>
              <div className="metric-label">Time Distracted</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{attention.attentionSwitches}</div>
              <div className="metric-label">Attention Switches</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">
                {formatTime(getSessionDuration())}
              </div>
              <div className="metric-label">Total Duration</div>
            </div>
          </div>

          <div className="control-buttons">
            {isMonitoring ? (
              <>
                <button
                  className="control-button stop-btn"
                  onClick={stopMonitoring}
                >
                  Stop Monitoring
                </button>
                <button
                  className="control-button reset-btn"
                  onClick={resetMonitoring}
                >
                  Reset
                </button>
              </>
            ) : (
              <button
                className="control-button start-btn"
                onClick={startMonitoring}
              >
                Start Monitoring
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AttentionMonitor;
