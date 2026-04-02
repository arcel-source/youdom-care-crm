# 🚂 RAILWAY — Variables d'Environnement Complètes
**Youdom Care CRM Backend**

---

## 🎯 COMMENT AJOUTER LES VARIABLES

1. Aller sur **https://railway.app/dashboard**
2. Cliquer sur ton **projet** (youdom-care-crm-backend)
3. **Variables** (onglet)
4. **Ajouter chaque variable** ci-dessous

---

## 📋 VARIABLES OBLIGATOIRES

### 1️⃣ MONGODB (Base de données)

```
MONGODB_URL = mongodb+srv://youdom_admin:YOUR_PASSWORD@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
MONGODB_DB = youdom_care
```

**Comment obtenir :**
- MongoDB Atlas → Connection String
- Remplacer `PASSWORD` par le mot de passe créé

---

### 2️⃣ GOOGLE OAUTH (Login)

```
GOOGLE_CLIENT_ID = YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI = https://api.youdom-care.com/auth/google/callback
```

**Comment obtenir :**
1. https://console.cloud.google.com
2. Créer un projet
3. APIs & Services → OAuth 2.0 Client ID
4. Type: Web application
5. Authorized JavaScript origins: `https://youdom-care.com`
6. Authorized redirect URIs: `https://api.youdom-care.com/auth/google/callback`
7. Copier Client ID et Client Secret

---

### 3️⃣ SÉCURITÉ

```
SECRET_KEY = votre-cle-secrete-min-32-caracteres-uuid-ou-random
ENCRYPTION_KEY = your-fernet-key-base64-32-bytes
SESSION_EXPIRE_HOURS = 8
```

**Comment générer :**

**SECRET_KEY (Python):**
```python
import secrets
print(secrets.token_urlsafe(32))
# Copier le résultat
```

**ENCRYPTION_KEY (Python):**
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
# Copier le résultat
```

---

### 4️⃣ CORS (Domaines autorisés)

```
ALLOWED_ORIGINS = https://youdom-care.com,https://www.youdom-care.com
```

**À adapter si tu as des sous-domaines**

---

### 5️⃣ EMAIL SMTP (Gmail)

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = noreply@youdomcare.fr
SMTP_PASSWORD = votre-app-password-gmail
SMTP_FROM = Youdom Care <noreply@youdomcare.fr>
```

**Comment obtenir le SMTP_PASSWORD :**
1. Activer 2FA sur ton compte Google: https://myaccount.google.com/security
2. Security → App passwords
3. App: Mail
4. Device: Windows Computer (ou autre)
5. Generate → Copier le mot de passe généré

---

### 6️⃣ BREVO (Email optionnel - 300/jour gratuit)

```
BREVO_API_KEY = your-brevo-api-key
```

**Comment obtenir :**
1. https://www.brevo.com
2. Sign up
3. Settings → API Keys & Webhooks
4. API Keys → Créer une clé
5. Copier la clé

---

### 7️⃣ TWILIO (SMS optionnel)

```
TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER = +33XXXXXXXXX
```

**Comment obtenir :**
1. https://www.twilio.com
2. Sign up
3. Console → Account SID et Auth Token
4. Phone Numbers → Acheter un numéro France
5. Copier les infos

---

### 8️⃣ APP CONFIG

```
APP_NAME = Youdom Care CRM
APP_URL = https://youdom-care.com
ENVIRONMENT = production
```

---

## 🔧 COMPLET - À COPIER-COLLER DANS RAILWAY

```
MONGODB_URL=mongodb+srv://youdom_admin:PASSWORD@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
MONGODB_DB=youdom_care
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://api.youdom-care.com/auth/google/callback
SECRET_KEY=votre-secret-key-32-chars
ENCRYPTION_KEY=your-fernet-key-base64
SESSION_EXPIRE_HOURS=8
ALLOWED_ORIGINS=https://youdom-care.com,https://www.youdom-care.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@youdomcare.fr
SMTP_PASSWORD=votre-app-password-gmail
SMTP_FROM=Youdom Care <noreply@youdomcare.fr>
BREVO_API_KEY=your-brevo-api-key
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+33XXXXXXXXX
APP_NAME=Youdom Care CRM
APP_URL=https://youdom-care.com
ENVIRONMENT=production
```

---

## 📝 ÉTAPES POUR RAILWAY

### A) Créer le projet
1. https://railway.app
2. GitHub Sign Up (avec ton compte GitHub)
3. New Project → Deploy from GitHub repo
4. Sélectionner `youdom-care-crm-backend`
5. Deploy

### B) Ajouter les variables
1. Railway Dashboard → Projet
2. **Variables** (onglet)
3. Cliquer **Raw Editor**
4. Copier-coller tout ce qui est dans la section "COMPLET" ci-dessus
5. Remplacer les `YOUR_*` par tes vraies valeurs
6. **Save**

### C) Redéployer
1. Railway → **Deployments**
2. Cliquer sur le déploiement en rouge (ou gris)
3. **Redeploy** (bouton en haut)
4. Attendre le ✅ vert

---

## ✅ VÉRIFIER QUE ÇA MARCHE

```bash
# Terminal - tester l'API
curl https://youdom-care-backend-production.railway.app/docs

# Tu devrais voir la doc Swagger
# Si 502 → vérifier les logs Railway
```

---

## 🔑 RÉSUMÉ - À REMPLIR AVEC TES VRAIES VALEURS

```
MongoDB:
├─ MONGODB_URL = mongodb+srv://youdom_admin:_______________________@youdom-care.mongodb.net/youdom_care?retryWrites=true&w=majority
└─ MONGODB_DB = youdom_care

Google OAuth:
├─ GOOGLE_CLIENT_ID = _______________________
├─ GOOGLE_CLIENT_SECRET = _______________________
└─ GOOGLE_REDIRECT_URI = https://api.youdom-care.com/auth/google/callback

Sécurité:
├─ SECRET_KEY = _______________________
├─ ENCRYPTION_KEY = _______________________
└─ SESSION_EXPIRE_HOURS = 8

CORS:
└─ ALLOWED_ORIGINS = https://youdom-care.com,https://www.youdom-care.com

Email SMTP:
├─ SMTP_HOST = smtp.gmail.com
├─ SMTP_PORT = 587
├─ SMTP_USER = noreply@youdomcare.fr
├─ SMTP_PASSWORD = _______________________
└─ SMTP_FROM = Youdom Care <noreply@youdomcare.fr>

Brevo (optionnel):
└─ BREVO_API_KEY = _______________________

Twilio (optionnel):
├─ TWILIO_ACCOUNT_SID = _______________________
├─ TWILIO_AUTH_TOKEN = _______________________
└─ TWILIO_FROM_NUMBER = _______________________

App:
├─ APP_NAME = Youdom Care CRM
├─ APP_URL = https://youdom-care.com
└─ ENVIRONMENT = production
```

---

## 🚨 SÉCURITÉ - IMPORTANT

1. **JAMAIS partager** tes secrets (Client ID, API Keys, etc.)
2. **Stocker ce fichier** en lieu sûr (chiffré: 1Password, Bitwarden)
3. **Mettre à jour les secrets** tous les 6 mois
4. **Activer 2FA** sur Google et MongoDB
5. **Garder .env local** si tu testes en développement (JAMAIS push sur GitHub)

---

**Guide complet — Prêt à copier-coller dans Railway** 🚀
