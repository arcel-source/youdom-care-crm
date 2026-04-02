# 🚀 Guide Déploiement Youdom Care CRM
## Vercel (Frontend) + Railway (Backend) + MongoDB Atlas (Database)

---

## 📋 Résumé Architecture

```
Frontend React          Backend Python          Database
youdom-care.com    →   api.youdom-care.com  →  MongoDB Atlas
(Vercel)              (Railway)                (Cloud)
```

**Coût:** Gratuit (Vercel + MongoDB Atlas) + ~$7/mois Railway

---

## ÉTAPE 1️⃣ : MongoDB Atlas (5 minutes)

### A) Créer le compte
1. Aller sur https://mongodb.com/cloud
2. **Sign up** avec email
3. Vérifier email
4. Créer organisation (nom: "Youdom Care")

### B) Créer le cluster
1. **Build a Database** → Shared (FREE tier)
2. Provider: **AWS**
3. Region: **eu-west-1** (Irlande, plus rapide pour EU)
4. Cluster name: **youdom-care**
5. **Create**
6. Attendre 2-3 min...

### C) Sécurité - Créer l'utilisateur BD
1. Dans le cluster, aller à **Security → Database Access**
2. **Add New Database User**
   - Username: `youdom_admin`
   - Password: générer un fort (copier-coller)
   - Built-in Role: **Atlas Admin**
3. **Create User**

### D) Whitelist IP
1. **Network Access**
2. **Add IP Address**
3. Choisir **Allow access from anywhere** (0.0.0.0/0)
   - ⚠️ Pour démo, OK. En prod, mettre IPs spécifiques (Railway + Vercel)
4. **Confirm**

### E) Obtenir la connection string
1. **Databases** → ton cluster
2. Bouton **Connect**
3. Choisir **Drivers**
4. Driver: **Python**
5. Version: **3.6 or later**
6. Copier la string:
```
mongodb+srv://youdom_admin:PASSWORD@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
```
7. Remplacer `PASSWORD` par le mot de passe créé en C)

**Exemple:**
```
mongodb+srv://youdom_admin:MyS3curePa$$word123@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
```

✅ **Sauvegarde cette string dans un fichier sécurisé**

---

## ÉTAPE 2️⃣ : Préparer le Code (GitHub)

### A) Séparer Frontend et Backend en 2 repos

```bash
# 1. Frontend repo
mkdir -p ~/github/youdom-care-crm-frontend
cd ~/github/youdom-care-crm-frontend
cp -r /data/.openclaw/workspace/youdom-care-crm/frontend/* .
git init
git add .
git commit -m "Initial commit: Youdom Care CRM Frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/youdom-care-crm-frontend.git
git push -u origin main

# 2. Backend repo
mkdir -p ~/github/youdom-care-crm-backend
cd ~/github/youdom-care-crm-backend
cp -r /data/.openclaw/workspace/youdom-care-crm/backend/* .
git init
git add .
git commit -m "Initial commit: Youdom Care CRM Backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/youdom-care-crm-backend.git
git push -u origin main
```

### B) Créer `.env.example` dans chaque repo

**Frontend:** `frontend/.env.example`
```
REACT_APP_API_URL=https://api.youdom-care.com
```

**Backend:** `backend/.env.example`
```
MONGODB_URL=mongodb+srv://youdom_admin:PASSWORD@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
MONGODB_DB=youdom_care
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.youdom-care.com/auth/google/callback
SECRET_KEY=your-secret-key-min-32-chars
SESSION_EXPIRE_HOURS=8
ALLOWED_ORIGINS=https://youdom-care.com,https://www.youdom-care.com
ENVIRONMENT=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## ÉTAPE 3️⃣ : Déployer Frontend sur Vercel

### A) Créer compte Vercel
1. Aller sur https://vercel.com
2. **Sign up** avec GitHub
3. Autoriser Vercel à accéder à tes repos

### B) Déployer Frontend
1. **Add New** → **Project**
2. Sélectionner repo `youdom-care-crm-frontend`
3. **Import Project**
4. Framework: **Create React App**
5. Root Directory: `.` (racine)
6. Environment Variables (ajouter):
   ```
   REACT_APP_API_URL = https://api.youdom-care.com
   ```
7. **Deploy**
8. Attendre 2-3 minutes...

✅ **Frontend déployé sur:** `https://youdom-care-crm-frontend.vercel.app` (ou ton domaine custom)

### C) Domaine custom (optionnel)
1. Dans Vercel → **Settings** → **Domains**
2. Ajouter `youdom-care.com`
3. Suivre les instructions CNAME DNS

---

## ÉTAPE 4️⃣ : Déployer Backend sur Railway

### A) Créer compte Railway
1. Aller sur https://railway.app
2. **GitHub Sign Up** (utiliser ton compte GitHub)
3. Autoriser Railway

### B) Créer le projet
1. **New Project**
2. **Deploy from GitHub repo**
3. Sélectionner `youdom-care-crm-backend`
4. **Deploy now**

### C) Configurer les variables d'environnement
1. Dans Railway → **Variables**
2. Ajouter toutes les variables du `.env` :

```
MONGODB_URL = mongodb+srv://youdom_admin:PASSWORD@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
MONGODB_DB = youdom_care
GOOGLE_CLIENT_ID = your-id
GOOGLE_CLIENT_SECRET = your-secret
GOOGLE_REDIRECT_URI = https://api.youdom-care.com/auth/google/callback
SECRET_KEY = your-secret-key-min-32-chars
SESSION_EXPIRE_HOURS = 8
ALLOWED_ORIGINS = https://youdom-care.com,https://www.youdom-care.com
ENVIRONMENT = production
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = your-app-password
```

### D) Vérifier le déploiement
1. Dans Railway → **Deployments**
2. Attendre le ✅ (vert)
3. Copier l'URL du service (ex: `https://youdom-care-backend-production.railway.app`)

✅ **Backend déployé sur:** `https://youdom-care-backend-production.railway.app`

### E) Configurer le domaine custom (optionnel)
1. Dans Railway → **Settings** → **Custom Domains**
2. Ajouter `api.youdom-care.com`
3. Suivre les instructions DNS

---

## ÉTAPE 5️⃣ : Mettre à jour Frontend avec l'URL Backend

Si tu as déployé sans domaine custom, l'URL backend sera aléatoire (Railway). Il faut la mettre à jour dans Vercel.

### A) Récupérer l'URL du backend
```
De Railway: https://youdom-care-backend-production.railway.app
Ou si domaine custom: https://api.youdom-care.com
```

### B) Mettre à jour dans Vercel
1. Vercel → **Settings** → **Environment Variables**
2. Modifier: `REACT_APP_API_URL = https://youdom-care-backend-production.railway.app`
3. **Redeploy** (Vercel va auto-rebuild et redéployer)

---

## ÉTAPE 6️⃣ : Accéder à ta Base de Données

### Option A: MongoDB Compass (GUI)
1. Télécharger: https://www.mongodb.com/try/download/compass
2. Lancer Compass
3. **New Connection**
4. Paste la connection string:
```
mongodb+srv://youdom_admin:PASSWORD@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
```
5. **Connect**
6. Tu vois ta base, collections, documents en temps réel

### Option B: Atlas Web UI
1. MongoDB Atlas → **Clusters** → ton cluster
2. **Collections** (onglet)
3. Voir toutes les données directement dans le navigateur

---

## ÉTAPE 7️⃣ : Tester le CRM

1. **Frontend:** https://youdom-care-crm-frontend.vercel.app
2. **Login** avec Google OAuth (configurer les credentials)
3. **Dashboard** devrait charger depuis le backend

### Test de l'API
```bash
curl https://youdom-care-backend-production.railway.app/docs
```
Tu devrais voir la doc Swagger des endpoints.

---

## 🔐 Sécurité Production

### A) Google OAuth
1. Créer un projet sur https://console.cloud.google.com
2. APIs & Services → **Credentials**
3. **Create OAuth 2.0 Client ID**
   - Type: Web application
   - Authorized JavaScript origins: `https://youdom-care.com`
   - Authorized redirect URIs: `https://youdom-care-backend-production.railway.app/auth/google/callback`
4. Copier Client ID et Secret
5. Ajouter dans Railway variables

### B) Emails SMTP
- **Gmail**: Activer les App Passwords (2FA requis)
- **Brevo**: Clé API (gratuit 300 emails/jour)
- **SendGrid**: Clé API

### C) Vérifier CORS
Backend doit avoir:
```
ALLOWED_ORIGINS = https://youdom-care.com,https://www.youdom-care.com
```

### D) HTTPS + SSL
- **Vercel**: Automatique ✅
- **Railway**: Automatique ✅
- **MongoDB Atlas**: Automatique ✅

---

## 📞 Support & Troubleshooting

### Backend ne démarre pas
```bash
# Dans Railway, vérifier les logs:
# Deployment → Logs
# Chercher l'erreur (manque dépendance, env var, etc.)
```

### MongoDB connexion échoue
```
Error: mongodb connexion refused
→ Vérifier:
  1. MongoDB Atlas IP whitelist (0.0.0.0/0 ?)
  2. Connection string correcte dans env var
  3. Password bien échappé si caractères spéciaux
```

### Frontend API 502 Bad Gateway
```
→ Backend pas répondu
→ Vérifier Railway logs
→ Vérifier CORS setting dans backend
```

### API renvoie 401 Unauthorized
```
→ Session expirée ou token manquant
→ Réauthentifier via Google OAuth
```

---

## 🎉 C'est fini !

**Résumé :**
- ✅ Frontend React sur Vercel (gratuit)
- ✅ Backend Python sur Railway (~$7/mois)
- ✅ Database MongoDB Atlas (gratuit jusqu'à 5GB)
- ✅ Domaines custom optionnels
- ✅ Sécurité HTTPS + OAuth Google

**Coût total:** ~$7/mois pour Railway
**Uptime:** Production-grade

---

## 📊 URLs Finales

```
Frontend:  https://youdom-care.com (via Vercel)
Backend:   https://api.youdom-care.com (via Railway)
Database:  MongoDB Atlas (cloud)
Docs API:  https://api.youdom-care.com/docs (Swagger)
```

Besoin d'aide ? Contacte support Vercel/Railway/MongoDB 🚀
