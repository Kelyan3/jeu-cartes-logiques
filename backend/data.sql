DROP TABLE IF EXISTS user_quests CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS progression CASCADE;
DROP TABLE IF EXISTS levels CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS categories CASCADE;




CREATE TABLE categories (
	id_category SERIAL PRIMARY KEY,
	name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
	id_user SERIAL PRIMARY KEY,
	username VARCHAR(50) UNIQUE NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	role VARCHAR(20) NOT NULL DEFAULT 'user',
	id_category INTEGER REFERENCES categories(id_category),
	created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE progression (
	id_progress SERIAL PRIMARY KEY,
	id_user INTEGER NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
	mode VARCHAR(20) NOT NULL,
	num INTEGER NOT NULL,
	completed BOOLEAN DEFAULT FALSE,
	score INTEGER DEFAULT 0,
	updated_at TIMESTAMP DEFAULT NOW(),
	UNIQUE(id_user, mode, num)
);

CREATE TABLE chapters (
	id_chapter SERIAL PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	position INTEGER NOT NULL UNIQUE
);

CREATE TABLE scoring_settings (
	id_settings INTEGER PRIMARY KEY DEFAULT 1,
	score_max INTEGER NOT NULL DEFAULT 100,
	score_min INTEGER NOT NULL DEFAULT 10,
	time_grace_s INTEGER NOT NULL DEFAULT 60,
	time_interval_s INTEGER NOT NULL DEFAULT 10,
	time_penalty INTEGER NOT NULL DEFAULT 1,
	moves_threshold INTEGER NOT NULL DEFAULT 10,
	moves_rate INTEGER NOT NULL DEFAULT 3,

	CONSTRAINT score_bounds_valid CHECK (score_min >= 0 AND score_min <= score_max),
	CONSTRAINT time_params_valid CHECK (time_grace_s >= 0 AND time_interval_s > 0 AND time_penalty >= 0),
	CONSTRAINT moves_params_valid CHECK (moves_threshold >= 0 AND moves_rate >= 0)
);

CREATE TABLE levels (
	id_level SERIAL PRIMARY KEY,
	id_chapter INTEGER NOT NULL REFERENCES chapters(id_chapter) ON DELETE CASCADE,
	num INTEGER NOT NULL UNIQUE,
	position INTEGER NOT NULL
);

CREATE TABLE quests (
	id_quest SERIAL PRIMARY KEY,
	menu VARCHAR(30) NOT NULL,
	label VARCHAR(150) NOT NULL,
	unlocks_key VARCHAR(50) NOT NULL,
	required_chapter INTEGER REFERENCES chapters(id_chapter),
	position INTEGER NOT NULL
);

CREATE TABLE user_quests (
	id_user INTEGER NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
	id_quest INTEGER NOT NULL REFERENCES quests(id_quest) ON DELETE CASCADE,
	unlocked_at TIMESTAMP DEFAULT NOW(),
	PRIMARY KEY (id_user, id_quest)
);




INSERT INTO chapters (name, position) VALUES ('Chapitre 1', 1);

INSERT INTO categories (name) VALUES
	('Professeur'),
	('Étudiant'),
	('Autres');

INSERT INTO quests (menu, label, unlocks_key, required_chapter, position) VALUES
	('base', 'Séparation', 'addAnd', NULL, 1),
	('base', 'Implique', 'addImplique', NULL, 2),
	('base', 'Fusion', 'fuseAnd', NULL, 3),
	('objectif', 'Objectif "=>" dans objectif', 'addGoal_objectif', (SELECT id_chapter FROM chapters WHERE position = 1), 1),
	('objectif', 'Objectif "=>" dans LPU', 'addGoal_lpu', (SELECT id_chapter FROM chapters WHERE position = 1), 2),
	('objectif', 'Objectif "et" dans LPU', 'addGoal_et', (SELECT id_chapter FROM chapters WHERE position = 1), 3),
	('tiers_exclus', 'Tiers exclus (étape 1)', 'tiersExclus', (SELECT id_chapter FROM chapters WHERE position = 1), 1),
	('tiers_exclus', 'Tiers exclus (étape 2)', 'tiersExclus', (SELECT id_chapter FROM chapters WHERE position = 1), 2),
	('transitivite', 'Transitivité "=>"', 'transitivite_arrow', (SELECT id_chapter FROM chapters WHERE position = 1), 1),
	('transitivite', 'Transitivité "<=>"', 'transitivite_equiv', (SELECT id_chapter FROM chapters WHERE position = 1), 2),
	('transitivite', 'Transitivité "<=>" symétrique', 'transitivite_equiv_sym', (SELECT id_chapter FROM chapters WHERE position = 1), 3);

INSERT INTO scoring_settings (id_settings) VALUES (1);