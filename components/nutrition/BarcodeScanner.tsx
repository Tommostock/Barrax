/* ============================================
   BarcodeScanner Component
   Opens the device camera and scans barcodes
   using html5-qrcode (works on all browsers
   including Safari/iOS). Falls back to manual
   barcode entry if camera access fails.

   Improvements:
   - 30 FPS for reliable detection
   - Responsive scan box that scales to screen
   - Torch / flashlight toggle for low light
   - Tips prompt after 6 seconds if nothing scans
   ============================================ */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Keyboard, Camera, Zap, ZapOff } from "lucide-react";
import Button from "@/components/ui/Button";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

// Unique ID for the scanner container div — html5-qrcode needs a DOM element ID
const SCANNER_ELEMENT_ID = "barrax-barcode-reader";

// Only scan for product barcode formats (skip QR, Aztec, etc.) — much faster detection
const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
];

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Torch (flashlight) state
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Show tips if no barcode is detected after a few seconds
  const [showTips, setShowTips] = useState(false);
  const tipsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate a responsive scan box that scales to the screen.
  // The box should be ~80% of the viewport width but capped so
  // it doesn't get absurdly large on tablets.
  const getScanBox = useCallback(() => {
    const vw = Math.min(window.innerWidth, 500);
    const width = Math.round(vw * 0.8);
    const height = Math.round(width * 0.5); // barcode-friendly aspect ratio
    return { width, height };
  }, []);

  // Start the camera scanner on mount
  useEffect(() => {
    if (manualMode) return;

    // Small delay to ensure the DOM element exists before html5-qrcode binds to it
    const timeout = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (tipsTimerRef.current) clearTimeout(tipsTimerRef.current);
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualMode]);

  async function startScanner() {
    try {
      // Only scan product barcode formats for faster detection.
      // Enable native BarcodeDetector API when available (Chrome/Android)
      // for significantly better recognition.
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        formatsToSupport: BARCODE_FORMATS,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 30, // Higher FPS = more chances to catch the barcode
          qrbox: getScanBox(),
          // No fixed aspectRatio — let the camera use its native ratio
          // so the feed isn't awkwardly cropped on different devices
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        (decodedText) => {
          // Barcode detected — haptic feedback and return result
          navigator.vibrate?.(200);
          if (tipsTimerRef.current) clearTimeout(tipsTimerRef.current);
          stopScanner();
          onScan(decodedText);
        },
        () => {
          // Scan failure on this frame — normal, just keep scanning
        }
      );

      setScanning(true);

      // Check if the camera supports torch (flashlight). We need to
      // reach into the underlying video track to toggle it.
      try {
        const videoElement = document.querySelector(`#${SCANNER_ELEMENT_ID} video`) as HTMLVideoElement | null;
        if (videoElement?.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
          if (track) {
            videoTrackRef.current = track;
            // Check if torch capability exists on this device
            const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
            if (capabilities?.torch) {
              setTorchAvailable(true);
            }
          }
        }
      } catch {
        // Torch detection failed — not critical, just hide the toggle
      }

      // Show scanning tips after 6 seconds if nothing has scanned yet
      tipsTimerRef.current = setTimeout(() => {
        setShowTips(true);
      }, 6000);

    } catch (err) {
      console.error("Scanner error:", err);
      setError("Could not access camera. Check permissions or use manual entry.");
      setManualMode(true);
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current?.clear();
    } catch {
      // Ignore cleanup errors
    }
    scannerRef.current = null;
    videoTrackRef.current = null;
    setScanning(false);
    setTorchOn(false);
    setTorchAvailable(false);
    setShowTips(false);
    if (tipsTimerRef.current) clearTimeout(tipsTimerRef.current);
  }

  // Toggle the camera torch / flashlight
  async function toggleTorch() {
    if (!videoTrackRef.current) return;
    try {
      const newState = !torchOn;
      await videoTrackRef.current.applyConstraints({
        advanced: [{ torch: newState } as MediaTrackConstraintSet],
      });
      setTorchOn(newState);
    } catch {
      // Torch toggle failed — some browsers block this
    }
  }

  function handleManualSubmit() {
    const code = manualBarcode.trim();
    if (code.length >= 8) {
      onScan(code);
    }
  }

  function handleClose() {
    stopScanner();
    onClose();
  }

  function switchToManual() {
    stopScanner();
    setManualMode(true);
  }

  function switchToCamera() {
    setError(null);
    setManualMode(false);
  }

  return (
    <div className="fixed inset-0 z-[200] bg-bg-primary flex flex-col safe-top">
      {/* Header — padded below the iOS status bar */}
      <div className="flex items-center justify-between p-4 pt-2 border-b border-green-dark">
        <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
          {manualMode ? "ENTER BARCODE" : "SCAN BARCODE"}
        </h3>
        <button onClick={handleClose}
          className="text-text-secondary hover:text-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={20} />
        </button>
      </div>

      {manualMode ? (
        /* Manual barcode entry */
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <Keyboard size={40} className="text-text-secondary" />
          <p className="text-xs text-text-secondary text-center">
            Enter the barcode number from the product packaging.
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            placeholder="e.g. 5000159461122"
            className="w-full max-w-xs px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                       focus:border-green-primary focus:outline-none text-sm text-center font-mono tracking-wider"
            autoFocus
          />
          <Button onClick={handleManualSubmit} disabled={manualBarcode.length < 8}>
            LOOK UP
          </Button>
          {error && <p className="text-danger text-xs font-mono text-center">{error}</p>}

          {/* Switch back to camera */}
          <button
            onClick={switchToCamera}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-text-secondary
                       uppercase tracking-wider hover:text-green-light transition-colors min-h-[44px]"
          >
            <Camera size={14} /> USE CAMERA
          </button>
        </div>
      ) : (
        /* Camera view — html5-qrcode renders into this container */
        <div className="flex-1 relative overflow-hidden">
          {/* html5-qrcode injects the video element into this div */}
          <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />

          {/* Torch toggle — only shown if the device camera supports it */}
          {torchAvailable && (
            <button
              onClick={toggleTorch}
              className={`absolute top-4 left-4 px-3 py-2 border text-xs font-mono
                         min-h-[44px] min-w-[44px] flex items-center gap-2 z-10 transition-colors
                         ${torchOn
                           ? "bg-xp-gold/20 border-xp-gold text-xp-gold"
                           : "bg-bg-panel/80 border-green-dark text-text-secondary"
                         }`}
            >
              {torchOn ? <ZapOff size={16} /> : <Zap size={16} />}
              {torchOn ? "FLASH ON" : "FLASH"}
            </button>
          )}

          {/* Status text overlay */}
          <div className="absolute bottom-0 left-0 right-0 text-center pointer-events-none pb-20">
            <p className="text-xs font-mono text-text-primary bg-black/50 inline-block px-3 py-1">
              {scanning ? "POINT AT BARCODE" : "STARTING CAMERA..."}
            </p>

            {/* Scanning tips — appear after 6 seconds with no result to
                help the user troubleshoot without giving up */}
            {showTips && scanning && (
              <div className="mt-3 mx-6 bg-black/70 px-4 py-3 pointer-events-auto">
                <p className="text-[0.65rem] font-mono text-text-secondary uppercase tracking-wider mb-2">
                  HAVING TROUBLE?
                </p>
                <ul className="text-[0.6rem] text-text-secondary text-left space-y-1 font-mono">
                  <li>- Hold steady and close to the barcode</li>
                  <li>- Make sure the barcode is well-lit{torchAvailable ? " (try the torch)" : ""}</li>
                  <li>- Keep the barcode flat, not angled</li>
                  <li>- Avoid glare from overhead lights</li>
                </ul>
              </div>
            )}
          </div>

          {/* Switch to manual mode */}
          <button
            onClick={switchToManual}
            className="absolute top-4 right-4 px-3 py-2 bg-bg-panel/80 border border-green-dark
                       text-xs font-mono text-text-secondary min-h-[44px] z-10"
          >
            TYPE BARCODE
          </button>
        </div>
      )}
    </div>
  );
}
