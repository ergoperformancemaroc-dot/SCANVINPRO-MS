"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { getAllLocalVehicles } from "@/lib/offline-service";

interface Vehicle {
  id: string;
  vin: string;
  created_at: string;
}

export default function InventoryPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searching, setSearching] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Rediriger si pas connecté
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Charger l'inventaire
  useEffect(() => {
    const loadInventory = async () => {
      if (!user) return;

      try {
        setInventoryLoading(true);

        // Charger depuis Supabase
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, vin, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setVehicles(data || []);
      } catch (err) {
        console.error("Erreur lors du chargement de l'inventaire:", err);
      } finally {
        setInventoryLoading(false);
        setIsLoading(false);
      }
    };

    loadInventory();
  }, [user]);

  const filteredVehicles = vehicles.filter((v) =>
    v.vin.toLowerCase().includes(searching.toLowerCase())
  );

  const exportToCSV = () => {
    const csv = [
      ["VIN", "Date Ajout"],
      ...vehicles.map((v) => [
        v.vin,
        new Date(v.created_at).toLocaleDateString("fr-FR"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventaire_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDelete = async (id: string, vin: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${vin} ?`)) return;

    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);

      if (error) throw error;
      setVehicles(vehicles.filter((v) => v.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
    }
  };

  if (loading || isLoading) {
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
            <h1 className="text-2xl font-bold text-gray-900">Inventaire</h1>
            <p className="text-sm text-gray-600">
              {vehicles.length} véhicule{vehicles.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/scanner"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ➕ Scanner
            </Link>

            <button
              onClick={exportToCSV}
              disabled={vehicles.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              📥 Export CSV
            </button>

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
      <div className="container-custom py-8 max-w-4xl">
        {/* Barre de recherche */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher par VIN..."
            value={searching}
            onChange={(e) => setSearching(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Tableau d'inventaire */}
        {inventoryLoading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-600 font-medium">
              {searching ? "Aucun résultat" : "Aucun véhicule"}
            </p>
            <Link
              href="/scanner"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Commencer à scanner
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      VIN
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date d'ajout
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">
                        {vehicle.vin}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(vehicle.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(vehicle.vin)
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium mr-4"
                        >
                          Copier
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(vehicle.id, vehicle.vin)
                          }
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
