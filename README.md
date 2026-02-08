# VIN Scanner Pro - Application de Scanning NIV

Application web mobile-friendly pour scanner des numéros de châssis VIN avec support offline et authentification par rôles.

## 🚀 Fonctionnalités principales

- **Scanning VIN intelligent** : ZXing.js + prétraitement d'image pour photos de mauvaise qualité
- **Mode offline-first** : IndexedDB pour stockage local + synchronisation automatique
- **Authentification sécurisée** : Supabase Auth avec rôles (Admin/Utilisateur)
- **Inventaire** : Gestion stock véhicules, export CSV
- **Dashboard Admin** : Création/gestion utilisateurs
- **Optimisé mobile** : Responsive design, caméra native

## 📋 Prerequisites

- Node.js 18+ et npm
- Compte Supabase gratuit
- Navigateur moderne (Chrome, Firefox, Safari, Edge)

## 🔧 Installation

### 1. Cloner et installer les dépendances

```bash
git clone <votre-repo>
cd vin-scanner-app
npm install
```

### 2. Configurer Supabase

#### 1.1 Créer un compte Supabase
- Aller à https://app.supabase.com
- Créer un nouveau projet (gratuit)

#### 1.2 Créer la table `vehicles`

Dans l'interface Supabase, exécuter ce SQL:

```sql
-- Table pour les véhicules
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  vin VARCHAR(17) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, vin)
);

-- Index pour les requêtes
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
```

#### 1.3 Configurer les RLS (Row Level Security)

Pour la table `vehicles`:

```sql
-- Activer RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne voient que leurs propres véhicules
CREATE POLICY "Users can view their own vehicles"
  ON vehicles FOR SELECT
  USING (user_id = auth.uid());

-- Les utilisateurs peuvent insérer leurs propres véhicules
CREATE POLICY "Users can insert their own vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent supprimer leurs propres véhicules
CREATE POLICY "Users can delete their own vehicles"
  ON vehicles FOR DELETE
  USING (user_id = auth.uid());
```

#### 1.4 Créer les utilisateurs de test

Pour les tester:
- Aller à **Authentication > Users** dans Supabase
- Cliquer "Add user"
- Créer un utilisateur **admin** et un utilisateur **regular**

### 2. Créer `.env.local` avec vos clés Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Récupérer les clés:
- **NEXT_PUBLIC_SUPABASE_URL** et **NEXT_PUBLIC_SUPABASE_ANON_KEY** : Settings > API
- **SUPABASE_SERVICE_ROLE_KEY** : Settings > API (rôle de service)

### 3. Assigner les rôles utilisateur

Exécuter ce SQL pour ajouter les rôles aux métadonnées utilisateur:

```sql
-- Pour l'admin (remplacer UUID)
UPDATE auth.users SET user_metadata = jsonb_set(user_metadata, '{role}', '"admin"') 
WHERE email = 'admin@example.com';

-- Pour l'utilisateur régulier
UPDATE auth.users SET user_metadata = jsonb_set(user_metadata, '{role}', '"user"') 
WHERE email = 'user@example.com';
```

## 🏃 Démarrage

### Mode développement

```bash
npm run dev
```

Accéder à http://localhost:3000

### Build production

```bash
npm run build
npm start
```

## 📱 Utilisation

### Endpoints principaux

- **/** : Écran d'accueil
- **/login** : Connexion
- **/signup** : Inscription
- **/scanner** : Scanning VIN (utilisateur + admin)
- **/inventory** : Gestion inventaire (utilisateur + admin)
- **/admin** : Dashboard création utilisateurs (admin uniquement)

### Modes de scanning VIN

#### 1️⃣ Caméra
- Démarrer la caméra du téléphone
- Aligner le code-barres dans le cadre jaune
- Détection automatique

#### 2️⃣ Upload photo
- Charger une photo depuis le téléphone/ordinateur
- Prétraitement automatique si détection difficile
- 3 stratégies de traitement essayées

#### 3️⃣ Saisie manuelle
- Entrée manuelle du VIN (17 caractères)
- Validation checksum automatique
- Utile pour codes-barres non lisibles

### Mode offline

Tous les scans sans internet sont sauvegardés localement (IndexedDB):

1. App détecte quand le téléphone est hors ligne
2. Les VINs scannés localement sont mis en attente
3. Badge "Mode hors ligne" apparaît
4. Quand online, cliquer "Sync now" ou sync automatique
5. Les VINs sont uploadés à Supabase

## 🧪 Tests

### Tester le mode offline

**Chrome DevTools:**
1. F12 ou Ctr+Maj+I
2. Aller à **Network**
3. Cocher **Offline**
4. Scannez un VIN
5. Le VIN s'affiche avec badge "⏱ Mode hors ligne"
6. Décocher **Offline**
7. Cliquer "Sync now" ou attendre la sync auto
8. Le VIN apparaît dans l'inventaire

### Tester l'authentification

**Admin:**
```
Email: admin@example.com
Mot de passe: [votre mot de passe]
```
- Accès: Scanner, Inventaire, **Dashboard Admin**
- Peut créer/supprimer utilisateurs

**Utilisateur:**
```
Email: user@example.com
Mot de passe: [votre mot de passe]
```
- Accès: Scanner, Inventaire
- Pas accès admin dashboard

### Tester le prétraitement VIN

Photos difficiles:
- Reflets pare-brise
- Stickers/gravures
- Faible contraste
- Angles tordus
- Poussière/saleté

L'app teste 3 stratégies de prétraitement:
1. Contraste + luminosité + aiguïsage
2. Niveaux de gris + contraste fort + bruit réduit
3. Luminosité réduite + contraste max

Donc même mauvaises photos peuvent être lues.

## 📚 Structure du projet

```
src/
├── app/
│   ├── page.tsx              # Écran d'accueil
│   ├── layout.tsx            # Layout principal
│   ├── globals.css           # Styles globaux
│   ├── providers.tsx         # Context providers
│   ├── login/page.tsx        # Page connexion
│   ├── signup/page.tsx       # Page inscription
│   ├── scanner/page.tsx      # Page scanning VIN
│   ├── inventory/page.tsx    # Page inventaire
│   └── admin/page.tsx        # Dashboard admin
├── components/
│   └── VinScanner.tsx        # Composant scanner principal
├── lib/
│   ├── supabase.ts           # Client Supabase
│   ├── auth-context.tsx      # Context authentification
│   ├── offline-context.tsx   # Context mode offline
│   ├── offline-service.ts    # IndexedDB service
│   └── image-processing.ts   # Prétraitement image
└── middleware.ts             # Protection routes
```

## 🔒 Sécurité

- ✅ HTTPS recommandé (Vercel par défaut)
- ✅ RLS activé sur toutes les tables
- ✅ Tokens JWT sécurisés (Supabase)
- ✅ Pas de clé secrète exposée au client
- ✅ CORS configuré
- ✅ Input validation sur VIN (regex + checksum)

## 🚀 Déploiement sur Vercel

### 1. Pousser sur GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-user/vin-scanner-app.git
git branch -M main
git push -u origin main
```

### 2. Créer le projet sur Vercel

- Aller à https://vercel.com
- Cliquer "New Project"
- Importer le repo GitHub
- Ajouter les variables d'environnement:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`

### 3. Déployer

Vercel déploiera automatiquement à chaque push sur `main`.

## 🆘 Dépannage

### Caméra ne fonctionne pas

- ✅ Vérifier que le navigateur a les permissions caméra
- ✅ Sur mobile, utiliser HTTPS (ou localhost en développement)
- ✅ Vérifier `navigator.mediaDevices` dans DevTools console

### VIN pas détecté

- ✅ Essayer une autre photo
- ✅ Utiliser le mode manuel
- ✅ Vérifier que 3 stratégies de prétraitement ont bien été testées
- ✅ Code-barres peut être endommagé

### Mode offline ne fonctionne pas

- ✅ Vérifier IndexedDB dans DevTools (Applications > IndexedDB)
- ✅ Vérifier navigator.onLine dans console
- ✅ Certains navigateurs limitent IndexedDB en mode privé/incognito

### Erreur authentification Supabase

- ✅ Vérifier clés `.env.local`
- ✅ Vérifier que l'utilisateur existe dans Supabase
- ✅ Vérifier que les rôles sont bien assignés (metadata)

## 📄 Licences

- **Next.js** : MIT
- **@supabase/supabase-js** : Apache 2.0
- **@zxing/library** : Apache 2.0
- **idb** : Apache 2.0
- **tailwindcss** : MIT

## 🤝 Support

Pour les problèmes, créer une issue GitHub avec:
- Description du problème
- Étapes pour reproduire
- Version navigateur
- Logs console (F12)

---

**Fait pour les PME du Maroc** 🇲🇦
Gestion inventaire automobile simple • Gratuit • Offline-first
