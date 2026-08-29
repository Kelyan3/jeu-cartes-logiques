import psycopg

from app.database import CONN_PARAMS
from app.services.admin_service import get_global_scoring_params


def get_progress(id_user):
	"""
	Récupère toute la progression d'un utilisateur.
	Renvoie une liste de dicts : [{"mode": "Play", "num": 3, "completed": True, "score": 10}, ...]
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"SELECT mode, num, completed, score FROM progression "
				"WHERE id_user = %s",
				(id_user,),
			)
			rows = cur.fetchall()

			return [
				{"mode": mode, "num": num, "completed": completed, "score": score}
				for mode, num, completed, score in rows
			]

def _is_level_unlocked(id_user, num):
	"""
	True si le niveau num (mode "Play") est débloqué pour id_user, False sinon (y compris
	si le niveau n'existe pas).
	"""
	for chapter in get_chapters(id_user):
		for level in chapter["levels"]:
			if level["num"] == num:
				return level["unlocked"]
	return False

def save_progress(id_user, mode, num, completed, elapsed_seconds=None, moves=None):
	"""
	Enregistre ou met à jour la progression d'un utilisateur sur un niveau.
	Si une ligne existe déjà pour (id_user, mode, num), elle est mise à jour
	uniquement si le nouveau score est meilleur (ou si le niveau vient d'être complété).

	Le score n'est calculé que pour le mode "Play" complété, à partir du temps
	écoulé et du nombre de coups fournis par le client, combinés aux paramètres
	de score globaux (voir compute_score() dans ce fichier et get_global_scoring_params()
	dans admin_service.py). Le mode "Tutorial" n'a pas de notion de score : il reste
	toujours à 0, comme avant.

	Si ce niveau complète entièrement son chapitre (mode "Play"), les quêtes
	rattachées à ce chapitre sont automatiquement débloquées pour l'utilisateur.

	En mode "Play", un niveau non encore débloqué
	ne peut pas être marqué complété ni recevoir de score, même si le client
	envoie completed=True
	"""
	# Valider le droit de compléter (avant tout calcul de score).
	if mode == "Play" and completed and not _is_level_unlocked(id_user, num):
		completed = False

	# Calculer le score uniquement si la complétion est acceptée.
	score = 0
	best_time_seconds = None
	if mode == "Play" and completed and elapsed_seconds is not None and moves is not None:
		score = compute_score(elapsed_seconds, moves, get_global_scoring_params())
		best_time_seconds = elapsed_seconds

	# Persister puis éventuellement débloquer les quêtes du chapitre.
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				INSERT INTO progression (id_user, mode, num, completed, score, best_time_seconds)
				VALUES (%s, %s, %s, %s, %s, %s)
				ON CONFLICT (id_user, mode, num)
				DO UPDATE SET
					completed = progression.completed OR EXCLUDED.completed,
					score = GREATEST(progression.score, EXCLUDED.score),
					best_time_seconds = LEAST(
						COALESCE(progression.best_time_seconds, EXCLUDED.best_time_seconds),
						COALESCE(EXCLUDED.best_time_seconds, progression.best_time_seconds)
					),
					updated_at = NOW()
				""",
				(id_user, mode, num, completed, score, best_time_seconds),
			)

			if mode == "Play" and completed:
				_unlock_quests_if_chapter_completed(cur, id_user, num)

			conn.commit()

	return score

def _unlock_quests_if_chapter_completed(cur, id_user, num):
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
		(id_chapter, id_user),
	)
	remaining = cur.fetchone()[0]
	if remaining > 0:
		return  # chapitre pas encore terminé

	cur.execute("SELECT id_quest FROM quests WHERE required_chapter = %s", (id_chapter,))
	quest_ids = [row[0] for row in cur.fetchall()]
	for id_quest in quest_ids:
		cur.execute(
			"INSERT INTO user_quests (id_user, id_quest) VALUES (%s, %s) ON CONFLICT DO NOTHING",
			(id_user, id_quest),
		)

def reset_progress(id_user):
	"""Supprime toute la progression d'un utilisateur."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("DELETE FROM progression WHERE id_user = %s", (id_user,))
			cur.execute("DELETE FROM user_quests WHERE id_user = %s", (id_user,))
			conn.commit()

def compute_score(elapsed_seconds, moves, params):
	temps_excedent = max(0, elapsed_seconds - params["time_grace_s"])
	penalite_temps = (temps_excedent // params["time_interval_s"]) * params["time_penalty"]

	coups_excedent = max(0, moves - params["moves_threshold"])
	penalite_coups = coups_excedent * params["moves_rate"]

	score = params["score_max"] - penalite_temps - penalite_coups
	return max(params["score_min"], score)

def get_chapters(id_user):
	"""
	Récupère les chapitres "Play" et leurs niveaux, avec le statut de chacun pour
	l'utilisateur donné (id_user=None pour un visiteur non connecté).

	Règle de déblocage : le premier niveau du premier chapitre est toujours
	débloqué ; un niveau est débloqué seulement si le niveau qui le précède
	(dans l'ordre chapitre -> position) a été complété.

	Renvoie : [{"id_chapter", "name", "position", "unlocked", "levels": [{"num", "position", "unlocked",
	"completed", "score", "best_time_seconds"}, ...]}, ...] ("score"/"best_time_seconds" valent None
	tant que le niveau n'est pas complété.)
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT id_chapter, name, position FROM chapters ORDER BY position")
			chapters_rows = cur.fetchall()

			cur.execute(
				"""
				SELECT id_level, id_chapter, num, position
				FROM levels ORDER BY id_chapter, position
				"""
			)
			levels_rows = cur.fetchall()

			progress_by_num = {}
			if id_user is not None:
				cur.execute(
					"SELECT num, score, best_time_seconds FROM progression "
					"WHERE id_user = %s AND mode = 'Play' AND completed = TRUE",
					(id_user,),
				)
				progress_by_num = {
					num: {"score": score, "best_time_seconds": best_time_seconds}
					for num, score, best_time_seconds in cur.fetchall()
				}

	levels_by_chapter = {}
	for id_level, id_chapter, num, position in levels_rows:
		levels_by_chapter.setdefault(id_chapter, []).append(
			{
				"id_level": id_level,
				"num": num,
				"position": position,
			}
		)

	chapters = []
	previous_completed = True  # le tout premier niveau du tout premier chapitre est toujours débloqué
	for id_chapter, name, position in chapters_rows:
		levels = sorted(levels_by_chapter.get(id_chapter, []), key=lambda level: level["position"])
		for level in levels:
			level["unlocked"] = previous_completed
			progress = progress_by_num.get(level["num"])
			level["completed"] = progress is not None
			level["score"] = progress["score"] if progress else None
			level["best_time_seconds"] = progress["best_time_seconds"] if progress else None
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

def get_unlocked_keys(id_user):
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
				(id_user,),
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
	Récupère, pour chaque utilisateur, son nombre de niveaux "Play" complétés
	et la somme de ses scores sur ces niveaux. Les tutoriels ne sont pas
	comptabilisés (cohérent avec la page Profil).

	Le classement reste trié par nombre de niveaux complétés (inchangé) ;
	le score cumulé est une colonne d'information supplémentaire, pas un
	second critère de tri.

	id_category=None -> tous les utilisateurs, sans filtre.
	"""
	query = """
		SELECT u.username, COUNT(p.id_progress) AS completed, COALESCE(SUM(p.score), 0) AS total_score
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
				{"username": username, "completed": completed, "score": total_score}
				for username, completed, total_score in rows
			]