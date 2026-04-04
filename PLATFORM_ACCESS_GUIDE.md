# 🔐 Guide Accès Complètes — Youdom Care CRM
**Date :** 2 Avril 2026  
**Confidentiel — À Conserver en Lieu Sûr**

---

## 📌 IMPORTANT

⚠️ **JAMAIS partager ces infos publiquement (GitHub, Discord, email non chiffré)**

Tous les secrets doivent être stockés dans un gestionnaire de secrets :
- 1Password
- Bitwarden
- LastPass
- Ou fichier `.env` local (jamais push sur git)

---

## 1️⃣ MONGODB ATLAS

### Accès Web

| Information | Valeur |
|---|---|
| **URL** | https://mongodb.com/cloud |
| **Email** | ton-email@exemple.com |
| **Password** | Ton mot de passe MongoDB |
| **Organisation** | Youdom Care |
| **Cluster** | youdom-care |
| **Database** | youdom_care |

### Créer l'accès

```bash
# 1. Aller sur https://mongodb.com/cloud
# 2. Login avec ton compte

# 3. Créer DATABASE USER
# Security → Database Access → Add New Database User
# Username: youdom_admin
# Password: GENERATE STRONG PASSWORD (copier)

# 4. Obtenir connection string
# Databases → youdom-care → Connect → Drivers → Python
# String: mongodb+srv://youdom_admin:PASSWORD@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
```

### Connection String (à mettre dans Railway)

```
mongodb+srv://youdom_admin:YOUR_PASSWORD_HERE@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
```

### GUI d'accès à la BD

**MongoDB Compass (Desktop):**
1. Télécharger: https://www.mongodb.com/try/download/compass
2. Lancer Compass
3. **New Connection**
4. Paste la connection string ci-dessus
5. **Connect** ✅

**Web UI (pas besoin de télécharger):**
- MongoDB Atlas → Databases → Collections
- Voir toutes les données directement

---

## 2️⃣ VERCEL (Frontend)

### Accès Web

| Information | Valeur |
|---|---|
| **URL** | https://vercel.com |
| **Login** | Via GitHub (yourusername) |
| **Project** | youdom-care-crm-frontend |
| **Framework** | Create React App |

### Créer l'accès

```bash
# 1. https://vercel.com
# 2. GitHub Sign Up (utiliser ton compte GitHub)
# 3. Authoriser Vercel accès à tes repos

# 4. Créer un nouveau projet
# Add New → Project → Sélectionner youdom-care-crm-frontend
# Framework: Create React App
# Build: npm run build
# Output: build/

# 5. Environment Variables
# Settings → Environment Variables
# REACT_APP_API_URL = https://api.youdom-care.com
```

### Variables d'environnement

```
REACT_APP_API_URL = https://api.youdom-care.com
```

### Accès au dashboard

- **URL Dashboard:** https://vercel.com/dashboard
- **Projet:** youdom-care-crm-frontend
- **Deployments:** Voir tous les déploiements
- **Settings** → Domaines, variables env, etc.
- **Logs** → Voir les erreurs de build

### Custom Domain

- **Settings → Domains**
- Ajouter `youdom-care.com`
- Configurer CNAME DNS vers Vercel

---

## 3️⃣ RAILWAY (Backend)

### Accès Web

| Information | Valeur |
|---|---|
| **URL** | https://railway.app |
| **Login** | Via GitHub (yourusername) |
| **Project** | youdom-care-crm-backend |
| **Service** | api |

### Créer l'accès

```bash
# 1. https://railway.app
# 2. GitHub Sign Up (utiliser ton compte GitHub)
# 3. Authoriser Railway accès à tes repos

# 4. Créer un nouveau projet
# New Project → Deploy from GitHub repo
# Sélectionner youdom-care-crm-backend
# Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT

# 5. Environment Variables
# Variables → Ajouter toutes les variables du .env
```

### Variables d'environnement à ajouter

**COPIER-COLLER DANS RAILWAY:**

```
MONGODB_URL=mongodb+srv://youdom_admin:PASSWORD@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
MONGODB_DB=youdom_care
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://api.youdom-care.com/auth/google/callback
SECRET_KEY=your-secret-key-min-32-chars-change-in-prod
ENCRYPTION_KEY=your-fernet-encryption-key-32-bytes-base64
SESSION_EXPIRE_HOURS=8
ALLOWED_ORIGINS=https://youdom-care.com,https://www.youdom-care.com
ENVIRONMENT=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
BREVO_API_KEY=your-brevo-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_FROM_NUMBER=+33XXXXXXXXX
APP_NAME=Youdom Care CRM
APP_URL=https://youdom-care.com
```

### Accès au dashboard

- **URL Dashboard:** https://railway.app/dashboard
- **Projet:** youdom-care-crm-backend
- **Deployments** → Voir tous les déploiements + logs
- **Variables** → Gérer les env vars
- **Settings** → Domaines custom, build config

### Custom Domain

- **Settings → Custom Domains**
- Ajouter `api.youdom-care.com`
- Configurer CNAME DNS vers Railway

### Logs & Monitoring

- **Deployments** → Cliquer sur un déploiement
- **Logs** → Voir les erreurs en temps réel
- **Metrics** → CPU, Memory, etc.

---

## 4️⃣ GITHUB (Repos)

### Accès Web

| Information | Valeur |
|---|---|
| **URL** | https://github.com |
| **Username** | yourusername |
| **Repos** | youdom-care-crm-frontend + youdom-care-crm-backend |

### Créer l'accès

```bash
# 1. https://github.com/signup
# 2. Créer compte GitHub

# 3. Créer 2 repos:
# - youdom-care-crm-frontend (public ou privé)
# - youdom-care-crm-backend (PRIVÉ - contient secrets)

# 4. Push le code:
# git remote add origin https://github.com/yourusername/youdom-care-crm-frontend.git
# git push -u origin main
```

### Repos

```
Frontend:  https://github.com/yourusername/youdom-care-crm-frontend
Backend:   https://github.com/yourusername/youdom-care-crm-backend (PRIVÉ)
```

### Secrets GitHub (optionnel - pas nécessaire pour Vercel/Railway)

Si tu veux utiliser GitHub Secrets pour CI/CD:
- **Settings → Secrets and variables → Actions**
- Ajouter les secrets sensibles
- Les utiliser dans les workflows

---

## 5️⃣ GOOGLE OAUTH (Login)

### Accès Web

| Information | Valeur |
|---|---|
| **URL** | https://console.cloud.google.com |
| **Email** | ton-email-google@gmail.com |
| **Project** | Youdom Care |

### Créer l'accès

```bash
# 1. https://console.cloud.google.com
# 2. Login avec ton compte Google

# 3. Créer un projet
# Select a project → New Project
# Project name: Youdom Care

# 4. Activer l'API OAuth
# APIs & Services → Enable APIs and Services
# Chercher: Google+ API
# Enable

# 5. Créer les credentials
# Credentials → Create Credentials → OAuth 2.0 Client ID
# Type: Web application
# Name: Youdom Care CRM

# 6. Configurer les URIs
# Authorized JavaScript origins:
#   - http://localhost:3000 (développement)
#   - https://youdom-care.com (production)
# Authorized redirect URIs:
#   - http://localhost:8000/auth/google/callback (dev)
#   - https://api.youdom-care.com/auth/google/callback (prod)

# 7. Copier les credentials
# Client ID: xxxxx.apps.googleusercontent.com
# Client Secret: xxxxx
```

### Secrets à stocker

```
GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = your-client-secret-xxxxx
GOOGLE_REDIRECT_URI = https://api.youdom-care.com/auth/google/callback
```

### Ajouter à Railway env vars

---

## 6️⃣ SMTP EMAIL (Gmail)

### Accès Web

| Information | Valeur |
|---|---|
| **URL** | https://mail.google.com |
| **Email** | noreply@youdomcare.fr (ou ton compte) |
| **Password** | Ton mot de passe Gmail |

### Créer l'accès

```bash
# 1. Activer 2FA sur ton compte Google
# https://myaccount.google.com/security

# 2. Créer une "App Password"
# Security → App passwords
# App: Mail
# Device: Windows Computer (ou autre)
# Generate → Copier le mot de passe

# 3. Utiliser ce mot de passe dans Railway:
# SMTP_USER = noreply@youdomcare.fr
# SMTP_PASSWORD = app-password-généré-par-google
```

### Variables pour Railway

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = noreply@youdomcare.fr
SMTP_PASSWORD = google-app-password-xxxxx
SMTP_FROM = Youdom Care <noreply@youdomcare.fr>
```

---

## 7️⃣ BREVO (Email optionnel - pour plus d'emails)

### Accès Web

| Information | Valeur |
|---|---|
| **URL** | https://www.brevo.com |
| **Email** | ton-email@exemple.com |

### Créer l'accès

```bash
# 1. https://www.brevo.com
# 2. Sign up → Create account

# 3. API Keys
# Settings → API Keys & Webhooks
# API Keys → Create new API key
# Copier la clé

# Gratuit: 300 emails/jour
```

### Variable pour Railway

```
BREVO_API_KEY = your-brevo-api-key-xxxxx
```

---

## 8️⃣ TWILIO (SMS optionnel)

### Accès Web

| Information | Valeur |
|---|---|
| **URL** | https://www.twilio.com |
| **Email** | ton-email@exemple.com |

### Créer l'accès

```bash
# 1. https://www.twilio.com
# 2. Sign up → Create account

# 3. Get credentials
# Console → Account → Account SID
# Console → Auth Token
# Copier les deux

# 4. Acheter un numéro Twilio
# Phone Numbers → Active Numbers → Buy a number
# Pays: France (+33)
```

### Variables pour Railway

```
TWILIO_ACCOUNT_SID = your-account-sid
TWILIO_AUTH_TOKEN = your-auth-token
TWILIO_FROM_NUMBER = +33XXXXXXXXX
```

---

## 🔑 RÉSUMÉ ACCÈS (À REMPLIR)

```
🗄️ MONGODB ATLAS
├─ Email: _______________________
├─ Password: _______________________
├─ Username DB: youdom_admin
├─ Password DB: _______________________
└─ Connection String: mongodb+srv://...

🚀 VERCEL
├─ GitHub Username: _______________________
├─ Project: youdom-care-crm-frontend
├─ URL: https://youdom-care.com
└─ Dashboard: https://vercel.com/dashboard

🚂 RAILWAY
├─ GitHub Username: _______________________
├─ Project: youdom-care-crm-backend
├─ URL: https://api.youdom-care.com
└─ Dashboard: https://railway.app/dashboard

🔐 GOOGLE OAUTH
├─ Project: Youdom Care
├─ Client ID: _______________________
├─ Client Secret: _______________________
└─ Redirect URI: https://api.youdom-care.com/auth/google/callback

📧 GMAIL SMTP
├─ Email: noreply@youdomcare.fr
├─ App Password: _______________________
└─ SMTP: smtp.gmail.com:587

💬 BREVO (optionnel)
├─ Email: _______________________
└─ API Key: _______________________

📱 TWILIO (optionnel)
├─ Account SID: _______________________
├─ Auth Token: _______________________
└─ Phone: +33XXXXXXXXX

🐙 GITHUB
├─ Username: _______________________
├─ Repo Frontend: youdom-care-crm-frontend
└─ Repo Backend: youdom-care-crm-backend (PRIVÉ)
```

---

## ✅ Checklist Déploiement

- [ ] MongoDB Atlas créé + connection string
- [ ] Vercel repo créé + déployé
- [ ] Railway repo créé + env vars configurées
- [ ] Google OAuth credentials créés + ajoutés à Railway
- [ ] Gmail App Password généré + SMTP configuré
- [ ] Domaines custom configurés (optionnel)
- [ ] Tous les secrets sauvegardés en lieu sûr

---

## 🚨 SÉCURITÉ

1. **JAMAIS commit `.env`** sur GitHub
2. **JAMAIS partager** Client ID/Secret publiquement
3. **Utiliser des gestionnaires de secrets** (1Password, Bitwarden)
4. **Activer 2FA** sur tous les comptes (Google, MongoDB, GitHub)
5. **Stocker ce document** dans un endroit sécurisé (chiffré)
6. **Changer les secrets régulièrement** (tous les 3-6 mois)

---

**Document confidentiel — À conserver précieusement** 🔐
