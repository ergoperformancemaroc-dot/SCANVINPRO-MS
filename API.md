# API Reference - VIN Scanner Pro

## 📡 Endpoints Disponibles

### Authentication Routes

#### POST `/api/auth/signup` (via Supabase)
```typescript
// Client: useAuth().signUp(email, password)
// Crée un nouvel utilisateur avec rôle 'user'

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "metadata": { "full_name": "Jean Dupont" }
}

Response (200):
{
  "user": { "id": "uuid", "email": "user@example.com", ... },
  "session": { "access_token": "jwt...", "expires_in": 3600 }
}

Errors (400/422):
{
  "error_code": "user_already_exists"
  // ou: "weak_password", "invalid_email"
}
```

#### POST `/api/auth/login` (via Supabase)
```typescript
// Client: useAuth().login(email, password)

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "user": { "id": "uuid", "email": "user@example.com", ... },
  "session": { "access_token": "jwt...", "expires_in": 3600 }
}

Errors (400/401):
{
  "error_code": "invalid_credentials"
}
```

#### POST `/api/auth/logout` (via Supabase)
```typescript
// Client: useAuth().logout()
// Invalide le session actuel

Response (200):
{
  "ok": true
}
```

---

### Vehicle Routes (REST API)

#### GET `/api/vehicles` (List)
```typescript
// Client: supabase.from("vehicles").select()

Headers:
Authorization: Bearer {access_token}

Query Parameters:
- limit: number (default: 100)
- order: "asc" | "desc" (default: "desc")
- search: string (vin search)

Response (200):
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "vin": "1HGBH41JXMN109186",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  ...
]

Errors (401/403):
{
  "code": "PGRST301",
  "message": "JWT expired" // ou "insufficient_privileges"
}
```

#### POST `/api/vehicles` (Create)
```typescript
// Client: supabase.from("vehicles").insert({ vin, user_id })

Headers:
Authorization: Bearer {access_token}
Content-Type: application/json

Body:
{
  "vin": "1HGBH41JXMN109186"
}

Response (201):
{
  "id": "uuid",
  "user_id": "uuid",
  "vin": "1HGBH41JXMN109186",
  "created_at": "2024-01-15T10:30:00Z"
}

Validation Errors (400):
{
  "code": "23505", // unique_violation
  "message": "Duplicate VIN for this user"
}
```

#### DELETE `/api/vehicles/${id}` (Delete)
```typescript
// Client: supabase.from("vehicles").delete().eq("id", id)

Headers:
Authorization: Bearer {access_token}

Response (200):
{}

Errors (404/403):
{
  "code": "PGRST116",
  "message": "The update statement returned 0 rows"
}
```

---

### Admin Routes

#### GET `/api/admin/users` (List All Users)
```typescript
// Nécessite rolle 'admin'
// Client: supabase.auth.admin.listUsers()

Headers:
Authorization: Bearer {service_role_key}

Response (200):
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "user_metadata": { "role": "user", "full_name": "..." },
      "created_at": "2024-01-15T10:30:00Z"
    },
    ...
  ]
}

Errors (401/403):
{
  "error": "Unauthorized"
}
```

#### POST `/api/admin/users` (Create User)
```typescript
// ⚠️ À implémenter côté backend (Node.js)
// Actuellement: utilise Supabase Auth UI

Request:
{
  "email": "newuser@example.com",
  "password": "GeneratedPass123",
  "role": "user"
}

Response (201):
{
  "user": { "id": "uuid", "email": "newuser@example.com", ... }
}
```

#### DELETE `/api/admin/users/${userId}` (Delete User)
```typescript
// Nécessite rolle 'admin'

Headers:
Authorization: Bearer {service_role_key}

Response (200):
{}

Errors (404/403):
{
  "error": "User not found"
}
```

---

## 🔌 Hooks React Disponibles

### `useAuth()`

```typescript
import { useAuth } from "@/lib/auth-context";

function MyComponent() {
  const {
    user,           // User | null
    loading,        // boolean
    error,          // string | null
    isAdmin,        // boolean
    signUp,         // async (email, password, metadata?) => void
    login,          // async (email, password) => void
    logout,         // async () => void
  } = useAuth();
}
```

### `useOffline()`

```typescript
import { useOffline } from "@/lib/offline-context";

function MyComponent() {
  const {
    isOnline,              // boolean
    syncStatus,            // "idle" | "syncing" | "success" | "error"
    pendingCount,          // number
    syncNow,               // async () => void
    addVehicleLocally,     // async (vin) => void
  } = useOffline();
}
```

---

## 📦 Services Utilitaires

### `VINScanner` Component

```typescript
import { VinScanner } from "@/components/VinScanner";

<VinScanner
  onVinDetected={async (vin) => {
    // Handle VIN: vin string
    console.log("Detected:", vin);
  }}
  isLoading={false}
/>
```

### Image Processing

```typescript
import {
  preprocessImage,
  enhanceForVINDetection,
  validateVIN,
} from "@/lib/image-processing";

// Valider un VIN
const validation = validateVIN("1HGBH41JXMN109186");
// { valid: true } ou { valid: false, error: "..." }

// Prétraiter une image
const canvas = await preprocessImage(file, {
  contrast: 150,
  brightness: 110,
  grayscale: false,
  sharpen: true,
});

// Générer 3 versions améliorées
const { original, enhanced1, enhanced2, enhanced3 } =
  await enhanceForVINDetection(file);
```

### Offline Service

```typescript
import {
  initializeOfflineDB,
  addLocalVehicle,
  syncVehicles,
  getAllLocalVehicles,
  deleteLocalVehicle,
} from "@/lib/offline-service";

// Initialiser IndexedDB (automatique dans OfflineProvider)
await initializeOfflineDB();

// Ajouter un VIN localement
await addLocalVehicle("1HGBH41JXMN109186");

// Récupérer tous les VINs locaux
const vehicles = await getAllLocalVehicles();
// [{id, vin, timestamp, synced}]

// Synchroniser avec Supabase
await syncVehicles();

// Supprimer un VIN local
await deleteLocalVehicle(1);
```

---

## 🗄️ Database Schema

### `vehicles` Table

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vin VARCHAR(17) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, vin)
);

-- Indexes
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_created_at ON vehicles(created_at DESC);
```

### `auth.users` Metadata

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "user_metadata": {
    "role": "admin" | "user",
    "full_name": "Jean Dupont"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 Security Rules

### RLS Policies

```sql
-- SELECT: Users can only see their own vehicles
WHERE user_id = auth.uid()

-- INSERT: Users must set their own user_id
WITH CHECK (user_id = auth.uid())

-- UPDATE/DELETE: Users can only modify their own
USING (user_id = auth.uid())
```

### Authentication

```
JWT Token Flow:
1. User logs in → Supabase Auth → JWT token
2. Token stored in httpOnly cookie
3. Every request includes Authorization header
4. Token validated by Supabase RLS policies
5. Expired token (24h) → Refresh or re-login
```

---

## 📊 Rate Limiting

### Supabase Endpoints (Free Tier)

```
- 10,000 requests per day
- 5 requests per second
- Burst: 100 requests per second (10 sec window)
- Quota resets at UTC midnight
```

### Recommended Implementation

```typescript
// For batch syncing
const BATCH_SIZE = 100; // VINs per batch
const BATCH_DELAY = 1000; // ms between batches

for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
  const batch = vehicles.slice(i, i + BATCH_SIZE);
  await insertBatch(batch);
  await new Promise(r => setTimeout(r, BATCH_DELAY));
}
```

---

## 🧪 Testing with cURL

### Create User

```bash
curl -X POST "https://YOUR_URL/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345"
  }'
```

### Login

```bash
curl -X POST "https://YOUR_URL/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345"
  }'
```

### List Vehicles

```bash
curl -X GET "https://YOUR_URL/rest/v1/vehicles" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Insert Vehicle

```bash
curl -X POST "https://YOUR_URL/rest/v1/vehicles" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vin": "1HGBH41JXMN109186"
  }'
```

---

## 📚 Useful Resources

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth](https://supabase.com/docs/guides/auth/overview)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `JWT expired` | Token vieux 24h+ | Logout + Login |
| `insufficient_privileges` | User role non admin | Vérifier user_metadata.role |
| `Duplicate VIN` | VIN existe déjà | Checker bases avant insert |
| `RLS policy violation` | JWT invalid ou expiré | Vérifier token et cookies |
| `CORS error` | Request origin différent | Configurer CORS headers |

