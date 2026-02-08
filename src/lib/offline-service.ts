import { supabase, Vehicle } from "./supabase";

const DB_NAME = "VINScannerDB";
const DB_VERSION = 1;
const STORE_NAME = "vehicles";

/**
 * Initialiser la base de données IndexedDB
 */
export async function initializeOfflineDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Créer le store pour les véhicules
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: "id",
          autoIncrement: true 
        });
        store.createIndex("vin", "vin", { unique: false });
        store.createIndex("synced", "synced", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

/**
 * Ajouter un véhicule localement (sans synchronisation immédiate)
 */
export async function addLocalVehicle(vin: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const vehicle = {
        vin,
        timestamp: new Date().toISOString(),
        synced: false,
        createdAt: new Date().toISOString(),
      };

      const addRequest = store.add(vehicle);

      addRequest.onerror = () => reject(addRequest.error);
      addRequest.onsuccess = () => {
        console.log(`Véhicule ${vin} ajouté localement`);
        resolve();
      };
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Récupérer tous les véhicules locaux non synchronisés
 */
async function getUnsyncedVehicles(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("synced");

      const unsyncedRequest = index.getAll(false);

      unsyncedRequest.onsuccess = () => {
        resolve(unsyncedRequest.result);
      };

      unsyncedRequest.onerror = () => reject(unsyncedRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Marquer un véhicule comme synchronisé
 */
async function markAsSynced(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const vehicle = getRequest.result;
        vehicle.synced = true;

        const updateRequest = store.put(vehicle);

        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      };

      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Synchroniser les véhicules locaux avec Supabase
 */
export async function syncVehicles(): Promise<void> {
  try {
    // Récupérer l'utilisateur actuel
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError || !authData.session?.user) {
      console.warn("Utilisateur non authentifié, synchronisation impossible");
      return;
    }

    const userId = authData.session.user.id;
    const unsyncedVehicles = await getUnsyncedVehicles();

    if (unsyncedVehicles.length === 0) {
      console.log("Aucun véhicule à synchroniser");
      return;
    }

    console.log(`Synchronisation de ${unsyncedVehicles.length} véhicules...`);

    // Insérer les véhicules dans Supabase
    for (const vehicle of unsyncedVehicles) {
      try {
        const { error } = await supabase.from("vehicles").insert({
          vin: vehicle.vin,
          user_id: userId,
          created_at: vehicle.createdAt,
        });

        if (error) {
          console.error(`Erreur lors de l'ajout du VIN ${vehicle.vin}:`, error);
        } else {
          // Marquer comme synchronisé
          await markAsSynced(vehicle.id);
          console.log(`VIN ${vehicle.vin} synchronisé`);
        }
      } catch (err) {
        console.error(`Erreur lors de la synchronisation du VIN ${vehicle.vin}:`, err);
      }
    }

    console.log("Synchronisation terminée");
  } catch (err) {
    console.error("Erreur lors de la synchronisation:", err);
    throw err;
  }
}

/**
 * Récupérer tous les véhicules locaux
 */
export async function getAllLocalVehicles(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);

      const allRequest = store.getAll();

      allRequest.onsuccess = () => {
        resolve(allRequest.result);
      };

      allRequest.onerror = () => reject(allRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Effacer un véhicule localement
 */
export async function deleteLocalVehicle(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const deleteRequest = store.delete(id);

      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    };

    request.onerror = () => reject(request.error);
  });
}
