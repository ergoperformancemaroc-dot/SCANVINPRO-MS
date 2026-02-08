"use client";

import React, { useEffect, useRef, useState } from "react";
import { BarcodeFormat, BrowserMultiFormatReader } from "@zxing/library";
import { preprocessImage, validateVIN, enhanceForVINDetection } from "@/lib/image-processing";
import { useOffline } from "@/lib/offline-context";
import { useAuth } from "@/lib/auth-context";

interface VinScannerProps {
  onVinDetected: (vin: string) => Promise<void>;
  isLoading?: boolean;
}

export function VinScanner({ onVinDetected, isLoading = false }: VinScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"camera" | "upload" | "manual">("camera");
  const [detectedVin, setDetectedVin] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [manualVin, setManualVin] = useState<string>("");
  const [processingImages, setProcessingImages] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const { isOnline } = useOffline();
  const { user } = useAuth();

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Initialiser le lecteur de codes-barres
  useEffect(() => {
    if (!readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader();
    }

    return () => {
      if (cameraActive) {
        readerRef.current?.reset();
      }
    };
  }, []);

  // Démarrer la caméra
  useEffect(() => {
    if (mode !== "camera") {
      setCameraActive(false);
      readerRef.current?.reset();
      return;
    }

    const startCamera = async () => {
      try {
        setError(null);
        if (!videoRef.current) return;

        await readerRef.current?.decodeFromVideoElement(
          videoRef.current,
          async (result) => {
            if (result?.getText()) {
              const vin = result.getText().toUpperCase();
              const validation = validateVIN(vin);

              if (validation.valid) {
                setDetectedVin(vin);
                readerRef.current?.reset();
                setCameraActive(false);
                await onVinDetected(vin);
              }
            }
          }
        );

        setCameraActive(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors du démarrage de la caméra";
        setError(message);
        console.error("Erreur caméra:", err);
      }
    };

    startCamera();

    return () => {
      if (cameraActive) {
        readerRef.current?.reset();
      }
    };
  }, [mode, cameraActive, onVinDetected]);

  /**
   * Traiter une image téléchargée
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProcessingImages(true);
      setError(null);

      // Essayer d'abord avec ZXing
      const img = new Image();
      img.src = URL.createObjectURL(file);

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      let foundVin: string | null = null;

      // Essayer ZXing d'abord
      try {
        if (readerRef.current) {
          const result = await readerRef.current.decodeFromImageElement(img);
          if (result?.getText()) {
            foundVin = result.getText().toUpperCase();
          }
        }
      } catch (zxingErr) {
        console.log("ZXing ne peut pas lire cette image, essai du prétraitement...");
      }

      // Si ZXing n'a pas trouvé, essayer avec prétraitement
      if (!foundVin) {
        const enhancements = await enhanceForVINDetection(file);

        // Essayer chaque version améliorée
        const canvases = [
          enhancements.enhanced1,
          enhancements.enhanced2,
          enhancements.enhanced3,
        ];

        for (const canvas of canvases) {
          try {
            if (readerRef.current) {
              const result = await readerRef.current.decodeFromCanvasElement(canvas);
              if (result?.getText()) {
                foundVin = result.getText().toUpperCase();
                break;
              }
            }
          } catch {
            // Continuer avec le prochaine version
          }
        }
      }

      if (foundVin) {
        const validation = validateVIN(foundVin);
        if (validation.valid) {
          setDetectedVin(foundVin);
          await onVinDetected(foundVin);
        } else {
          setError(validation.error || "VIN invalide");
        }
      } else {
        setError("Impossibile de lire le VIN. Essayez une autre photo ou saisie manuelle.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors du traitement";
      setError(message);
    } finally {
      setProcessingImages(false);
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * Valider et soumettre le VIN saisi manuellement
   */
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateVIN(manualVin);
    if (!validation.valid) {
      setError(validation.error || "VIN invalide");
      return;
    }

    try {
      setDetectedVin(manualVin);
      await onVinDetected(manualVin);
      setManualVin("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de la soumission";
      setError(message);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Sélecteur de mode */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["camera", "upload", "manual"].map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m as "camera" | "upload" | "manual");
              setError(null);
              setDetectedVin("");
            }}
            disabled={isLoading || processingImages}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {m === "camera" && "📷 Caméra"}
            {m === "upload" && "📸 Photo"}
            {m === "manual" && "✏️ Manuel"}
          </button>
        ))}
      </div>

      {/* Mode Caméra */}
      {mode === "camera" && (
        <div className="space-y-4">
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-yellow-400 rounded-lg"></div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Alignez le code-barres VIN dans le cadre jaune
          </p>
        </div>
      )}

      {/* Mode Upload */}
      {mode === "upload" && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center hover:border-blue-600 transition-colors cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isLoading || processingImages}
              className="hidden"
            />
            <label
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer block"
            >
              <div className="text-4xl mb-2">📸</div>
              <p className="font-medium text-gray-700">
                {processingImages ? "Traitement..." : "Choisir une photo"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                JPG, PNG jusqu'à 5MB
              </p>
            </label>
          </div>

          {processingImages && (
            <div className="flex justify-center">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      )}

      {/* Mode Manuel */}
      {mode === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Entrez le VIN (17 caractères)"
            value={manualVin}
            onChange={(e) => setManualVin(e.target.value.toUpperCase())}
            maxLength={17}
            disabled={isLoading}
            className="form-input font-mono text-lg text-center tracking-widest"
          />
          <button
            type="submit"
            disabled={isLoading || manualVin.length !== 17}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Traitement..." : "Valider"}
          </button>
        </form>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <div className="alert-error mt-4">
          <p className="font-medium">Erreur</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Affichage du VIN détecté */}
      {detectedVin && (
        <div className="alert-success mt-4">
          <p className="font-medium">VIN détecté ✓</p>
          <p className="font-mono text-lg tracking-widest mt-2">{detectedVin}</p>
        </div>
      )}

      {/* Status de connectivité */}
      {!isOnline && (
        <div className="alert-warning mt-4">
          <p className="text-sm">
            📡 Mode hors ligne activé - Les scans seront synchronisés quand vous serez en ligne
          </p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
