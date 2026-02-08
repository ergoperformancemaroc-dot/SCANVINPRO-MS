"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { initializeOfflineDB, addLocalVehicle, syncVehicles } from "./offline-service";

interface OfflineContextType {
  isOnline: boolean;
  syncStatus: "idle" | "syncing" | "success" | "error";
  pendingCount: number;
  syncNow: () => Promise<void>;
  addVehicleLocally: (vin: string) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [pendingCount, setPendingCount] = useState(0);

  // Initialiser IndexedDB et vérifier la connectivité
  useEffect(() => {
    const initOffline = async () => {
      try {
        await initializeOfflineDB();
        // Vérifier les éléments en attente
        const pending = await getPendingCount();
        setPendingCount(pending);
      } catch (err) {
        console.error("Erreur lors de l'initialisation offline:", err);
      }
    };

    initOffline();

    // Détecteur de connectivité
    const handleOnline = () => {
      console.log("Application en ligne");
      setIsOnline(true);
      // Essayer de synchroniser automatiquement
      syncNow();
    };

    const handleOffline = () => {
      console.log("Application hors ligne");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Vérification initiale
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getPendingCount = async () => {
    try {
      const request = indexedDB.open("VINScannerDB", 1);
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(["vehicles"], "readonly");
          const store = transaction.objectStore("vehicles");
          const countRequest = store.count();
          countRequest.onsuccess = () => resolve(countRequest.result);
        };
      });
    } catch {
      return 0;
    }
  };

  const syncNow = async () => {
    if (!isOnline) return;

    try {
      setSyncStatus("syncing");
      await syncVehicles();
      setPendingCount(0);
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch (err) {
      console.error("Erreur lors de la synchronisation:", err);
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 3000);
    }
  };

  const addVehicleLocally = async (vin: string) => {
    try {
      await addLocalVehicle(vin);
      const pending = await getPendingCount();
      setPendingCount(pending);
    } catch (err) {
      throw err;
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        syncStatus,
        pendingCount,
        syncNow,
        addVehicleLocally,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error("useOffline doit être utilisé dans OfflineProvider");
  }
  return context;
}
