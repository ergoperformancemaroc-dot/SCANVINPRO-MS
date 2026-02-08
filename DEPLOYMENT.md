# Déploiement sur Vercel - VIN Scanner Pro

Guide complet pour déployer sur Vercel (gratuit, recommandé).

## 🎯 Prérequis

- [ ] Compte GitHub créé
- [ ] Repo GitHub avec le code
- [ ] Compte Supabase + projet configuré
- [ ] Clés Supabase copiées
- [ ] `.env.local` avec clés (non-commité en GitHub)

---

## 📋 Étape 1 : Préparer le Repo GitHub

### 1.1 Créer un compte GitHub

https://github.com/signup

### 1.2 Créer un nouveau repo

1. Aller à https://github.com/new
2. Remplir:
   - **Repository name** : `vin-scanner-app` (ou votre nom)
   - **Description** : "VIN Scanner for auto dealers"
   - **Public** / **Private** : Private recommandé
   - **Cocher "Add a README"**
   - **Cocher ".gitignore template" → Node**
3. Créer le repo

### 1.3 Pousser le code

```bash
# Dans votre répertoire local du projet
cd /path/to/vin-scanner-app

# Initialiser git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Commit initial
git commit -m "Initial commit: VIN Scanner Pro"

# Ajouter remote GitHub
git remote add origin https://github.com/YOUR_USERNAME/vin-scanner-app.git

# Renommer main branch (si besoin)
git branch -M main

# Pousser
git push -u origin main
```

✅ Vérifier que le code est sur GitHub.

---

## 🚀 Étape 2 : Configurer Vercel

### 2.1 Créer un compte Vercel

1. Aller à https://vercel.com
2. Cliquer **"Sign Up"**
3. Utiliser GitHub pour se connecter (recommandé)
4. Autoriser l'accès Vercel → GitHub

### 2.2 Créer un projet Vercel

1. Cliquer **"New Project"** (ou dashboard > Add New > Project)
2. **Importer du repo GitHub**
   - Sélectionner `vin-scanner-app` dans la liste
   - Cliquer **"Import"**

### 2.3 Configuration du Projet

La page suivante montre les paramètres:

```
Project name: vin-scanner-app
Framework: Next.js ✓ (auto-détecté)
Build command: npm run build ✓
Output directory: .next ✓
Install command: npm install ✓
Environment variables: [À REMPLIR]
```

### 2.4 Ajouter les Variables d'Environnement

**Important:** Ne PAS commiter `.env.local` sur GitHub!

Dans la page Vercel, cliquer **"Environment Variables"** et ajouter:

| Name | Value | Scope |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1...` (SERVICE) | Production only |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR_DOMAIN.vercel.app` | All |

⚠️ **IMPORTANT:** 
- **Jamais** ajouter `SUPABASE_SERVICE_ROLE_KEY` au scope Preview/Development!
- Cocher seulement "Production"

Exemple de déploiement sécurisé:
```
NEXT_PUBLIC_SUPABASE_URL
  ✓ Production
  ✓ Preview
  ✓ Development

SUPABASE_SERVICE_ROLE_KEY
  ✓ Production
  ❌ Preview
  ❌ Development
```

---

## 🔐 Étape 3 : Configuration de Sécurité

### 3.1 Mettre à jour `.gitignore`

Vérifier que `.env.local` ne sera **JAMAIS** commité:

```bash
# .gitignore (vérifier ces lignes existent)

.env.local
.env.*.local
.env
```

### 3.2 Vérifier les Settings Supabase

1. Aller à Supabase dashboard → Settings → API
2. Rediriger les URLs autorisées:
   ```
   https://YOUR_DOMAIN.vercel.app
   https://*.vercel.app (wildcard temporaire pour dev)
   http://localhost:3000 (dev local)
   ```

### 3.3 Sécuriser l'Access Token

Dans Vercel → Settings → Security:
- [ ] Vérifier les domaines authorisés
- [ ] CORS headers configurés
- [ ] Rate limiting en place (Vercel/Supabase)

---

## ✅ Étape 4 : Déployer et Tester

### 4.1 Déclencher le Build

Options:

**Option A: Automatique (Recommandé)**
```bash
git push origin main
# Vercel détecte le push et build automatiquement
# Vérifier le status: https://vercel.com/dashboard
```

**Option B: Manuel dans Vercel UI**
1. Dashboard → Select project
2. Cliquer **"Redeploy"**
3. Attendre le build (~3-5 min)

### 4.2 Vérifier le Déploiement

Dans Vercel Dashboard:
```
Status: Ready ✅
  ou
Status: Building ⏳ (attendre)
  ou
Status: Failed ❌ (regarder les logs)
```

Si Failed, cliquer sur le déploiement pour voir les logs d'erreur.

### 4.3 Accéder à l'App

Le projet est maintenant en ligne:

```
https://vin-scanner-app.vercel.app
ou
https://YOUR_DOMAIN (si configuré)
```

### 4.4 Tests

✅ **Test 1 - Page d'accueil**
```
Aller à https://vin-scanner-app.vercel.app
Devrait afficher le landing page avec "VIN Scan Pro"
```

✅ **Test 2 - Inscription**
```
Cliquer "Créer un compte"
Entrer une email + password
Devrait recevoir l'email de confirmation
```

✅ **Test 3 - Connexion**
```
Cliquer "Se connecter"
Utiliser les identifiants créés
Devrait rediriger vers /scanner
```

✅ **Test 4 - Scanner**
```
À /scanner page
Cliquer "Caméra" ou "Upload photo"
Scanner un VIN ou upload une image
Devrait détecter et sauvegarder en Supabase
```

---

## 🔄 Étape 5 : Configuration du Domaine (Optionnel)

### 5.1 Utiliser un Domaine Custom

Si vous avez un domaine (ex: scan.example.com):

1. **Dans Vercel:**
   - Dashboard → Settings → Domains
   - Cliquer "Add Domain"
   - Entrer votre domaine

2. **Dans votre registraire DNS:**
   - Ajouter un `CNAME` record:
     ```
     Name: scan
     Type: CNAME
     Value: cname.vercel.app
     ```
   - Ou utiliser le Nameserver de Vercel (importer le domaine)

3. **Vérifier:**
   ```bash
   nslookup scan.example.com
   # Devrait pointer vers Vercel
   ```

---

## 🆘 Dépannage

### Erreur : "Build failed"

**Cause 1 : Dépendances manquantes**
```
Error: Cannot find module '@supabase/supabase-js'
→ npm install n'a pas tourné
→ Vérifier package.json
```

**Cause 2 : TypScript errors**
```
Error: Type 'undefined' is not assignable to type 'string'
→ Erreur TypeScript strict mode
→ Corriger le code localement d'abord
```

**Solution :**
```bash
# Localement
npm install
npm run build
npm run type-check

# Commit et push
git add .
git commit -m "Fix build errors"
git push origin main
```

### Erreur : "Environment variable not found"

```
Error: Env var "NEXT_PUBLIC_SUPABASE_URL" not found
→ Variable non ajoutée dans Vercel
→ Aller à Settings > Environment Variables
```

### Erreur : "Allowed Domain not found"

```
Error: Callback URL mismatch
→ Domain pas autorisé dans Supabase
→ Ajouter https://vin-scanner-app.vercel.app à Supabase > Auth > URL Configuration
```

### Erreur : "CORS error"

```
Access to XMLHttpRequest blocked by CORS policy
→ Domaine natif pas autorisé
→ Ajouter à Supabase > Settings > API > Authorized redirect URLs
```

---

## 📊 Monitoring et Logs

### Vercel Logs

**Dashboard:**
```
Project → Deployments → Select deployment
→ Functions / Logs tab
→ Voir les requêtes + erreurs en temps-réel
```

**CLI:**
```bash
npm install -g vercel          # Installer Vercel CLI
vercel logs vin-scanner-app    # Voir les logs
```

### Supabase Logs

**Database:**
- Supabase Dashboard → Logs → SQL
- Voir les requêtes à la BD

**Auth:**
- Supabase Dashboard → Logs → Auth
- Voir les tentatives de connexion

---

## 🕐 Étape 6 : Auto-Deployment (CI/CD)

### 6.1 Configuration Automatique

Vercel déploie **automatiquement** à chaque push:

```bash
# Quelques secondes après push
git push origin main

# Vercel détecte et:
# 1. Tire le code de GitHub
# 2. Installe dépendances
# 3. Typescript check
# 4. Build production
# 5. Deploy à l'edge

# 😎 Zéro configuration!
```

### 6.2 Branches et Environments

```
main branch
  ↓
vercel.app (production)

develop branch (si créé)
  ↓
vin-scanner-app-develop.vercel.app (preview)
```

Pour activer preview:
1. Vercel Dashboard → Settings → Git
2. Cocher "Preview Deployments" pour toutes branches

---

## 💰 Coûts

### Vercel Free Tier

✅ **Inclus Gratuit :**
- Déploiements illimités
- Edge functions (limité)
- 100 GB bandwidth/mois
- Support communité

❌ **Payant :**
- Analytics avancée
- Priority support (+$150/mois)

### Supabase Free Tier

✅ **Inclus Gratuit :**
- 50 utilisateurs Auth max
- 10K requests/day
- 1 GB storage
- Full PostgreSQL

→ **Assez pour PME 10 users** pendant 6+ mois.

---

## 🎓 Bonnes Pratiques

### 1. Versioning

```bash
git tag v1.0.0
git push origin v1.0.0
# Vercel création automatique release
```

### 2. Deployments Sécurisés

```bash
# Vérifier localement avant de pousser
npm run build  # Build production  
npm run type-check  # TypeScript
npm run lint   # Code quality

# Seulement si tout passe
git push origin main
```

### 3. Rollback Rapide

Dans Vercel Dashboard:
```
Deployments → Chercher le bon déploiement
→ Cliquer le menu ⋯
→ Cliquer "Redeploy"
→ Instant rollback!
```

### 4. Monitoring

Configurer des alertes:
- Vercel Monitor tab
- Supabase Logs
- Email notifications quand problèmes

---

## 📞 Support

### Pour problèmes Vercel
- https://vercel.com/docs
- Discord: https://discord.gg/vercel

### Pour problèmes Supabase
- https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

---

## ✅ Checklist Final

Avant d'activer en production:

- [ ] Build réussit localement (`npm run build`)
- [ ] Zero TypeScript errors (`npm run type-check`)
- [ ] Code poussé sur GitHub
- [ ] Vercel déploiement réussi (status "Ready")
- [ ] Variables d'environnement configurées
- [ ] Domaine autorisé dans Supabase
- [ ] Test signup/login fonctionne
- [ ] Test scanner VIN fonctionne
- [ ] Test inventaire fonctionne
- [ ] Pas d'erreurs Console (F12 > Console)
- [ ] Pas d'erreurs Network (F12 > Network)

🎉 **Déploiement réussi !**

De plus maintenant l'URL: https://vin-scanner-app.vercel.app

Partager avec votre équipe / clients!

---

**Fait pour Moroccan auto dealers 🇲🇦**
