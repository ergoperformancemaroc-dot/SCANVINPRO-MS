# Guide Supabase - VIN Scanner Pro

## 🎯 Objectif
Configurer complètement Supabase pour qu'il fonctionne avec VIN Scanner Pro.

## 📋 Checklist de Configuration

- [ ] Créer compte Supabase
- [ ] Créer table `vehicles`
- [ ] Activer RLS (Row Level Security)
- [ ] Créer utilisateurs de test
- [ ] Assigner les rôles
- [ ] Copier les clés API
- [ ] Tester la connexion

---

## 1. Créer un Compte Supabase

### Étape 1
1. Aller à https://app.supabase.com
2. Cliquer "Sign Up"
3. Utiliser GitHub / Google / Email
4. Confirmer l'email

### Étape 2 - Créer un Projet

1. Cliquer "New Project"
2. Remplir:
   - **Name** : `vin-scanner-maroc` (ou votre nom)
   - **Organization** : Créer une nouvelle si besoin
   - **Database Password** : Générer et sauvegarder 🔐
   - **Region** : Europe (West) ou North America
   - **Plan** : Free (gratuit)
3. Créer le projet (attendre ~2 minutes)

### Étape 3 - Récupérer les Clés API

1. Aller à **Settings** → **API**
2. Noter les valeurs:

```
NEXT_PUBLIC_SUPABASE_URL = https://[id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1... (en bas!)
```

3. Créer le fichier `.env.local` à la racine du projet:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **NE JAMAIS commiter `.env.local`** → Ajouter à `.gitignore`

---

## 2. Créer la Table `vehicles`

### Via l'interface Supabase

1. Aller à **SQL Editor**
2. Cliquer "New query"
3. Copier-coller ce SQL:

```sql
-- =============================================
-- Table : Véhicules scannés
-- =============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vin VARCHAR(17) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, vin)
);

-- Commentaire pour documentation
COMMENT ON TABLE vehicles IS 'Stocke les numéros de châssis VIN scannés par les utilisateurs';
COMMENT ON COLUMN vehicles.vin IS 'Numéro de châssis (17 caractères)';

-- =============================================
-- Index pour performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at DESC);

-- =============================================
-- Audit trigger (optionnel)
-- =============================================
CREATE OR REPLACE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');
```

4. Cliquer "Run"
5. Vérifier que la table apparaît dans **Table Editor**

---

## 3. Configurer la Sécurité (RLS)

### Étape 1 - Activer RLS

Dans **SQL Editor**:

```sql
-- Activer Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Afficher le statut (doit afficher 'on')
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'vehicles';
```

### Étape 2 - Créer les Policies

```sql
-- =============================================
-- POLICY 1: SELECT (Voir ses propres véhicules)
-- =============================================
CREATE POLICY "Users can view their own vehicles"
  ON vehicles
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- POLICY 2: INSERT (Ajouter ses propres véhicules)
-- =============================================
CREATE POLICY "Users can insert their own vehicles"
  ON vehicles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- POLICY 3: UPDATE (Modifier ses propres véhicules)
-- =============================================
CREATE POLICY "Users can update their own vehicles"
  ON vehicles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- POLICY 4: DELETE (Supprimer ses propres véhicules)
-- =============================================
CREATE POLICY "Users can delete their own vehicles"
  ON vehicles
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Vérifier les Policies

Dans **Authentication** → **Policies**:
- Doit afficher 4 rows pour `vehicles`

---

## 4. Créer des Utilisateurs de Test

### Via l'interface Supabase

1. Aller à **Authentication** → **Users**
2. Cliquer **"Add user manually"** (ou "Add user" button)

#### Utilisateur Admin

```
Email: admin@example.com
Password: Admin@12345
[x] Auto send invite email (cocher)
```

#### Utilisateur Regular

```
Email: user@example.com
Password: User@12345
[x] Auto send invite email (cocher)
```

### Attribuer les Rôles

Dans **SQL Editor** :

```sql
-- =============================================
-- Assigner le rôle 'admin'
-- =============================================
UPDATE auth.users 
SET user_metadata = jsonb_set(user_metadata, '{role}', '"admin"')
WHERE email = 'admin@example.com';

-- =============================================
-- Assigner le rôle 'user'
-- =============================================
UPDATE auth.users 
SET user_metadata = jsonb_set(user_metadata, '{role}', '"user"')
WHERE email = 'user@example.com';

-- Vérifier
SELECT email, user_metadata->>'role' as role FROM auth.users;
```

---

## 5. Tester la Connexion

### Avec curl (Command Line)

```bash
# 1. Créer un utilisateur de test
curl -X POST "https://YOUR_SUPABASE_URL/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345"
  }'

# 2. Se connecter
curl -X POST "https://YOUR_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345"
  }'

# Réponse attendue:
# {
#   "access_token": "eyJhbGci...",
#   "refresh_token": "...",
#   "expires_in": 3600,
#   "user": {...}
# }
```

### Avec l'Application

1. `npm run dev`
2. Aller à http://localhost:3000
3. Cliquer "Créer un compte"
4. Entrer email/password
5. Vérifier que l'utilisateur apparaît dans Supabase Authentication

---

## 6. Référence Complète des Clés

| Clé | Usage | Exposé? | Où |
|-----|-------|---------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Base URL API | ✅ Oui (public) | Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth client-side | ✅ Oui (anon) | Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin backend | ❌ **NON** (secret!) | Settings > API (Service Role) |

⚠️ **JAMAIS commiter la clé Service Role dans le repo!**

---

## 7. Dépannage Supabase

### Erreur : "Relation does not exist"

```
→ La table `vehicles` n'a pas été créée
→ Aller à SQL Editor et exécuter le SQL au point 2
```

### Erreur : "RLS policy not found"

```
→ Les policies n'ont pas été créées
→ Exécuter le SQL au point 3
→ Vérifier dans Authentication > Policies
```

### Erreur : "Invalid JWT token"

```
→ Le token est expiré (24h)
→ Déconnexion + reconnexion
→ Vérifier .env.local
```

### Erreur : "User email not confirmed"

```
→ Confirmer l'email (cliquer le lien dans l'email)
→ Ou en dev: Aller à Authentication > Users > Email Confirmed toggle
```

### Erreur : "Rate limit exceeded"

```
→ Limite API atteinte (dépassé requests/minute)
→ Attendre 1 minute ou upgrade plan
```

---

## 8. Sauvegarder/Exporter les Données

### Export SQL

```sql
-- Exporter tous les VINs
SELECT user_id, vin, created_at FROM vehicles ORDER BY created_at DESC;

-- Exporter pour utilisateur spécifique
SELECT vin, created_at FROM vehicles 
WHERE user_id = 'USER_ID_HERE' 
ORDER BY created_at DESC;
```

### Export CSV via UI

1. **Table Editor** → Click sur `vehicles`
2. Cliquer le menu **⋯** (top right)
3. Cliquer **"Export as CSV"**

---

## 9. Monitoring et Logs

### Voir les Logs d'Authentification

**PostgreSQL → Query Performance** → Chercher `auth.users`

### Voir les Requêtes SQL

**Database → Query Performance**

---

## 10. Clones et Backups

### Backup Manuel

```sql
-- Exporter tout
SELECT * FROM vehicles;

-- Copier dans Excel/CSV
```

### Backup Automatique

Supabase **gratuit** inclut des backups quotidiens.
- Accéder via **Database** → **Backups**

### Cloner un Projet

1. **Settings** → **Duplicate project**
2. Créer une copie pour staging/testing

---

## Checklist Finale ✅

Avant de lancer l'app en production:

- [ ] Table `vehicles` créée et accessible
- [ ] RLS activé avec 4 policies
- [ ] Utilisateurs de test existents
- [ ] Rôles (admin/user) assignés
- [ ] `.env.local` rempli avec clés correctes
- [ ] `.env.local` ajouté à `.gitignore`
- [ ] Supabase credentials **jamais** sur GitHub
- [ ] Test login/signup fonctionne
- [ ] Test scanning VIN fonctionne
- [ ] Test inventaire affiche les VINs

---

## Support

Pour les problèmes Supabase:
- 📚 Docs: https://supabase.com/docs
- 💬 Community: https://github.com/supabase/supabase/discussions
- 🐛 Issues: https://github.com/supabase/supabase/issues

Pour les problèmes de l'app:
- Voir README.md > Troubleshooting
