# 🚂 RAILWAY — Accès Direct à ta Plateforme

---

## 🔐 COMMENT ACCÉDER À RAILWAY

### Méthode 1️⃣ : Via GitHub (Recommandé)

```
1. Aller sur https://railway.app
2. Cliquer "GitHub Sign Up" 
3. Connecter avec ton compte GitHub:
   - Username: TON_USERNAME_GITHUB
   - Password: TON_PASSWORD_GITHUB
4. Autoriser Railway
5. Tu es maintenant sur Railway Dashboard ✅
```

### Méthode 2️⃣ : Si déjà connecté

```
https://railway.app/dashboard
→ Tu vois tes projets
→ Cliquer sur: youdom-care-crm-backend
→ Tu es dedans
```

---

## 📊 ACCÈS RAILWAY COMPLET

| Information | Valeur |
|---|---|
| **URL de connexion** | https://railway.app |
| **Méthode auth** | GitHub OAuth |
| **GitHub username** | YOUR_GITHUB_USERNAME |
| **GitHub password** | YOUR_GITHUB_PASSWORD |
| **Projet Railway** | youdom-care-crm-backend |
| **URL du projet** | https://railway.app/project/YOUR_PROJECT_ID |
| **Service** | api (Youdom Care Backend) |

---

## 🎯 NAVIGATION DANS RAILWAY

Une fois connecté, tu verras:

### 1️⃣ Dashboard Principal
```
https://railway.app/dashboard
→ Liste de tous tes projets
→ Cliquer sur "youdom-care-crm-backend"
```

### 2️⃣ Page du Projet
```
https://railway.app/project/YOUR_PROJECT_ID
→ Onglets:
  - Services (le backend "api")
  - Deployments (historique des déploiements)
  - Variables (env vars)
  - Settings (configuration)
  - Members (utilisateurs du projet)
  - Notifications
```

### 3️⃣ Onglet Variables (LE PLUS IMPORTANT)
```
Railway → youdom-care-crm-backend → Variables
→ Tu vois TOUTES les env vars:
  - MONGODB_URL
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - SECRET_KEY
  - SMTP_PASSWORD
  - Etc.
```

### 4️⃣ Onglet Deployments
```
Railway → youdom-care-crm-backend → Deployments
→ Tu vois chaque déploiement avec:
  - Date de déploiement
  - Statut (✅ vert = OK, 🔴 rouge = erreur)
  - Logs (pour déboguer)
  - Bouton "Redeploy" (redémarrer)
```

### 5️⃣ Logs en temps réel
```
Railway → Deployments → Cliquer sur un déploiement
→ Onglet "Logs"
→ Voir les erreurs en direct
```

---

## 🔑 COMMANDER RAILWAY

Une fois dans Railway, voici ce que tu peux faire:

### ✏️ Éditer les variables d'environnement
```
1. Variables (onglet)
2. Cliquer sur une variable pour l'éditer
3. Ou Raw Editor pour tout éditer d'un coup
4. Save → Redeploy automatique
```

### 🔄 Redéployer le backend
```
1. Deployments (onglet)
2. Cliquer sur le déploiement actuel
3. Bouton "Redeploy" (en haut)
4. Attendre le ✅ vert (2-3 min)
```

### 📊 Voir les logs
```
1. Deployments → Cliquer sur un déploiement
2. Onglet "Logs"
3. Scroll pour voir tous les logs
4. Refresh pour les logs en temps réel
```

### 🌐 Obtenir l'URL de ton backend
```
1. Services (onglet)
2. Cliquer sur "api"
3. Tu vois: youdom-care-backend-production.railway.app
4. C'est l'URL de ton API
```

### ⚙️ Configuration du domaine custom
```
1. Settings (onglet)
2. Custom Domains
3. Ajouter: api.youdom-care.com
4. Configurer le CNAME DNS chez ton registrar
```

---

## 📋 CHECK-LIST ACCÈS RAILWAY

- [ ] Je peux aller sur https://railway.app
- [ ] Je suis connecté avec mon GitHub
- [ ] Je vois le projet "youdom-care-crm-backend"
- [ ] Je clique dessus et je le vois
- [ ] Je vois l'onglet "Variables"
- [ ] Je vois toutes les env vars (MONGODB_URL, GOOGLE_*, etc.)
- [ ] Je vois l'onglet "Deployments"
- [ ] Je vois le statut ✅ vert du dernier déploiement
- [ ] Je clique sur "Logs" et je vois les messages du backend

---

## 🆘 PROBLÈMES COURANTS

### "Je ne vois pas mon projet"
```
Solution:
1. Railway.app/dashboard
2. Scroll en bas
3. Chercher "youdom-care-crm-backend"
4. Si absent: le repo GitHub n'est pas connecté
   → New Project → Deploy from GitHub repo → youdom-care-crm-backend
```

### "Le déploiement est rouge (❌ erreur)"
```
Solution:
1. Cliquer sur le déploiement rouge
2. Onglet "Logs"
3. Chercher le message d'erreur
4. Erreurs courantes:
   - Manque une env var (MONGODB_URL?)
   - Connection string MongoDB mauvaise
   - Port incorrecte
5. Corriger la variable + Redeploy
```

### "L'API répond 502 Bad Gateway"
```
Solution:
1. Railway → Deployments
2. Vérifier si le déploiement est ✅ vert
3. Si rouge → voir les logs
4. Si vert → backend crashe:
   → Logs → chercher l'erreur
   → Corriger la variable
   → Redeploy
```

### "Je ne peux pas éditer les variables"
```
Solution:
1. Vérifier que tu es le propriétaire du projet
2. Ou que tu as les bonnes permissions
3. Railway → Members → vérifier le rôle
```

---

## 🔐 SÉCURITÉ — IMPORTANT

⚠️ **JAMAIS partager tes credentials Railway:**
- Ton GitHub username/password
- Les env vars (SECRET_KEY, API keys, etc.)
- L'URL du projet

✅ **À FAIRE:**
- Activer 2FA sur GitHub (Settings → Security → 2FA)
- Stocker les secrets en lieu sûr (1Password, Bitwarden)
- Changer les API keys tous les 6 mois

---

## 📞 SUPPORT

Si tu as un problème:
1. Lire les logs (Deployments → Logs)
2. Chercher le message d'erreur sur Google
3. Contacter Railway support: https://railway.app/support
4. Lire la doc: https://docs.railway.app

---

## ✅ RÉSUMÉ

```
🌐 URL: https://railway.app
🔐 Auth: GitHub OAuth
📂 Projet: youdom-care-crm-backend
⚙️ Variables: MONGODB_URL, GOOGLE_*, SECRET_KEY, SMTP_*, etc.
📊 Logs: Deployments → Logs
🚀 Deploy: Deployments → Redeploy
```

**T'as besoin de quoi d'autre pour Railway ?** 🚀
