"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VinScanner } from "@/components/VinScanner";
import { useAuth } from "@/lib/auth-context";
import { useOffline } from "@/lib/offline-context";
import { supabase } from "@/lib/supabase";
import { addLocalVehicle } from "@/lib/offline-service";

export default function ScannerPage() {
  const { user, loading, logout } = useAuth();
  const { isOnline, syncStatus, pendingCount, syncNow, addVehicleLocally } = useOffline();
  const router = useRouter();

  const [isScanning, setIsScanning] = useState(false);
  const [lastVins, setLastVins] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Rediriger si pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Charger les derniers VINs
  useEffect(() => {
    const loadLastVins = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("vin")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setLastVins(data?.map((v) => v.vin) || []);
      } catch (err) {
        console.error("Erreur lors du chargement des VINs:", err);
      }
    };

    loadLastVins();
  }, [user]);

  const handleVinDetected = async (vin: string) => {
    setIsScanning(true);
    setStatusMessage(null);

    try {
      if (isOnline && user) {
        // Ajouter directement à Supabase
        const { error } = await supabase.from("vehicles").insert({
          vin,
          user_id: user.id,
        });

        if (error) throw error;
        setStatusMessage(`✓ VIN ${vin} enregistré avec succès`);
      } else {
        // Mode offline
        await addVehicleLocally(vin);
        setStatusMessage(
          `📡 VIN ${vin} sauvegardé localement - Sync automatique en ligne`
        );
      }

      // Mettre à jour la liste
      setLastVins([vin, ...lastVins.slice(0, 4)]);

      // Effacer le message après 3 secondes
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setStatusMessage(`❌ ${message}`);
    } finally {
      setIsScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-custom py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scanner NIV</h1>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3">
            {/* Status connectivité */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isOnline
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-green-600" : "bg-yellow-600"
                }`}
              />
              {isOnline ? "En ligne" : "Hors ligne"}
            </div>

            {/* Bouton sync */}
            {pendingCount > 0 && (
              <button
                onClick={syncNow}
                disabled={!isOnline}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                🔄 Sync ({pendingCount})
              </button>
            )}

            {/* Bouton inventory */}
            <Link
              href="/inventory"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              📋 Inventaire
            </Link>

            {/* Bouton déconnexion */}
            <button
              onClick={async () => {
                await logout();
                router.push("/");
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <div className="container-custom py-8">
        {/* Message de statut */}
        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-lg text-sm font-medium ${
              statusMessage.startsWith("❌")
                ? "alert-error"
                : statusMessage.startsWith("✓")
                  ? "alert-success"
                  : "alert-warning"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* Composant de scanning */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <VinScanner onVinDetected={handleVinDetected} isLoading={isScanning} />
        </div>

        {/* Derniers scans */}
        {lastVins.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Derniers scans</h2>
            <div className="space-y-2">
              {lastVins.map((vin) => (
                <div
                  key={vin}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition"
                >
                  <span className="font-mono text-gray-700 font-medium">{vin}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(vin);
                      alert("VIN copié!");
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                  >
                    Copier
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
