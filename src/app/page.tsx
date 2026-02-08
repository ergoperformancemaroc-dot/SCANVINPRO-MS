"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useOffline } from "@/lib/offline-context";

export default function Home() {
  const { user, loading } = useAuth();
  const { isOnline } = useOffline();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push("/scanner");
    }
  }, [user, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container-custom py-12">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              VIN Scan Pro
            </h1>
            <p className="text-xl text-gray-600">
              Gestion intelligente du stock automobile
            </p>
          </div>

          {/* Status connectivité */}
          <div className="flex justify-center mb-6">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isOnline
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${
                  isOnline ? "bg-green-600" : "bg-yellow-600"
                }`}
              />
              {isOnline ? "En ligne" : "Mode hors ligne"}
            </div>
          </div>
        </div>

        {/* Grille de fonctionnalités */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
          {/* Carte Scanner */}
          <Link
            href="/scanner"
            className="group block p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="text-4xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
              Scanner NIV
            </h2>
            <p className="text-gray-600">
              Scanner numéro de châssis via caméra ou photo
            </p>
            {/* Placeholder pour récupère d'icone si besoin */}
          </Link>

          {/* Carte Inventaire */}
          <Link
            href="/inventory"
            className="group block p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
              Mon Inventaire
            </h2>
            <p className="text-gray-600">
              Consulter et gérer votre stock de véhicules
            </p>
          </Link>
        </div>

        {/* Section Authentification */}
        <div className="flex flex-col gap-4 max-w-sm mx-auto">
          <Link
            href="/login"
            className="block w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Connexion
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">ou</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <Link
            href="/signup"
            className="block w-full py-3 px-6 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold text-center hover:bg-blue-50 transition-colors"
          >
            Créer un compte
          </Link>
        </div>

        {/* Infos STOCK AUTO MAROC */}
        <div className="mt-12 pt-8 border-t border-gray-300 text-center text-gray-600 text-sm">
          <p className="mb-2">STOCK AUTO MAROC • FLOTTE VO</p>
          <p>Application sécurisée pour la gestion d'inventaire automobile</p>
        </div>
      </div>
    </main>
  );
}
