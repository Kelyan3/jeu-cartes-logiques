import json
import os

import psycopg

from database import CONN_PARAMS, FILENAME_MANIFEST

#============================================================================
# Chapitres
#============================================================================

def create_chapter(name, position=None):
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			if position is None:
				cur.execute("SELECT COALESCE(MAX(position), 0) + 1 FROM chapters")
				position = cur.fetchone()[0]
			cur.execute(
				"INSERT INTO chapters (name, position) VALUES (%s, %s) RETURNING id_chapter",
				(name, position),
			)
			id_chapter = cur.fetchone()[0]
			conn.commit()
			return id_chapter

def update_chapter(id_chapter, name=None, position=None):
	fields, params = [], []
	if name is not None:
		fields.append("name = %s")
		params.append(name)
	if position is not None:
		fields.append("position = %s")
		params.append(position)
	if not fields:
		return

	params.append(id_chapter)
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(f"UPDATE chapters SET {', '.join(fields)} WHERE id_chapter = %s", params)
			conn.commit()

def delete_chapter(id_chapter):
	"""Supprime le chapitre et, par CASCADE, ses niveaux (mais pas les fichiers exN.json)."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("DELETE FROM chapters WHERE id_chapter = %s", (id_chapter,))
			conn.commit()

def reorder_chapters(ordered_ids):
	"""
	Réassigne en une seule transaction les positions (1, 2, 3...) des chapitres
	dans l'ordre donné par ordered_ids (liste d'id_chapter).
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			for position, id_chapter in enumerate(ordered_ids, start=1):
				cur.execute(
					"UPDATE chapters SET position = %s WHERE id_chapter = %s",
					(position, id_chapter),
				)
			conn.commit()

#============================================================================
# Niveaux
#============================================================================

def list_unassigned_levels():
	"""Numéros de niveaux "Play" présents dans manifest.json mais pas encore dans la table levels."""
	if not os.path.exists(FILENAME_MANIFEST):
		return []

	with open(FILENAME_MANIFEST, "r", encoding="utf-8") as file:
		manifest = json.load(file)
	play_count = manifest.get("Play", 0)

	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT num FROM levels")
			assigned = {row[0] for row in cur.fetchall()}

	return [num for num in range(1, play_count + 1) if num not in assigned]

def assign_level(num, id_chapter, position=None):
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			if position is None:
				cur.execute("SELECT COALESCE(MAX(position), 0) + 1 FROM levels WHERE id_chapter = %s", (id_chapter,))
				position = cur.fetchone()[0]

			cur.execute(
				"INSERT INTO levels (id_chapter, num, position) VALUES (%s, %s, %s) RETURNING id_level",
				(id_chapter, num, position),
			)
			id_level = cur.fetchone()[0]
			conn.commit()
			return id_level

def update_level(id_level, id_chapter=None, position=None):
	fields, params = [], []
	if id_chapter is not None:
		fields.append("id_chapter = %s")
		params.append(id_chapter)
	if position is not None:
		fields.append("position = %s")
		params.append(position)
	if not fields:
		return

	params.append(id_level)
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(f"UPDATE levels SET {', '.join(fields)} WHERE id_level = %s", params)
			conn.commit()

def reorder_levels(id_chapter, ordered_ids):
	"""
	Réassigne en une seule transaction les positions (1, 2, 3...) des niveaux
	du chapitre id_chapter, dans l'ordre donné par ordered_ids (liste d'id_level).
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			for position, id_level in enumerate(ordered_ids, start=1):
				cur.execute(
					"UPDATE levels SET position = %s WHERE id_level = %s AND id_chapter = %s",
					(position, id_level, id_chapter),
				)
			conn.commit()

def delete_level(id_level):
	"""Retire le niveau de son chapitre (le fichier exN.json n'est pas touché)."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("DELETE FROM levels WHERE id_level = %s", (id_level,))
			conn.commit()

#============================================================================
# Quêtes
#============================================================================

def list_quests_admin():
	"""Liste complète des quêtes (contrairement à /api/quests, pas filtrée par utilisateur)."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				SELECT q.id_quest, q.menu, q.label, q.unlocks_key, q.required_chapter, q.position, c.name
				FROM quests q
				LEFT JOIN chapters c ON c.id_chapter = q.required_chapter
				ORDER BY q.menu, q.position
				"""
			)
			rows = cur.fetchall()

	return [
		{
			"id_quest": id_quest,
			"menu": menu,
			"label": label,
			"unlocks_key": unlocks_key,
			"required_chapter": required_chapter,
			"required_chapter_name": chapter_name,
			"position": position,
		}
		for id_quest, menu, label, unlocks_key, required_chapter, position, chapter_name in rows
	]

def create_quest(menu, label, unlocks_key, required_chapter, position):
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				INSERT INTO quests (menu, label, unlocks_key, required_chapter, position)
				VALUES (%s, %s, %s, %s, %s) RETURNING id_quest
				""",
				(menu, label, unlocks_key, required_chapter, position),
			)
			id_quest = cur.fetchone()[0]
			conn.commit()
			return id_quest

def update_quest(id_quest, menu=None, label=None, unlocks_key=None, required_chapter="__unset__", position=None):
	"""
	required_chapter utilise une sentinelle ("__unset__") plutôt que None comme
	valeur par défaut, car None est ici une valeur métier valide (= toujours
	débloquée) qu'on doit pouvoir explicitement écrire en base.
	"""
	fields, params = [], []
	if menu is not None:
		fields.append("menu = %s")
		params.append(menu)
	if label is not None:
		fields.append("label = %s")
		params.append(label)
	if unlocks_key is not None:
		fields.append("unlocks_key = %s")
		params.append(unlocks_key)
	if required_chapter != "__unset__":
		fields.append("required_chapter = %s")
		params.append(required_chapter)
	if position is not None:
		fields.append("position = %s")
		params.append(position)
	if not fields:
		return

	params.append(id_quest)
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(f"UPDATE quests SET {', '.join(fields)} WHERE id_quest = %s", params)
			conn.commit()

def delete_quest(id_quest):
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("DELETE FROM quests WHERE id_quest = %s", (id_quest,))
			conn.commit()

#============================================================================
# Catégories
#============================================================================

def create_category(name):
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("INSERT INTO categories (name) VALUES (%s) RETURNING id_category", (name,))
			id_category = cur.fetchone()[0]
			conn.commit()
			return id_category

def update_category(id_category, name):
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("UPDATE categories SET name = %s WHERE id_category = %s", (name, id_category))
			conn.commit()

def delete_category(id_category):
	"""
	Supprime la catégorie. Les utilisateurs qui l'avaient choisie repassent à
	id_category = NULL (pas de ON DELETE CASCADE sur users.id_category), ils
	verront à nouveau l'écran de sélection de catégorie sur leur profil.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("UPDATE users SET id_category = NULL WHERE id_category = %s", (id_category,))
			cur.execute("DELETE FROM categories WHERE id_category = %s", (id_category,))
			conn.commit()