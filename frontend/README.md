# Youdom Care CRM - Frontend

Interface React pour le CRM de services d'aide à domicile Youdom Care.

## Installation

```bash
npm install
```

## Démarrage

```bash
npm start
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

## Build production

```bash
npm run build
```

Les fichiers seront générés dans le dossier `build/`.

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner les valeurs :

```env
REACT_APP_API_URL=http://localhost:8000    # URL de l'API backend
REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID  # Client ID Google OAuth
```

## Architecture

```
src/
├── api.js              # Client HTTP axios + intercepteurs
├── App.js              # Routeur principal + routes protégées
├── contexts/
│   └── AuthContext.js  # Authentification (token, user, login/logout)
├── components/
│   ├── layout/         # Sidebar, Header, Layout wrapper
│   ├── common/         # Composants partagés (Modal, Badge, StatCard...)
│   └── ui/             # Briques UI (Button, Input, Select...)
├── pages/              # Pages de l'application
└── utils/
    ├── constants.js    # Constantes (statuts, couleurs, types...)
    └── helpers.js      # Fonctions utilitaires (formatDate, formatMoney...)
```

## Stack technique

- **React 18** — Framework UI
- **React Router v6** — Navigation
- **Axios** — Client HTTP
- **Tailwind CSS** — Styles utilitaires
- **Lucide React** — Icônes
- **Recharts** — Graphiques (dashboard)

## Authentification

L'app supporte deux modes :
1. **Google OAuth** — Bouton "Se connecter avec Google" (nécessite `REACT_APP_GOOGLE_CLIENT_ID`)
2. **Email + OTP** — Fallback si Google non disponible

Le token JWT est stocké dans `localStorage` et ajouté automatiquement à chaque requête API.
