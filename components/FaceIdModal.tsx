import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CheckCircle2,
  ShieldAlert,
  ScanFace,
  X,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { User, SessionInfo } from '../types';

interface FaceIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUsername?: string;
  onAuthenticated: (payload: { user: User; session: SessionInfo; directory: User[] }) => void;
}

type ScanStage = 'IDLE' | 'REQUESTING_CAMERA' | 'SCANNING' | 'FACE_DETECTED' | 'PERMISSION_DENIED' | 'ERROR';

export const FaceIdModal: React.FC<FaceIdModalProps> = ({
  isOpen,
  onClose,
  defaultUsername = '',
  onAuthenticated
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [stage, setStage] = useState<ScanStage>('IDLE');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const stopCameraTracks = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUsername(defaultUsername);
      setPasscode('');
      setStage('IDLE');
      setStatusMessage('');
      setErrorMessage('');
      setDetectionConfidence(0);
      setIsSubmitting(false);
    } else {
      stopCameraTracks();
    }
    return () => {
      stopCameraTracks();
    };
  }, [isOpen, defaultUsername, stopCameraTracks]);

  // Analyze video frame for subject presence without transmitting or saving frames
  const detectFaceInFrame = useCallback(async (video: HTMLVideoElement): Promise<boolean> => {
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return false;
    }

    // Use native browser FaceDetector if supported
    const FaceDetectorCtor = (window as unknown as { FaceDetector?: new (opts?: any) => { detect: (img: HTMLVideoElement) => Promise<any[]> } }).FaceDetector;
    if (FaceDetectorCtor) {
      try {
        const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await detector.detect(video);
        return Array.isArray(faces) && faces.length > 0;
      } catch {
        // Fallback to local canvas luminance/contrast analysis
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return false;
    const width = 160;
    const height = 120;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(video, 0, 0, width, height);
    const centerData = ctx.getImageData(width * 0.25, height * 0.15, width * 0.5, height * 0.7).data;

    let totalLuma = 0;
    let lumaVarianceSum = 0;
    let skinTonePixels = 0;
    const pixelCount = centerData.length / 4;

    for (let i = 0; i < centerData.length; i += 4) {
      const r = centerData[i];
      const g = centerData[i + 1];
      const b = centerData[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuma += luma;

      // Broad inclusive skin-tone & facial shading heuristic
      if (r > 55 && g > 35 && b > 20 && r >= g && r - b > 10) {
        skinTonePixels++;
      }
    }

    const avgLuma = totalLuma / pixelCount;
    for (let i = 0; i < centerData.length; i += 4) {
      const luma = 0.299 * centerData[i] + 0.587 * centerData[i + 1] + 0.114 * centerData[i + 2];
      lumaVarianceSum += Math.abs(luma - avgLuma);
    }
    const avgDeviation = lumaVarianceSum / pixelCount;
    const skinRatio = skinTonePixels / pixelCount;

    // Requires non-dark, non-uniform camera feed with a subject present in center frame
    return avgLuma > 25 && avgLuma < 245 && avgDeviation > 8 && skinRatio > 0.06;
  }, []);

  const handleStartBiometricScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !passcode) {
      setErrorMessage('Enter your username and passcode to authorize the Face ID simulation.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStage('ERROR');
      setErrorMessage('Camera preview is unavailable in this browser. Please use standard password sign-in.');
      return;
    }

    setStage('REQUESTING_CAMERA');
    setStatusMessage('Requesting camera permission...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStage('SCANNING');
      setStatusMessage('Position your face within the oval guide...');

      let positiveFrames = 0;
      let attempts = 0;
      const maxAttempts = 60;

      const runFrameCheck = async () => {
        if (!streamRef.current || !videoRef.current) return;
        attempts++;
        const detected = await detectFaceInFrame(videoRef.current);

        if (detected) {
          positiveFrames++;
          setDetectionConfidence(Math.min(100, positiveFrames * 20));
        } else {
          positiveFrames = Math.max(0, positiveFrames - 1);
          setDetectionConfidence(Math.min(100, positiveFrames * 20));
        }

        if (positiveFrames >= 5) {
          setStage('FACE_DETECTED');
          setStatusMessage('Face detected in frame. Establishing authenticated session...');
          stopCameraTracks();
          await completeAuthenticatedLogin();
          return;
        }

        if (attempts >= maxAttempts) {
          stopCameraTracks();
          setStage('ERROR');
          setErrorMessage('No face detected clearly in frame. Ensure good lighting or use password login.');
          return;
        }

        scanTimerRef.current = window.setTimeout(() => {
          rafRef.current = requestAnimationFrame(() => {
            void runFrameCheck();
          });
        }, 180);
      };

      scanTimerRef.current = window.setTimeout(() => {
        rafRef.current = requestAnimationFrame(() => {
          void runFrameCheck();
        });
      }, 450);
    } catch (err: any) {
      stopCameraTracks();
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setStage('PERMISSION_DENIED');
        setErrorMessage(
          'Camera permission was denied. Enable camera access in your browser settings or sign in using your password.'
        );
      } else {
        setStage('ERROR');
        setErrorMessage(
          'Unable to access camera hardware. Please continue with conventional username and password sign-in.'
        );
      }
    }
  };

  const completeAuthenticatedLogin = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/biometric-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          passcode,
          biometricFrameVerified: true,
          rememberMe: false
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setStage('ERROR');
        setErrorMessage(data.error || 'Authentication failed. Check your credentials.');
        setIsSubmitting(false);
        return;
      }

      onAuthenticated(data);
      onClose();
    } catch {
      setStage('ERROR');
      setErrorMessage('Network error while establishing session.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1C3D5A]/55 backdrop-blur-xs"
        onClick={() => {
          stopCameraTracks();
          onClose();
        }}
      />
      <div className="relative bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
        <div className="px-6 py-4 bg-[#2B629B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ScanFace size={20} className="text-white" />
            <div>
              <h3 className="text-base font-display font-bold">Login with Face ID</h3>
              <p className="text-[11px] text-blue-100">Prototype Biometric Camera Simulation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraTracks();
              onClose();
            }}
            className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-white/15 transition-colors"
            aria-label="Close Face ID modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-[#F2F6FB] border border-slate-200 text-xs text-[#2A4158] leading-relaxed">
            <p className="font-semibold text-[#1C3D5A] flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-[#D99A20] shrink-0" />
              <span>Prototype Disclosure</span>
            </p>
            <p className="mt-1 text-slate-600">
              Face detection confirms live subject presence locally in your browser and never saves or transmits camera frames. It is a UI simulation and requires your account passcode authorization.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle size={15} className="text-[#E31B23] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Camera Preview Box */}
          <div className="relative aspect-[4/3] w-full rounded-xl bg-[#2B629B] overflow-hidden border border-slate-300 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${
                stage === 'SCANNING' || stage === 'FACE_DETECTED' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {stage === 'IDLE' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/95 p-5 text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
                <p className="text-sm font-semibold">Camera stays off until you start</p>
                <p className="text-xs text-blue-100">Authorize below to start face detection</p>
              </div>
            )}

            {stage === 'REQUESTING_CAMERA' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-5 text-center space-y-2">
                <ScanFace size={32} className="animate-pulse text-white" />
                <p className="text-xs font-medium">{statusMessage}</p>
              </div>
            )}

            {stage === 'SCANNING' && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-40 h-48 rounded-full border-2 border-dashed border-white/85 shadow-[0_0_0_9999px_rgba(43,98,155,0.45)] flex items-end justify-center pb-3">
                  <span className="text-[11px] font-mono bg-[#2B629B]/90 text-white px-2.5 py-0.5 rounded">
                    {detectionConfidence}%
                  </span>
                </div>
              </div>
            )}

            {stage === 'FACE_DETECTED' && (
              <div className="absolute inset-0 bg-[#16865B]/85 flex flex-col items-center justify-center text-white p-5 text-center space-y-2">
                <CheckCircle2 size={44} />
                <p className="text-sm font-bold">Face Presence Confirmed</p>
                <p className="text-xs text-white/90">{isSubmitting ? 'Signing in...' : statusMessage}</p>
              </div>
            )}

            {(stage === 'PERMISSION_DENIED' || stage === 'ERROR') && (
              <div className="absolute inset-0 bg-[#3D7AB8] flex flex-col items-center justify-center text-white p-5 text-center space-y-2">
                <Lock size={30} className="text-white" />
                <p className="text-sm font-semibold">Camera Unavailable</p>
                <p className="text-xs text-blue-100">Use standard username and password login instead.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleStartBiometricScan} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#2A4158] block mb-1">Username or Email</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={stage === 'SCANNING' || stage === 'FACE_DETECTED'}
                placeholder="Enter username"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-[#1C3D5A] focus:border-[#2B629B] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2A4158] block mb-1">
                Account Passcode Authorization
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  required
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  disabled={stage === 'SCANNING' || stage === 'FACE_DETECTED'}
                  placeholder="Verify passcode to authorize Face ID"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-[#1C3D5A] focus:border-[#2B629B] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(prev => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2B629B] p-1"
                  aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="submit"
                disabled={stage === 'SCANNING' || stage === 'REQUESTING_CAMERA' || stage === 'FACE_DETECTED'}
                className="flex-1 bg-[#2B629B] hover:bg-[#235282] disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Camera size={16} />
                <span>
                  {stage === 'SCANNING'
                    ? 'Scanning Frame...'
                    : stage === 'PERMISSION_DENIED' || stage === 'ERROR'
                    ? 'Retry Face ID Camera'
                    : 'Start Face ID Preview'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCameraTracks();
                  onClose();
                }}
                className="px-4 py-2.5 border border-slate-300 hover:bg-[#F2F6FB] text-[#2A4158] font-semibold rounded-xl text-sm transition-colors"
              >
                Use Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
