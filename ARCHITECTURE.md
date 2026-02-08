# Architecture et Choix Techniques - VIN Scanner Pro

## 1. Choix Techniques par Feature

### 1.1 Authentification avec Rôles

#### ❓ Pourquoi Supabase Auth?
- ✅ **Gratuit** : Tier gratuit pour jusqu'à 50 utilisateurs
- ✅ **JWT sécurisé** : Tokens signés avec secret Supabase
- ✅ **Métadonnées utilisateur** : Stocke rôles dans `user_metadata` JSON
- ✅ **RLS (Row Level Security)** : Autorisation au niveau BD
- ✅ **Pas d'infrastructure** : Serverless, pas à gérer

#### Alternatives rejetées:
- ❌ Firebase : Coûte cher au-delà du gratuit, moins de contrôle
- ❌ Auth0 : Gratuit limité, complexe pour simple PME
- ❌ Créer soi-même : Danger sécurité, beaucoup de travail

#### Implémentation:
```
AuthContext (useAuth) 
  → Supabase Auth
    → JWT token en cookie
      → Middleware protège routes
        → useAuth hook donne user + isAdmin
```

### 1.2 Détection VIN Améliiorée

#### ❓ Pourquoi ZXing.js + traitement image?

**ZXing.js :**
- ✅ Librairie barcode/QR top (Google, Apache)
- ✅ Fonctionne sur navigateur (pas backend)
- ✅ Support multiples formats (CODE128, CODE39, etc.)
- ✅ Gratuit open-source
- ❌ Faible sur mauvaise qualité photo

**Prétraitement image (Canvas HTML5 + JS pur) :**
- ✅ 3 stratégies intelligentes :
  1. **Enhanced1** : Haute lumière, stabilité
  2. **Enhanced2** : Niveaux de gris, bruit réduit
  3. **Enhanced3** : Maximum contraste
- ✅ Fonctionne offline (aucun appel API)
- ✅ Rapide (<1sec par image)
- ✅ Aucune dépendance externe (Canvas standard)

**Validation VIN :**
- Formule ISO 3779 (checksum 9ème char)
- Regex: `^[A-HJ-NPR-Z0-9]{17}$` (pas I,O,Q)

#### Alternatives rejetées:
- ❌ Tesseract.js OCR : Lourd, lent, moins précis pour codes
- ❌ Azure ML Vision : Payant (0,002$/image), pas gratuit
- ❌ Google Cloud Vision : Payant, idem

### 1.3 Mode Offline-First

#### ❓ Pourquoi IndexedDB + Service Worker?

**IndexedDB :**
- ✅ Stockage **persistant** (plusieurs MB, pas localStorage 5KB)
- ✅ **Transactionnel** (pas corruption données)
- ✅ **Queryable** par index (rapide)
- ✅ Supporte **Blobs** (photos complètes)
- ✅ Gratuit illimité

**Sync strategy :**
```
Scanner VIN
  → navigator.onLine? 
    OUI → Supabase direct
    NON → IndexedDB + await sync event
  
Sync event:
  ← online event listeners
  ← click "Sync now"
  → Récupère non-synced
  → Upload par batch
  → Mark as synced
```

#### Alternatives rejetées:
- ❌ LocalStorage : Seulement 5KB, syncronous (bloque UI)
- ❌ Service Worker seul : Complex, pas DB queryable
- ❌ PouchDB/RxDB : Trop lourd pour simple PME

## 2. Architecture de Haut Niveau

```plaintext
┌─────────────────────────────────────────────────────────┐
│              NAVIGATEUR (Client)                        │
│┌──────────────────────────────────────────────────────┐ │
││ React + Next.js (App Router)                         │ │
││ ├─ Pages (page.tsx)                                  │ │
││ │  ├─ / (accueil)                                    │ │
││ │  ├─ /login, /signup (auth)                         │ │
││ │  ├─ /scanner (VIN scanning)                        │ │
││ │  ├─ /inventory (gestion stock)                     │ │
││ │  └─ /admin (dashboard)                             │ │
││ ├─ Composants (components/)                          │ │
││ │  └─ VinScanner.tsx (ZXing + preprocess)            │ │
││ └─ Contextes (lib/contexts)                          │ │
││    ├─ AuthContext (user + rôle)                      │ │
││    └─ OfflineContext (sync + pendingCount)           │ │
│└──────────────────────────────────────────────────────┘ │
│                                                          │
│┌──────────────────────────────────────────────────────┐ │
││ Middleware (middleware.ts)                           │ │
││ → Protège routes (redirige /login si pas token)      │ │
│└──────────────────────────────────────────────────────┘ │
│                                                          │
│┌──────────────────────────────────────────────────────┐ │
││ Client-Side Storage                                  │ │
││ ├─ IndexedDB (VINs locaux non-synced)               │ │
││ ├─ Cookies (JWT token Supabase)                     │ │
││ └─ LocalStorage (config app)                        │ │
│└──────────────────────────────────────────────────────┘ │
│                                                          │
│┌──────────────────────────────────────────────────────┐ │
││ Core Libraries                                       │ │
││ ├─ @zxing/library (barcode reader)                  │ │
││ ├─ @supabase/supabase-js (auth + DB)                │ │
││ └─ idb (IndexedDB wrapper)                          │ │
│└──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│              INTERNET / BACKEND                         │
│┌──────────────────────────────────────────────────────┐ │
││ Supabase (Backend-as-a-Service)                      │ │
││ ├─ Auth (JWT + user metadata)                        │ │
││ ├─ PostgreSQL (vehicles table)                       │ │
││ ├─ RLS Policies (authorize par user_id)             │ │
││ └─ Real-time subscriptions                          │ │
│└──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 3. Flow Données - Scanning VIN

### Cas Normal (Avec Internet)

```plaintext
Scanner VIN
    ↓
  ZXing decode
    ↓
  Validation (17 chars + checksum)
    ↓
  Upload direct Supabase
    ↓
  RLS: user_id = auth.uid() ✓
    ↓
  Affiché dans /inventory
```

### Cas Offline

```plaintext
Scanner VIN
    ↓
  Détecte navigator.onLine = false
    ↓
  Stocke local IndexedDB (synced=false)
    ↓
  Badge "Mode hors ligne"
    ↓
  [Utilisateur regagne internet]
    ↓
  Event 'online' triggered
    ↓
  Auto-sync ou "Sync now" cliqué
    ↓
  Upload batch à Supabase
    ↓
  Mark synced=true IndexedDB
    ↓
  Véhicule apparaît dans /inventory
```

## 4. Sécurité par Couche

### Layer 1 - Client
```typescript
// Validation VIN
validateVIN(vin) // regex + checksum ISO 3779

// Middleware Next.js
if (!token) redirect("/login")

// useAuth hook
if (!user || !isAdmin) redirect("/scanner")
```

### Layer 2 - Transport
```
HTTPS (certificat SSL/TLS)
  ↓
API Supabase (endpoints sécurisés)
```

### Layer 3 - Backend (Supabase)
```sql
-- RLS Policy
SELECT * FROM vehicles WHERE user_id = auth.uid()
-- Inaccessible par les autres utilisateurs

-- Insert Policy
INSERT INTO vehicles
WITH CHECK (user_id = auth.uid())
-- Empêche injection user_id

-- JWT validation
token.payload.sub == user_id
```

## 5. Performance Optimizations

### Client-Side
- ✅ Code splitting automatique (Next.js)
- ✅ Image preprocessing en worker (canvas)
- ✅ IndexedDB async (ne bloque pas UI)
- ✅ Compression images avant upload

### Cache
- ✅ HTTP caching headers (CDN Vercel)
- ✅ Service Worker pour assets statiques
- ✅ Browser cache (localStorage métadonnées)

### Database (Supabase)
- ✅ Index sur `user_id` + `vin`
- ✅ Connection pooling gratuit
- ✅ Query optimization (select fields)

## 6. Limitations et Futur

### Limitations actuelles
- ❌ Pas de pagination (OK <1000 vehicles)
- ❌ Pas de synchronisation temps-réel (polling seulement)
- ❌ Admin crée users par UI (pas API backend)
- ❌ Pas de photos (just VINs)

### Améliorations futures
- ✅ Service Worker complet (offline app)
- ✅ WebSocket Supabase (real-time inventory)
- ✅ API backend (Node) pour création users sécurisée
- ✅ Stockage photos + OCR grosso
- ✅ Analytics (utilisateurs actifs, scans/jour)
- ✅ Multi-langue (FR/EN/AR)
- ✅ Authentification biométrique (WebAuthn)

## 7. Coûts (Tier Gratuit Supabase)

```
Utilisateurs actifs : 50
Requests BD/jour : 10,000 gratuites/jour
Stockage : 1 GB
Bandwidth : 2 GB/mois
Functions/Edge : Non inclus

Estimation pour PME 10 utilisateurs:
- 2-5 VINs/utilisateur/jour
- Sync batch 1x/jour minimum
- Total: ~150 requests/jour (dans limite gratuite)

Escalade: Si >10k requests/jour, passer à paid ($25/mois)
```

## 8. Déploiement Architecture

```plaintext
GitHub (Source)
    ↓
Vercel (CI/CD)
    ↓
Build Production
    ↓
CDN Edge (Performance)
    ↓
Your Domain (CNAME)
    ↓
Supabase Backend (Auth + DB)
```

### Vercel + Supabase = Combo Gratuit Parfait
- ✅ Zero infrastructure
- ✅ Auto-scaling
- ✅ Global CDN
- ✅ Custom domain
- ✅ SSL gratuit

---

**Résumé** : Architecture cloud-native, offline-capable, sécurisée et entièrement gratuite pour petit/moyen usage.
