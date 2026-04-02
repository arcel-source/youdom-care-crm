# 🚀 RAILWAY SETUP — Démarrage Rapide (5 minutes)

---

## 📋 CHECKLIST RAPIDE

- [ ] Railway.app account créé (GitHub)
- [ ] Repo youdom-care-crm-backend connecté
- [ ] MongoDB Atlas cluster créé
- [ ] Google OAuth credentials créés
- [ ] Variables ajoutées à Railway
- [ ] Déploiement fait (✅ vert)

---

## 🔑 ÉTAPE 1 : MongoDB Atlas (Copier-Coller)

### A) Créer le compte
```
https://mongodb.com/cloud
Sign up avec email
Vérifier email
```

### B) Créer le cluster
```
Build → Shared (FREE)
Provider: AWS
Region: eu-west-1
Name: youdom-care
Create
```

### C) Créer l'utilisateur
```
Security → Database Access
Add New Database User
Username: youdom_admin
Password: Générer un mot de passe fort (copier)
Built-in Role: Atlas Admin
Create User
```

### D) Copier la connection string
```
Databases → youdom-care → Connect → Drivers → Python
Copier la string et remplacer PASSWORD:

mongodb+srv://youdom_admin:PASSWORD@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
```

### E) Whitelist IP
```
Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)
Confirm
```

✅ **MongoDB prêt**

---

## 🔐 ÉTAPE 2 : Google OAuth (5 min)

### A) Créer le projet Google
```
https://console.cloud.google.com
Créer un nouveau projet: "Youdom Care"
```

### B) Créer les credentials OAuth
```
APIs & Services → OAuth 2.0 Client ID
Type: Web application
Name: Youdom Care CRM

Authorized JavaScript origins:
  - https://youdom-care.com

Authorized redirect URIs:
  - https://api.youdom-care.com/auth/google/callback

Create
Copier:
- Client ID: _______________________
- Client Secret: _______________________
```

✅ **Google OAuth prêt**

---

## 📧 ÉTAPE 3 : Gmail SMTP (2 min)

### A) Activer 2FA Google
```
https://myaccount.google.com/security
Activer 2FA (si pas déjà fait)
```

### B) Créer App Password
```
Security → App passwords
App: Mail
Device: Windows Computer (ou autre)
Generate
Copier le mot de passe généré
```

**Exemple:** `asdf qwer tyui oppp`

✅ **Gmail SMTP prêt**

---

## 🚂 ÉTAPE 4 : Railway Deployment (3 min)

### A) Créer le compte
```
https://railway.app
GitHub Sign Up
Autoriser Railway
```

### B) Créer le projet
```
New Project
Deploy from GitHub repo
Sélectionner: youdom-care-crm-backend
Deploy
```

### C) Ajouter les variables
```
Railway Dashboard → Projet → Variables
Raw Editor → Copier-coller:
```

**COPIER-COLLER CECI (remplacer les ___ par tes vraies valeurs):**

```
MONGODB_URL=mongodb+srv://youdom_admin:MON_PASSWORD@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
MONGODB_DB=youdom_care
GOOGLE_CLIENT_ID=MON_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=MON_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://api.youdom-care.com/auth/google/callback
SECRET_KEY=super-secret-key-32-caracteres-ou-plus
ENCRYPTION_KEY=your-fernet-key
SESSION_EXPIRE_HOURS=8
ALLOWED_ORIGINS=https://youdom-care.com,https://www.youdom-care.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@youdomcare.fr
SMTP_PASSWORD=MON_APP_PASSWORD_GMAIL
SMTP_FROM=Youdom Care <noreply@youdomcare.fr>
APP_NAME=Youdom Care CRM
APP_URL=https://youdom-care.com
ENVIRONMENT=production
```

### D) Sauvegarder et redéployer
```
Save
Deployments → Redeploy
Attendre le ✅ vert
```

✅ **Railway prêt**

---

## 🌐 ÉTAPE 5 : Vercel Frontend (2 min)

### A) Créer le projet
```
https://vercel.com
GitHub Sign Up
New Project
Sélectionner: youdom-care-crm-frontend
Import Project
```

### B) Ajouter la variable
```
Environment Variables:
REACT_APP_API_URL = https://api.youdom-care.com
Deploy
```

✅ **Frontend déployé**

---

## ✅ TEST FINAL

```bash
# 1) Frontend OK?
https://youdom-care-crm-frontend.vercel.app
→ Tu vois la page de login ✅

# 2) Backend API OK?
curl https://youdom-care-backend-production.railway.app/docs
→ Tu vois la doc Swagger ✅

# 3) Database OK?
MongoDB Compass → Connection string
→ Tu vois la base youdom_care ✅
```

---

## 📊 URLs FINALES

```
Frontend:  https://youdom-care-crm-frontend.vercel.app
Backend:   https://youdom-care-backend-production.railway.app
Database:  MongoDB Atlas (cloud)
Docs API:  https://youdom-care-backend-production.railway.app/docs
```

---

## 🎯 PROCHAINES ÉTAPES

1. **Ajouter domaines custom** (optionnel)
   - Vercel: youdom-care.com
   - Railway: api.youdom-care.com

2. **Configurer emails** (tests)
   - Envoyer un email de test depuis le backend

3. **Créer des données de test**
   - Ajouter des bénéficiaires
   - Créer des devis

---

## 🆘 PROBLÈMES COURANTS

| Erreur | Solution |
|--------|----------|
| 502 Bad Gateway | Vérifier les logs Railway (backend crash) |
| CORS error | ALLOWED_ORIGINS mal configuré |
| MongoDB connexion refused | Connection string mauvaise ou IP pas whitelistée |
| Google login fails | Client ID/Secret manquant ou incorrect |

---

**Setup complet en ~15 minutes** 🚀

Questions ? Consulte `RAILWAY_ENV_VARS.md` pour le détail complet.
