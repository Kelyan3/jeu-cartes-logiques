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
			conn.commit()

def reset_progress(user_id):
	"""Supprime toute la progression d'un utilisateur."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("DELETE FROM progression WHERE id_user = %s", (user_id,),)
			conn.commit()

def get_leaderboard():
	"""
	Récupère, pour chaque utilisateur, son nombre de niveaux "Play" complétés.
	Les tutoriels ne sont pas comptabilisés (cohérent avec la page Profil).
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				SELECT u.username, COUNT(p.id_progress) AS completed
	   			FROM users u
				LEFT JOIN progression p ON p.id_user = u.id_user
				AND p.mode = 'Play'
				AND p.completed = TRUE
				GROUP BY u.username
				ORDER BY completed DESC, u.username ASC
	  			"""
			)
			rows = cur.fetchall()
			return [
				{"username": username, "completed": completed}
				for username, completed in rows
			]