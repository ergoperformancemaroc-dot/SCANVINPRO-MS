"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Récupérer la session sauvegardée au démarrage
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Vérifier la session existante
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session?.user) {
          setUser(data.session.user);
          // Vérifier le rôle utilisateur
          const userRole = data.session.user.user_metadata?.role;
          setIsAdmin(userRole === "admin");
        }
      } catch (err) {
        console.error("Erreur lors de la vérification d'authentification:", err);
        setError(err instanceof Error ? err.message : "Erreur d'authentification");
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        const userRole = session?.user?.user_metadata?.role;
        setIsAdmin(userRole === "admin");
      }
    );

    return () => {
      // subscription peut être undefined selon la version de supabase
      if (subscription && typeof (subscription as any).unsubscribe === "function") {
        (subscription as any).unsubscribe();
      }
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "user",
            ...metadata,
          },
        },
      });

      if (error) throw error;
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur d'inscription";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        const userRole = data.user.user_metadata?.role;
        setIsAdmin(userRole === "admin");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur de connexion";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setIsAdmin(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur lors de la déconnexion";
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signUp, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return context;
}
