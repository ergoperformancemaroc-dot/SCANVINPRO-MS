# ⚡ Quick Start - VIN Scanner Pro

**Démarrer en 5 minutes** (vraiment!)

## Étape 1 : Cloner et Installer (1 min)

```bash
git clone https://github.com/YOUR_USERNAME/vin-scanner-app.git
cd vin-scanner-app
npm install
```

## Étape 2 : Configurer Supabase (2 min)

### 2.1 Créer un compte gratuit
https://app.supabase.com → Sign Up

### 2.2 Créer un projet
- Cliquer "New Project"
- Enregistrer le **Database Password** 🔐
- Attendre 2 minutes

### 2.3 Récupérer les clés
Settings → API

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 2.4 Créer `.env.local`

```bash
cp .env.example .env.local
```

Éditer et ajouter les clés.

### 2.5 Setup table vehicles

SQL Editor dans Supabase → Copier-Coller ce SQL:

```sql
-- Créer table
CREATE TABLE vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vin VARCHAR(17) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, vin)
);

-- Index
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);

-- RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicles"
  ON vehicles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicles"
  ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
  ON vehicles FOR DELETE USING (auth.uid() = user_id);
```

## Étape 3 : Démarrer l'App (1 min)

```bash
npm run dev
```

Aller à http://localhost:3000

## Étape 4 : Tester (1 min)

### Test 1 - Créer un compte
```
Cliquer "Créer un compte"
Email: test@example.com
Password: Test@12345
```

### Test 2 - Scanner
```
Aller à /scanner
Mode "Manuel"
VIN de test: 1HGBH41JXMN109186
Cliquer "Valider"
```

### Test 3 - Inventaire
```
Cliquer "Inventaire"
Devrait afficher le VIN scanné
```

## 🎉 Terminé!

L'app le travaille parfaitement!

Prochaines étapes:

- [ ] Lire ARCHITECTURE.md pour comprendre l'archi
- [ ] Modifier le logo/couleurs (tailwind.config.ts)
- [ ] Déployer sur Vercel (voir DEPLOYMENT.md)
- [ ] Configurer domaine custom

---

## Commandes Utiles

```bash
npm run dev        # Démarrage dev
npm run build      # Build prod (test localement)
npm run lint       # Vérifier code
npm run type-check # TypeScript only
npm start          # Start prod server
```

## Erreurs Courantes

| Erreur | Solution |
|--------|----------|
| `Module not found` | `npm install` manquant |
| `Env var not found` | Vérifier `.env.local` |
| `RLS policy violation` | Vérifier Supabase setup |
| `Caméra ne fonctionne pas` | Mobile + HTTPS (ou localhost) |

---

## Support Rapide

📚 Docs:
- [README.md](README.md) - Vue d'ensemble compète
- [ARCHITECTURE.md](ARCHITECTURE.md) - Design technique
- [API.md](API.md) - Endpoints & hooks

💬 Questions:
- Chercher les GitHub Issues
- Créer une issue si bug

🚀 Maintenant deployer:
- Voir DEPLOYMENT.md pour Vercel

---

**C'est tout !** Vous êtes prêt à développer 🚀
