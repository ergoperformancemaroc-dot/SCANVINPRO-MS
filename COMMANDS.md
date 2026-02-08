# Commandes Utiles - VIN Scanner Pro

Liste complète des commandes npm et CLI pour développer, tester et déployer.

---

## 🚀 Développement

### `npm run dev`
Démarre le serveur de développement Next.js

```bash
npm run dev
# → http://localhost:3000
# → 🔥 Hot reload activé
# → Ctrl+C pour arrêter
```

**Vérifier les changements:**
- Sauvegarder un fichier TSX → Le navigateur met à jour automatiquement
- Erreurs affichées dans le terminal ET le navigateur

---

## 🏗️ Build & Production

### `npm run build`
Crée une version production

```bash
npm run build
# ✅ Output: .next/ folder
# ❌ Échoue si erreurs TypeScript
# ⏱️ Prend ~30sec
```

### `npm start`
Lance le serveur production

```bash
npm run build      # D'abord créer le build
npm start
# → http://localhost:3000
# → Version optimisée
```

---

## 🔍 Code Quality

### `npm run lint`
Vérifie le code avec ESLint

```bash
npm run lint
# ESLint scanne src/ pour:
# - Erreurs syntaxe
# - Unused variables
# - Style non-conforme
```

### `npm run type-check`
TypeScript verification uniquement

```bash
npm run type-check
# Cherche les erreurs de typage
# ✅ Utile avant commit
```

---

## 🧪 Testing

### Test Manuel dans le Navigateur

**1. Scanner VIN - Mode Manualuel**
```bash
npm run dev
# Aller à http://localhost:3000/scanner
# Mode "Manuel"
# Entrer: 1HGBH41JXMN109186 (VIN valide)
# Cliquer "Valider"
# Devrait créer l'entrée en BD
```

**2. Mode Offline**
```bash
# DevTools (F12) → Network tab
# Cocher "Offline"
# Scanner une image
# Scan devrait être sauvegardé localement (IndexedDB)
# Décocher "Offline"
# Cliquer "Sync now"
# VIN devrait être uploadé à Supabase
```

**3. Authentification**
```bash
npm run dev
http://localhost:3000
Cliquer "Créer un compte"
Email: test@example.com
Password: Test@12345
Confirmer signup réussit
```

---

## 🐛 Debugging

### Voir les Logs du Serveur

```bash
npm run dev
# Terminal affiche:
# - Requêtes API (/api/...)
# - Erreurs build
# - TypeScript warnings

# Chercher les messages [ERROR], [WARN], etc.
```

### DevTools du Navigateur

```
F12 ou Ctrl+Maj+I
→ Console: Erreurs JavaScript
→ Network: Requêtes API
→ Application: IndexedDB/LocalStorage
```

### Supabase Logs

```sql
-- Dans Supabase SQL Editor
SELECT * FROM auth.audit_log_entries LIMIT 10;
SELECT COUNT(*) FROM vehicles;

-- Voir les requêtes auth
SELECT user_id, email FROM auth.users;
```

---

## 📦 Dépendances

### Installer une approche dépendance

```bash
npm install @supabase/supabase-js @zxing/library idb
# Rajoute les packages à package.json
```

### Chercher pour une dépendance

```bash
npm list | grep tailwind
# Affiche version installée
```

### Mettre à jour les dépendances

```bash
npm outdated
# Affiche les packages à jour

npm update
# Met à jour en respectant les versions

npm outdated --all
# Tout les packages, même major versions
```

---

## 🌐 API & Routes

### Accéder aux Pages

```
GET /                    → Accueil
GET /login              → Page login
GET /signup             → Page signup
GET /scanner            → Scanner VIN (protégé)
GET /inventory          → Inventaire (protégé)
GET /admin              → Dashboard admin (admin only)
```

### Tester une API avec cURL

**Créer un utilisateur**
```bash
curl -X POST "http://localhost:3000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345"
  }'
```

**Lister les véhicules**
```bash
curl -X GET "http://localhost:3000/api/vehicles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔄 Git & Version Control

### Créer une Feature Branch

```bash
# Créer une branche pour une nouvelle feature
git checkout -b feature/vin-validation

# Faire les changements
# Tester localement
npm run dev
npm run build

# Commit
git add .
git commit -m "feat: Add VIN validation with checksum"

# Push
git push origin feature/vin-validation
```

### Pull Request (GitHub)

```bash
# Après push, créer une PR sur GitHub
# 1. Aller à https://github.com/YOUR_USERNAME/vin-scanner-app
# 2. Cliquer "Compare & pull request"
# 3. Décrire les changements
# 4. Cliquer "Create pull request"
# 5. Attendre review + merge
```

### Merge dans Main

```bash
git checkout main
git pull origin main
git merge feature/vin-validation
git push origin main
# → Vercel déploie automatiquement!
```

---

## 🚀 Déploiement

### Déployer sur Vercel

```bash
# Option 1: Automatique avec GitHub
git push origin main
# Vercel détecte et déploie automatiquement

# Option 2: Vercel CLI
npm install -g vercel
vercel deploy
# Suis les prompts
```

### Voir les Logs Vercel

```bash
# CLI Vercel
vercel logs vin-scanner-app

# Ou via Dashboard
# https://vercel.com/dashboard
# Sélectionner le projet
# Aller à Deployments > Logs
```

### Rollback à une Version Précédente

```bash
# Via Dashboard Vercel
# 1. Aller à Deployments
# 2. Trouver le bon déploiement
# 3. Clicker le menu ⋯
# 4. Cliquer "Redeploy"
```

---

## 📊 Monitoring

### Vérifier la Santé de l'App

```bash
# Health check
curl -I https://vin-scanner-app.vercel.app
# Devrait retourner HTTP 200

# Voir les metrics
npm run telemetry
# (Next.js built-in)
```

### Performance

```bash
# Générer un rapport Lighthouse
npm run lighthouse
# (Ou utiliser Chrome DevTools > Lighthouse tab)
```

---

## 🧹 Cleanup & Maintenance

### Nettoyer les fichiers générés

```bash
# Supprimer le build
rm -rf .next

# Supprimer node_modules
rm -rf node_modules

# Réinstaller
npm install

# Rebuild
npm run build
```

### Nettoyer le Cache

```bash
# Next.js cache
rm -rf .next

# npm cache
npm cache clean --force

# Navigateur (DevTools)
# F12 → Application → Clear site data
```

---

## 📈 Scaling

### Optimiser Build Speed

```bash
# Turbopack (plus rapide que webpack)
# Next.js 14.1+: Automatically used

# Pour les gros projets:
# 1. Vérifier next.config.js
# 2. Activer compression
# 3. Lazy load les routes

# Voir les metrics
npm run next -- telemetry
```

### Optimiser l'App Runtime

```typescript
// 1. Code splitting automatique
// Next.js gère ✅

// 2. Image optimization
import Image from 'next/image';

// 3. Lazy loading components
const VinScanner = dynamic(() => import('@/components/VinScanner'));
```

---

## 💡 Tips & Tricks

### Développer plus vite

```bash
# 1. Garder npm run dev en fond
npm run dev

# 2. DevTools ouvert (F12)
# 3. Éditeur + Navigateur côte-à-côte
# 4. Hot reload = zéro refresh manuel
```

### Déboguer les Erreurs d'hydration

```typescript
// Erreur courant: "Hydration mismatch"
// → Utiliser <ClientComponent> ou dynamic()

"use client"; // Marquer comme client component

// Ou
import dynamic from 'next/dynamic';
const Component = dynamic(() => import('@/..'), {
  ssr: false, // Désactiver SSR si besoin
});
```

### Tests Offline dans Chrome

```bash
# DevTools
F12 → Network tab
Cocher "Offline"
# Maintenant l'app fonctionne hors-ligne!
```

---

## 🚨 Erreurs Courantes & Solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `npm: command not found` | Node.js pas installé | Installer Node.js |
| `Module not found` | Dépendance manquante | `npm install` |
| `Build failed` | TypeScript error | `npm run type-check` |
| `Env var not found` | `.env.local` manquant | Créer le fichier |
| `Port 3000 busy` | Autre process port 3000 | `npm run dev -- -p 3001` |
| `CORS error` | Domaine non autorisé | Config Supabase API |

---

## 📚 Ressources Complémentaires

- Next.js: https://nextjs.org/docs
- Node.js: https://nodejs.org/docs
- npm: https://docs.npmjs.com
- Git: https://git-scm.com/docs

---

**Happy coding! 🎉**
