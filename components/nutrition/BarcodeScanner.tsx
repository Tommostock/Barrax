/* ============================================
   BarcodeScanner Component
   Opens the device camera and scans barcodes
   using the Barcode Detection API (Chrome) or
   manual input fallback for unsupported browsers.
   ============================================ */

"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X, Keyboard } from "lucide-react";
import Button from "@/components/ui/Button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const streamRef = useRef<MediaStream | null>(null);

  // Start the camera and begin scanning
  useEffect(() => {
    if (manualMode) return;

    let animationId: number;
    let detector: BarcodeDetector | null = null;

    async function startCamera() {
      try {
        // Check if BarcodeDetector API is available
        if (!("BarcodeDetector" in window)) {
          setError("Barcode scanning not supported in this browser. Use manual entry.");
          setManualMode(true);
          return;
        }

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Create barcode detector
        detector = new BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });

        setScanning(true);

        // Scan loop — check for barcodes every 500ms
        async function scanFrame() {
          if (!videoRef.current || !detector) return;

          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code) {
                // Haptic feedback on successful scan
                navigator.vibrate?.(200);
                stopCamera();
                onScan(code);
                return;
              }
            }
          } catch {
            // Detection can fail on some frames — just try again
          }

          animationId = requestAnimationFrame(() => {
            setTimeout(scanFrame, 300);
          });
        }

        scanFrame();

      } catch (err) {
        console.error("Camera error:", err);
        setError("Could not access camera. Check permissions or use manual entry.");
        setManualMode(true);
      }
    }

    startCamera();

    return () => {
      cancelAnimationFrame(animationId);
      stopCamera();
    };
  }, [manualMode, onScan]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  function handleManualSubmit() {
    const code = manualBarcode.trim();
    if (code.length >= 8) {
      onScan(code);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-green-dark">
        <h3 className="text-sm font-heading uppercase tracking-wider text-sand">
          {manualMode ? "ENTER BARCODE" : "SCAN BARCODE"}
        </h3>
        <button onClick={() => { stopCamera(); onClose(); }}
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
            placeholder="e.g. 5000159461122"
            className="w-full max-w-xs px-4 py-3 bg-bg-input border border-green-dark text-text-primary
                       focus:border-green-primary focus:outline-none text-sm text-center font-mono tracking-wider"
          />
          <Button onClick={handleManualSubmit} disabled={manualBarcode.length < 8}>
            LOOK UP
          </Button>
          {error && <p className="text-danger text-xs font-mono">{error}</p>}
        </div>
      ) : (
        /* Camera view */
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scanning overlay with target frame */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-32 border-2 border-green-primary relative">
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-light" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-light" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-light" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-light" />

              {/* Scan line animation */}
              {scanning && (
                <div className="absolute left-0 right-0 h-0.5 bg-green-primary animate-scan-line" />
              )}
            </div>
          </div>

          {/* Status text */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-xs font-mono text-text-primary bg-black/50 inline-block px-3 py-1">
              {scanning ? "SCANNING..." : "INITIALIZING CAMERA..."}
            </p>
          </div>

          {/* Switch to manual mode */}
          <button
            onClick={() => { stopCamera(); setManualMode(true); }}
            className="absolute top-4 right-4 px-3 py-2 bg-bg-panel/80 border border-green-dark
                       text-xs font-mono text-text-secondary"
          >
            TYPE BARCODE
          </button>
        </div>
      )}
    </div>
  );
}

// TypeScript declaration for BarcodeDetector API
// (not in lib.dom.d.ts yet for all browsers)
declare global {
  class BarcodeDetector {
    constructor(options?: { formats: string[] });
    detect(source: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<{ rawValue: string }[]>;
  }
}
