/* ============================================
   BarcodeScanner Component
   Opens the device camera and scans barcodes
   using html5-qrcode (works on all browsers
   including Safari/iOS). Falls back to manual
   barcode entry if camera access fails.
   ============================================ */

"use client";

import { useState, useRef, useEffect } from "react";
import { X, Keyboard, Camera } from "lucide-react";
import Button from "@/components/ui/Button";
import { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

// Unique ID for the scanner container div — html5-qrcode needs a DOM element ID
const SCANNER_ELEMENT_ID = "barrax-barcode-reader";

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Start the camera scanner on mount
  useEffect(() => {
    if (manualMode) return;

    // Small delay to ensure the DOM element exists before html5-qrcode binds to it
    const timeout = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualMode]);

  async function startScanner() {
    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Barcode detected — haptic feedback and return result
          navigator.vibrate?.(200);
          stopScanner();
          onScan(decodedText);
        },
        () => {
          // Scan failure on this frame — normal, just keep scanning
        }
      );

      setScanning(true);
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
    setScanning(false);
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

          {/* Status text overlay */}
          <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
            <p className="text-xs font-mono text-text-primary bg-black/50 inline-block px-3 py-1">
              {scanning ? "POINT AT BARCODE" : "STARTING CAMERA..."}
            </p>
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
