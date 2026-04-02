# 🚀 Quick Start — Youdom Care CRM

## Tl;dr — 3 étapes

### 1) MongoDB Atlas (5 min)
```
https://mongodb.com/cloud
→ Create Cluster (free)
→ Create User: youdom_admin / PASSWORD
→ Get connection string
→ Sauvegarde: mongodb+srv://youdom_admin:PASSWORD@...
```

### 2) Frontend sur Vercel (5 min)
```
1. https://vercel.com → GitHub signup
2. Import repo: github.com/YOUR_USERNAME/youdom-care-crm-frontend
3. Env var: REACT_APP_API_URL=https://api.youdom-care.com
4. Deploy ✅
```

### 3) Backend sur Railway (5 min)
```
1. https://railway.app → GitHub signup
2. Import repo: github.com/YOUR_USERNAME/youdom-care-crm-backend
3. Add all env vars from .env.example
4. MONGODB_URL=mongodb+srv://youdom_admin:PASSWORD@...
5. Deploy ✅
```

**Done!** 🎉

---

## URLs Finales

```
Frontend:  https://youdom-care-crm-frontend.vercel.app
Backend:   https://youdom-care-backend-production.railway.app
Database:  MongoDB Atlas (cloud)
```

---

## Ajouter domaines custom (optionnel)

### Frontend (youdom-care.com)
- Vercel Settings → Domains → Add youdom-care.com
- DNS CNAME vers Vercel

### Backend (api.youdom-care.com)
- Railway Settings → Custom Domains → Add api.youdom-care.com
- DNS CNAME vers Railway

---

## Accéder à la base de données

**MongoDB Compass (GUI):**
1. Télécharger: https://mongodb.com/try/download/compass
2. Paste connection string
3. Voir les données en temps réel ✅

**Web UI:**
- MongoDB Atlas → Collections

---

## Tests

```bash
# Frontend OK?
https://youdom-care-crm-frontend.vercel.app → Login page ✅

# Backend OK?
curl https://youdom-care-backend-production.railway.app/docs
→ Swagger docs ✅

# Database OK?
MongoDB Compass → youdom_care database ✅
```

---

## Dépannage

| Erreur | Fix |
|--------|-----|
| 502 Bad Gateway | Railway backend crash → Check logs |
| Cannot connect MongoDB | Connection string wrong / IP whitelist |
| CORS error | ALLOWED_ORIGINS en .env wrong |
| Login fails | Google OAuth credentials missing |

---

## Coûts

- **Vercel:** Gratuit (hobby plan)
- **Railway:** ~$7/mois (après free credit)
- **MongoDB:** Gratuit (5GB)

**Total:** ~$7/mois 💰

---

**Besoin du guide complet ?** → Voir `DEPLOYMENT_GUIDE.md` 📖
