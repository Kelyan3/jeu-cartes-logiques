import psycopg

from database import CONN_PARAMS


def get_progress(user_id):
	"""
	Récupère toute la progression d'un utilisateur.
	Renvoie une liste de dicts : [{"mode": "Play", "num": 3, "completed": True, "score": 10}, ...]
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"SELECT mode, num, completed, score FROM progression "
				"WHERE id_user = %s",
				(user_id,),
			)
			rows = cur.fetchall()

			return [
				{"mode": mode, "num": num, "completed": completed, "score": score}
				for mode, num, completed, score in rows
			]

def save_progress(user_id, mode, num, completed, score=0):
	"""
	Enregistre ou met à jour la progression d'un utilisateur sur un niveau.
	Si une ligne existe déjà pour (user_id, mode, num), elle est mise à jour
	uniquement si le nouveau score est meilleur (ou si le niveau vient d'être complété).

	Si ce niveau complète entièrement son chapitre (mode "Play"), les quêtes
	rattachées à ce chapitre sont automatiquement débloquées pour l'utilisateur.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				INSERT INTO progression (id_user, mode, num, completed, score)
				VALUES (%s, %s, %s, %s, %s)
				ON CONFLICT (id_user, mode, num)
				DO UPDATE SET
					completed = progression.completed OR EXCLUDED.completed,
					score = GREATEST(progression.score, EXCLUDED.score),
					updated_at = NOW()
				""",
				(user_id, mode, num, completed, score),
			)

			if mode == "Play" and completed:
				_unlock_quests_if_chapter_completed(cur, user_id, num)

			conn.commit()

def _unlock_quests_if_chapter_completed(cur, user_id, num):
	"""
	Si le niveau "num" appartient à un chapitre désormais entièrement complété
	par l'utilisateur, insère une ligne user_quests pour chaque quête qui
	requiert ce chapitre (ON CONFLICT DO NOTHING : sans effet si déjà débloquée).
	Doit être appelée à l'intérieur de la même transaction que l'UPSERT de
	progression ci-dessus (le curseur "cur" est partagé, pas de commit ici).
	"""
	cur.execute("SELECT id_chapter FROM levels WHERE num = %s", (num,))
	row = cur.fetchone()
	if row is None:
		return  # niveau pas encore rattaché à un chapitre (ex: seed pas encore lancé)
	id_chapter = row[0]

	cur.execute(
		"""
		SELECT COUNT(*) FROM levels l
		WHERE l.id_chapter = %s
		AND l.num NOT IN (
			SELECT num FROM progression
			WHERE id_user = %s AND mode = 'Play' AND completed = TRUE
		)
		""",
		(id_chapter, user_id),
	)
	remaining = cur.fetchone()[0]
	if remaining > 0:
		return  # chapitre pas encore terminé

	cur.execute("SELECT id_quest FROM quests WHERE required_chapter = %s", (id_chapter,))
	quest_ids = [row[0] for row in cur.fetchall()]
	for id_quest in quest_ids:
		cur.execute(
			"INSERT INTO user_quests (id_user, id_quest) VALUES (%s, %s) ON CONFLICT DO NOTHING",
			(user_id, id_quest),
		)

def reset_progress(user_id):
	"""Supprime toute la progression d'un utilisateur."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("DELETE FROM progression WHERE id_user = %s", (user_id,),)
			conn.commit()

def get_chapters(user_id):
	"""
	Récupère les chapitres "Play" et leurs niveaux, avec le statut de chacun pour
	l'utilisateur donné (user_id=None pour un visiteur non connecté).

	Règle de déblocage : le premier niveau du premier chapitre est toujours
	débloqué ; un niveau est débloqué seulement si le niveau qui le précède
	(dans l'ordre chapitre -> position) a été complété.

	Renvoie : [{"id_chapter", "name", "position", "unlocked",
	            "levels": [{"num", "position", "unlocked", "completed"}, ...]}, ...]
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT id_chapter, name, position FROM chapters ORDER BY position")
			chapters_rows = cur.fetchall()

			cur.execute("SELECT id_level, id_chapter, num, position FROM levels ORDER BY id_chapter, position")
			levels_rows = cur.fetchall()

			completed_nums = set()
			if user_id is not None:
				cur.execute(
					"SELECT num FROM progression WHERE id_user = %s AND mode = 'Play' AND completed = TRUE",
					(user_id,),
				)
				completed_nums = {row[0] for row in cur.fetchall()}

	levels_by_chapter = {}
	for id_level, id_chapter, num, position in levels_rows:
		levels_by_chapter.setdefault(id_chapter, []).append(
			{"id_level": id_level, "num": num, "position": position}
		)

	chapters = []
	previous_completed = True  # le tout premier niveau du tout premier chapitre est toujours débloqué
	for id_chapter, name, position in chapters_rows:
		levels = sorted(levels_by_chapter.get(id_chapter, []), key=lambda level: level["position"])
		for level in levels:
			level["unlocked"] = previous_completed
			level["completed"] = level["num"] in completed_nums
			previous_completed = level["unlocked"] and level["completed"]

		chapters.append(
			{
				"id_chapter": id_chapter,
				"name": name,
				"position": position,
				"unlocked": levels[0]["unlocked"] if levels else False,
				"levels": levels,
			}
		)

	return chapters

def get_unlocked_keys(user_id):
	"""
	Récupère, pour l'utilisateur donné (None pour un visiteur), la liste des
	"unlocks_key" débloquées, regroupées par menu.

	Une quête est débloquée si required_chapter est NULL (toujours débloquée,
	ex: menu "base"), ou si l'utilisateur a une ligne dans user_quests pour
	cette quête.

	Renvoie : {"base": ["addAnd", "addImplique", "fuseAnd"], "objectif": [...], ...}
	(un menu sans aucune clé débloquée est absent du dict -> le frontend le cache.)
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				SELECT q.menu, q.unlocks_key,
					(q.required_chapter IS NULL OR uq.id_quest IS NOT NULL) AS unlocked
				FROM quests q
				LEFT JOIN user_quests uq
					ON uq.id_quest = q.id_quest AND uq.id_user = %s
				ORDER BY q.menu, q.position
				""",
				(user_id,),
			)
			rows = cur.fetchall()

	unlocked_by_menu = {}
	for menu, unlocks_key, unlocked in rows:
		if not unlocked:
			continue
		unlocked_by_menu.setdefault(menu, [])
		if unlocks_key not in unlocked_by_menu[menu]:
			unlocked_by_menu[menu].append(unlocks_key)

	return unlocked_by_menu

def get_leaderboard(id_category=None):
	"""
	Récupère, pour chaque utilisateur, son nombre de niveaux "Play" complétés.
	Les tutoriels ne sont pas comptabilisés (cohérent avec la page Profil).

	id_category=None -> tous les utilisateurs, sans filtre.
	"""
	query = """
		SELECT u.username, COUNT(p.id_progress) AS completed
		FROM users u
		LEFT JOIN progression p ON p.id_user = u.id_user
		AND p.mode = 'Play'
		AND p.completed = TRUE
	"""
	params = ()
	if id_category is not None:
		query += " WHERE u.id_category = %s"
		params = (id_category,)
	query += " GROUP BY u.username ORDER BY completed DESC, u.username ASC"

	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(query, params)
			rows = cur.fetchall()
			return [
				{"username": username, "completed": completed}
				for username, completed in rows
			]