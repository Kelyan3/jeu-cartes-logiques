# Jeu des Cartes Logiques

Jeu éducatif de logique sous forme de cartes : le joueur manipule des cartes reliées (ou pas) par des connecteurs logiques (∧, ∨, ⇒, ⇔, ¬) pour démontrer un objectif, niveau après niveau. Le site propose quelques niveaux tutoriels, un tableau de niveaux, des comptes utilisateurs avec suivi de progression et de score, et un classement des joueurs.

Projet développé dans le cadre d'un projet tutoré à l'Université de la Nouvelle-Calédonie.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Installation en local](#installation-en-local)
  - [Prérequis](#prérequis)
  - [Base de données](#1--base-de-données)
  - [Backend](#2--backend)
  - [Frontend](#3--frontend)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts disponibles](#scripts-disponibles)
- [Ajouter un niveau](#ajouter-un-niveau)
- [Système de score](#système-de-score)
- [API backend](#api-backend)
- [Déploiement](#déploiement)
- [Contributeurs](#contributeurs)

## Fonctionnalités

- Jeu de Cartes Logiques avec plusieurs mécaniques (séparation, implication, fusion, ajout d'objectif, tiers exclus, transitivité).
- Parcours de tutoriels guidés pour apprendre chaque mécanique.
- Éditeur de niveaux intégré (mode "Créer un niveau"), export/import au format JSON.
- Comptes utilisateurs (inscription, connexion, session persistante).
- Suivi de progression par niveau (complétion, temps, nombre de coups), avec réinitialisation possible.
- Système de score configurable pénalisant le temps et le nombre de coups excessifs (voir [Système de score](#système-de-score)).
- Classement des joueurs, filtrable par catégorie (Étudiant, etc.).
- Interface d'administration : gestion des chapitres/niveaux, des paramètres de score, des quêtes de déblocage, des catégories, et consultation des avis utilisateurs.
- Mode sombre.

## Stack technique

**Frontend**
- [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- [react-router-dom](https://reactrouter.com/) pour le routage
- Sass (SCSS) pour les styles, avec variables CSS pour la gestion des thèmes clair/sombre

**Backend**
- [Flask](https://flask.palletsprojects.com/) (Python), organisé en Application Factory + Blueprints
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

### Backend

Organisé selon le pattern **Application Factory** : la configuration, les extensions et les routes (regroupées par domaine en *blueprints*) sont séparées de la logique métier (*services*).

```
backend/
├── app/
│   ├── __init__.py               # create_app() : assemble l'application Flask
│   ├── config.py                 # Configuration (clé secrète, cookies, CORS)
│   ├── extensions.py             # Instances partagées (login_manager)
│   ├── database.py               # Connexion PostgreSQL (CONN_PARAMS)
│   ├── routes/                   # Un blueprint par domaine fonctionnel
│   │   ├── auth.py               # /api/register, /login, /logout, /me, /categories, /profile/category
│   │   ├── progress.py           # /api/progress, /chapters, /quests, /leaderboard
│   │   ├── admin.py              # /api/admin/chapters, /levels, /scoring, /quests, /categories
│   │   └── feedback.py           # /api/feedback, /api/admin/feedback
│   ├── services/                 # Logique métier & accès aux données (un fichier par domaine)
│   │   ├── auth_service.py
│   │   ├── progress_service.py   # dont compute_score(), voir Système de score
│   │   ├── admin_service.py
│   │   └── feedback_service.py
│   └── utils/
│       ├── decorators.py         # admin_required, audit_log
│       └── helpers.py            # get_json_body
├── data.sql                      # Schéma de la base de données
├── requirements.txt
└── wsgi.py                       # Point d'entrée (create_app())
```

### Frontend

La logique du jeu est séparée en trois couches : logique pure et testable (`domain/`), état/comportement réutilisable (`hooks/`), et composants d'affichage (`components/`, `pages/`).

```
src/
├── domain/                         # Logique pure, indépendante de React
│   ├── Card.js                     # Modèle de données d'une carte
│   ├── gameSolver.js               # Résolution automatique / indices
│   ├── gameInput.js                # Parsing JSON, setup initial, messages tutoriel
│   └── rules/                      # Une règle du jeu = une fonction pure par fichier
│       ├── goals.js                # Gestion des objectifs/decks (delCard, buildObjectives, deckContain, ...)
│       ├── addToGame.js
│       ├── demonstration.js        # Construction du texte de démonstration
│       ├── selection.js
│       ├── tiersExclus.js
│       ├── addObjectif.js
│       ├── mergeCards.js           # Séparation, ajout par implication, fusion "et"
│       ├── isWin.js                # Détection de victoire (récursif)
│       └── transitivite.js
├── hooks/                          # État et comportements réutilisables
│   ├── useAuth.js, useTheme.js
│   ├── useGameFile.js              # Import/export JSON d'une partie
│   ├── useCardSelection.js         # Mécanique de sélection de cartes
│   ├── useGamePopups.js
│   ├── useProgressSave.js          # Sauvegarde de progression + navigation niveau suivant
│   ├── useClickOutsideMenu.js
│   └── useUnlockedActions.js       # Boutons débloqués par quête
├── components/                     # Composants réutilisables (Game, Deck, Card, Navigation, ...)
├── config/api.js                   # URL de l'API backend selon l'environnement
├── context/                        # Contextes React (authentification, thème)
├── pages/                          # Pages / routes de l'application
│   └── admin/                      # Sous-composants de la page Admin, un par section
│       ├── constants.js
│       ├── ChaptersSection.jsx, LevelsSection.jsx
│       ├── ScoringSection.jsx, QuestsSection.jsx
│       ├── CategoriesSection.jsx, FeedbackSection.jsx, FeedbackRating.jsx
└── styles/                         # Feuilles de style SCSS

public/
├── img/                            # Images statiques
└── json/
    ├── exos_feuilles/              # Niveaux (mode Jeu)
    └── tutoriel/                   # Niveaux (mode Tutoriel)

scripts/
└── generate-manifest.js            # Génère public/json/manifest.json à partir des niveaux présents

vercel.json                         # Configuration de déploiement (Vercel)
vite.config.js
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
python -m app.database
```

Lancez le serveur :

```bash
python wsgi.py
```

Le backend est accessible sur `http://localhost:80` (ou un autre port si `80` nécessite des droits administrateur sur votre système. Dans ce cas, adaptez `app.run(...)` dans `wsgi.py` ainsi que `src/config/api.js`).

### 3. Frontend

Depuis la racine du projet :

```bash
npm install
npm run dev
```

Le site est accessible sur `http://localhost:5173`.

### 4. Créer un premier compte administrateur

Aucun compte admin n'est créé automatiquement par `data.sql`. Inscrivez-vous normalement depuis le site (`/register`), puis promouvez votre compte directement en base :

```sql
UPDATE users SET role = 'admin' WHERE email = 'votre@email.fr';
```

Reconnectez-vous ensuite pour accéder à la page `/admin`.

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
3. Le nombre de niveaux est détecté automatiquement au démarrage (`npm run dev` / `npm run build`). Aucune autre modification n'est nécessaire côté fichiers JSON.
4. Depuis la page Admin (section "Niveaux"), rattachez le niveau à un chapitre pour qu'il apparaisse dans le mode Jeu.
5. Si besoin, ajustez le regroupement par catégorie de difficulté dans `src/components/Choice.jsx` (`difficulty`).

## Système de score

Un score est calculé uniquement pour les niveaux joués **en mode Jeu** (le mode Tutoriel et le mode Création n'attribuent pas de score). Il est enregistré à chaque complétion de niveau, avec le temps écoulé et le nombre de coups joués.

### Formule

```
score = max(score_min, score_max − pénalité_temps − pénalité_coups)
```

- **Pénalité de temps** : au-delà d'un délai de grâce (`time_grace_s`), le score perd `time_penalty` points par tranche complète de `time_interval_s` secondes dépassée.
- **Pénalité de coups** : au-delà d'un seuil (`moves_threshold`), le score perd `moves_rate` points par coup supplémentaire (un "coup" correspond à une action qui modifie l'état du jeu, par exemple une fusion ou un ajout de carte).
- Le score ne descend jamais sous `score_min`, quelle que soit l'ampleur des pénalités.

Implémentation : `compute_score()` dans `backend/app/services/progress_service.py`.

### Paramètres (table `scoring_settings`, valeurs par défaut)

| Paramètre | Description | Défaut |
|---|---|---|
| `score_max` | Score maximal (aucune pénalité) | 100 |
| `score_min` | Score plancher, quelles que soient les pénalités | 10 |
| `time_grace_s` | Délai de grâce avant que la pénalité de temps ne s'applique (secondes) | 60 |
| `time_interval_s` | Durée d'une tranche de pénalité de temps (secondes) | 10 |
| `time_penalty` | Points perdus par tranche de temps dépassée | 1 |
| `moves_threshold` | Nombre de coups autorisés avant pénalité | 10 |
| `moves_rate` | Points perdus par coup au-delà du seuil | 3 |

Ces paramètres sont **globaux** (ils s'appliquent à tous les niveaux du mode Jeu) et modifiables depuis la page Admin, section "Gestion du score" (`GET`/`PUT /api/admin/scoring`, réservé aux administrateurs). La table impose des contraintes `CHECK` en base (`score_min ≤ score_max`, `time_interval_s > 0`, aucune valeur négative) — voir `backend/data.sql`.

## API backend

| Méthode | Route | Description | Authentification |
|---|---|---|---|
| GET | `/api/me` | Utilisateur actuellement connecté | Non |
| POST | `/api/register` | Créer un compte | Non |
| POST | `/api/login` | Se connecter | Non |
| POST | `/api/logout` | Se déconnecter | Oui |
| GET | `/api/categories` | Liste des catégories utilisateur | Non |
| POST | `/api/profile/category` | Choisit la catégorie de l'utilisateur connecté | Oui |
| GET | `/api/chapters` | Chapitres "Play" et leurs niveaux, avec statut verrouillé/complété | Non |
| GET | `/api/quests` | Boutons d'action débloqués par l'utilisateur, regroupés par menu | Non |
| GET | `/api/progress` | Progression de l'utilisateur connecté | Oui |
| POST | `/api/progress` | Enregistrer la complétion d'un niveau (temps, coups → score, voir [Système de score](#système-de-score)) | Oui |
| DELETE | `/api/progress` | Réinitialiser toute la progression | Oui |
| GET | `/api/leaderboard` | Classement de tous les utilisateurs (filtrable par `?category=`) | Non |
| POST | `/api/feedback` | Envoyer un avis sur le site (anonyme ou non) | Non |
| GET/POST/PUT/DELETE | `/api/admin/chapters[/:id]`, `/api/admin/chapters/reorder` | CRUD et réordonnancement des chapitres | Admin |
| GET/POST/PUT/DELETE | `/api/admin/levels[/:id]`, `/api/admin/levels/unassigned`, `/api/admin/levels/reorder` | Rattachement/réordonnancement des niveaux existants dans un chapitre | Admin |
| GET/PUT | `/api/admin/scoring` | Consulter/modifier les paramètres globaux de score | Admin |
| GET/POST/PUT/DELETE | `/api/admin/quests[/:id]` | CRUD des quêtes (déblocage des boutons d'action) | Admin |
| POST/PUT/DELETE | `/api/admin/categories[/:id]` | CRUD des catégories utilisateur | Admin |
| GET/DELETE | `/api/admin/feedback[/:id]` | Consultation et suppression des avis envoyés | Admin |

## Déploiement

1. **Base de données** sur [Neon](https://neon.tech) (PostgreSQL gratuit, sans expiration)
2. **Backend** sur [Render](https://render.com), avec le dossier racine (*Root Directory*) réglé sur `backend`, commande de build `pip install -r requirements.txt`, commande de démarrage `gunicorn wsgi:app`
3. **Frontend** sur [Vercel](https://vercel.com), qui détecte automatiquement la configuration Vite depuis la racine du dépôt

Points d'attention spécifiques à une architecture multi-domaines (frontend et backend sur des URLs différentes) :
- Les cookies de session nécessitent `SESSION_COOKIE_SAMESITE=None` et `SESSION_COOKIE_SECURE=True` en production (déjà gérés automatiquement dans `app/config.py` selon l'environnement).
- La variable `FRONTEND_URL` (backend) et `VITE_API_URL` (frontend) doivent correspondre exactement à l'URL de production de l'autre service, sans `/` final.
- La connexion à PostgreSQL nécessite `sslmode=require` (déjà appliqué dans `app/database.py`).

## Contributeurs

- Florian AUDOUARD
- Adrien FÉRÉ
- Guillaume PERRON
- Kelyan MESNARD
- Mickael MENADI

Encadrement : M. Éric EDO