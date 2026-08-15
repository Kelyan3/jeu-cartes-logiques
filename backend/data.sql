DROP TABLE IF EXISTS user_quests CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS progression CASCADE;
DROP TABLE IF EXISTS levels CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS scoring_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;




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
	best_time_seconds INTEGER,
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

CREATE TABLE feedback (
	id_feedback SERIAL PRIMARY KEY,
	id_user INTEGER REFERENCES users(id_user) ON DELETE SET NULL,
	device VARCHAR(20) NOT NULL,
	device_other VARCHAR(255),
	rules_rating SMALLINT NOT NULL,
	rules_comment TEXT,
	features_rating SMALLINT NOT NULL,
	features_comment TEXT,
	design_rating SMALLINT NOT NULL,
	design_comment TEXT,
	remarks TEXT,
	created_at TIMESTAMP DEFAULT NOW(),

	CONSTRAINT feedback_device_valid CHECK (device IN ('ordinateur', 'mobile', 'autre')),
	CONSTRAINT feedback_rules_rating_valid CHECK (rules_rating BETWEEN 1 AND 5),
	CONSTRAINT feedback_features_rating_valid CHECK (features_rating BETWEEN 1 AND 5),
	CONSTRAINT feedback_design_rating_valid CHECK (design_rating BETWEEN 1 AND 5)
);




INSERT INTO chapters (name, position) VALUES
	('Chapitre 1', 1),
	('Chapitre 2', 2),
	('Chapitre 3', 3),
	('Chapitre 4', 4),
	('Chapitre 5', 5);

INSERT INTO categories (name) VALUES
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

INSERT INTO levels (id_chapter, num, position) VALUES
	-- Chapitre 1 : niveaux 1 à 10
	(1, 1, 1),
	(1, 2, 2),
	(1, 3, 3),
	(1, 4, 4),
	(1, 5, 5),
	(1, 6, 6),
	(1, 7, 7),
	(1, 8, 8),
	(1, 9, 9),
	(1, 10, 10),

	-- Chapitre 2 : niveaux 11 à 20
	(2, 11, 1),
	(2, 12, 2),
	(2, 13, 3),
	(2, 14, 4),
	(2, 15, 5),
	(2, 16, 6),
	(2, 17, 7),
	(2, 18, 8),
	(2, 19, 9),
	(2, 20, 10),

	-- Chapitre 3 : niveaux 21 à 30
	(3, 21, 1),
	(3, 22, 2),
	(3, 23, 3),
	(3, 24, 4),
	(3, 25, 5),
	(3, 26, 6),
	(3, 27, 7),
	(3, 28, 8),
	(3, 29, 9),
	(3, 30, 10),

	-- Chapitre 4 : niveaux 31 à 40
	(4, 31, 1),
	(4, 32, 2),
	(4, 33, 3),
	(4, 34, 4),
	(4, 35, 5),
	(4, 36, 6),
	(4, 37, 7),
	(4, 38, 8),
	(4, 39, 9),
	(4, 40, 10),

	-- Chapitre 5 : niveaux 41 à 50
	(5, 41, 1),
	(5, 42, 2),
	(5, 43, 3),
	(5, 44, 4),
	(5, 45, 5),
	(5, 46, 6),
	(5, 47, 7),
	(5, 48, 8),
	(5, 49, 9),
	(5, 50, 10);

INSERT INTO scoring_settings (id_settings) VALUES (1);