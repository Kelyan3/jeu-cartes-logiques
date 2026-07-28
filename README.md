# Jeu des Cartes Logiques

Jeu éducatif de logique sous forme de cartes : le joueur manipule des cartes reliées (ou pas) par des connecteurs logiques (∧, ∨, ⇒, ⇔, ¬) pour démontrer un objectif, niveau après niveau. Le site propose quelques niveaux tutoriels, un tableau de niveaux, des comptes utilisateurs avec suivi de progression, et un classement des joueurs.

Projet développé dans le cadre d'un projet tutoré à l'Université de la Nouvelle-Calédonie.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Installation en local](#installation-en-local)
  - [Prérequis](#prérequis)
  - [Base de données](#1--base-de-données)
  - [Backend](#2--backend)
  - [Frontend](#3--frontend)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts disponibles](#scripts-disponibles)
- [Ajouter un niveau](#ajouter-un-niveau)
- [API backend](#api-backend)
- [Déploiement](#déploiement)
- [Contributeurs](#contributeurs)

## Fonctionnalités

- Jeu de Cartes Logiques avec plusieurs mécaniques (séparation, implication, fusion, ajout d'objectif, tiers exclus, transitivité).
- Parcours de tutoriels guidés pour apprendre chaque mécanique.
- Éditeur de niveaux intégré (mode "Créer un niveau"), export/import au format JSON.
- Comptes utilisateurs (inscription, connexion, session persistante).
- Suivi de progression par niveau, avec réinitialisation possible.
- Classement des joueurs.
- Mode sombre.

## Stack technique

**Frontend**
- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [react-router-dom](https://reactrouter.com/) pour le routage
- Sass (SCSS) pour les styles, avec variables CSS pour la gestion des thèmes clair/sombre

**Backend**
- [Flask](https://flask.palletsprojects.com/) (Python)
- [Flask-Login](https://flask-login.readthedocs.io/) pour l'authentification par session
- [psycopg](https://www.psycopg.org/) pour la connexion à PostgreSQL
- [Gunicorn](https://gunicorn.org/) comme serveur de production

**Base de données**
- PostgreSQL

**Déploiement**
- Frontend hébergé sur [Vercel](https://vercel.com)
- Backend hébergé sur [Render](https://render.com)
- Base de données hébergée sur [Neon](https://neon.tech)

## Structure du projet

Le dépôt est un monorepo : le frontend est à la racine, le backend dans son propre sous-dossier.

```
.
├── backend/                    # API Flask
│   ├── auth.py                 # Logique des comptes utilisateurs
│   ├── database.py             # Connexion PostgreSQL
│   ├── progress.py             # Logique de progression / classement
│   ├── server.py               # Point d'entrée Flask, routes API
│   ├── data.sql                # Schéma de la base de données
│   └── requirements.txt
├── public/
│   ├── img/                    # Images statiques
│   └── json/
│       ├── exos_feuilles/      # Niveaux (mode Jeu)
│       └── tutoriel/           # Niveaux (mode Tutoriel)
├── scripts/
│   └── generate-manifest.js    # Génère public/json/manifest.json à partir des niveaux présents
├── src/
│   ├── class/Card.js           # Modèle de données d'une carte
│   ├── components/             # Composants réutilisables (Game, Deck, Card, Navigation, ...)
│   ├── config/api.js           # URL de l'API backend selon l'environnement
│   ├── context/                # Contextes React (authentification, thème)
│   ├── pages/                  # Pages / routes de l'application
│   └── styles/                 # Feuilles de style SCSS
├── vercel.json                 # Configuration de déploiement (Vercel)
└── vite.config.js
```

## Installation en local

### Prérequis

- [Node.js](https://nodejs.org/) 20 ou plus récent
- [Python](https://www.python.org/) 3.10 ou plus récent
- [PostgreSQL](https://www.postgresql.org/) installé et lancé localement

### 1. Base de données

Créez une base et un utilisateur dédiés :

```sql
CREATE DATABASE cartes_logiques;
CREATE USER cartes_logiques_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE cartes_logiques TO cartes_logiques_user;
\c cartes_logiques
GRANT ALL ON SCHEMA public TO cartes_logiques_user;
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
```

Créez un fichier `backend/.env` (voir [Variables d'environnement](#variables-denvironnement)), puis initialisez le schéma :

```bash
python database.py
```

Lancez le serveur :

```bash
python server.py
```

Le backend est accessible sur `http://localhost:80` (ou un autre port si `80` nécessite des droits administrateur sur votre système. Dans ce cas, adaptez `app.run(...)` dans `server.py` ainsi que `src/config/api.js`).

### 3. Frontend

Depuis la racine du projet :

```bash
npm install
npm run dev
```

Le site est accessible sur `http://localhost:5173`.

## Variables d'environnement

### `backend/.env`

```
DB_USER=cartes_logiques_user
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cartes_logiques
SECRET_KEY=une_longue_chaine_aleatoire
```

Vous pouvez générer une valeur pour `SECRET_KEY` avec :
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

En production, `DATABASE_URL` (fournie automatiquement par certains hébergeurs) prend le pas sur `DB_*` si elle est définie. `FRONTEND_URL` doit aussi être définie en production, avec l'URL du site déployé (autorise les requêtes cross-origin).

### Frontend (Vercel, ou fichier `.env` local si besoin)

```
VITE_API_URL=https://votre-backend.onrender.com
```
(non nécessaire en développement local, qui pointe automatiquement vers `http://localhost:80`)

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Démarre le serveur de développement Vite |
| `npm run build` | Construit le site pour la production (dossier `dist/`) |
| `npm run preview` | Prévisualise le build de production en local |
| `npm run generate-manifest` | Régénère `public/json/manifest.json` (fait automatiquement avant `dev`/`build`) |
| `npm run lint` | Vérifie le code avec ESLint |

## Ajouter un niveau

1. Créez le niveau via le mode "Créer un niveau" du site, puis téléchargez le fichier JSON généré.
2. Déposez-le dans `public/json/exos_feuilles/` (mode Jeu) ou `public/json/tutoriel/` (mode Tutoriel), en respectant la convention de nommage (`exN.json` / `tutoN.json`, N = numéro du niveau suivant disponible).
3. Le nombre de niveaux est détecté automatiquement au démarrage (`npm run dev` / `npm run build`). Aucune autre modification n'est nécessaire.
4. Si besoin, ajustez le regroupement par catégorie de difficulté dans `src/components/Choice.jsx` (`difficulty`).

## API backend

| Méthode | Route | Description | Authentification |
|---|---|---|---|
| GET | `/api/me` | Utilisateur actuellement connecté | Non |
| POST | `/api/register` | Créer un compte | Non |
| POST | `/api/login` | Se connecter | Non |
| POST | `/api/logout` | Se déconnecter | Oui |
| GET | `/api/progress` | Progression de l'utilisateur connecté | Oui |
| POST | `/api/progress` | Enregistrer la complétion d'un niveau | Oui |
| DELETE | `/api/progress` | Réinitialiser toute la progression | Oui |
| GET | `/api/leaderboard` | Classement de tous les utilisateurs | Non |

## Déploiement

1. **Base de données** sur [Neon](https://neon.tech) (PostgreSQL gratuit, sans expiration)
2. **Backend** sur [Render](https://render.com), avec le dossier racine (*Root Directory*) réglé sur `backend`, commande de build `pip install -r requirements.txt`, commande de démarrage `gunicorn server:app`
3. **Frontend** sur [Vercel](https://vercel.com), qui détecte automatiquement la configuration Vite depuis la racine du dépôt

Points d'attention spécifiques à une architecture multi-domaines (frontend et backend sur des URLs différentes) :
- Les cookies de session nécessitent `SESSION_COOKIE_SAMESITE=None` et `SESSION_COOKIE_SECURE=True` en production (déjà gérés automatiquement dans `server.py` selon l'environnement).
- La variable `FRONTEND_URL` (backend) et `VITE_API_URL` (frontend) doivent correspondre exactement à l'URL de production de l'autre service, sans `/` final.
- La connexion à PostgreSQL nécessite `sslmode=require` (déjà appliqué dans `database.py`).

## Contributeurs

- Florian AUDOUARD
- Adrien FÉRÉ
- Guillaume PERRON
- Kelyan MESNARD
- Mickael MENADI

Encadrement : M. Éric EDO