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
				"SELECT mode, num, completed, score FROM user_progress "
				"WHERE user_id = %s",
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
				INSERT INTO user_progress (user_id, mode, num, completed, score)
				VALUES (%s, %s, %s, %s, %s)
				ON CONFLICT (user_id, mode, num)
				DO UPDATE SET
					completed = user_progress.completed OR EXCLUDED.completed,
					score = GREATEST(user_progress.score, EXCLUDED.score),
					updated_at = NOW()
				""",
				(user_id, mode, num, completed, score),
			)
			conn.commit()

def reset_progress(user_id):
	"""Supprime toute la progression d'un utilisateur."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("DELETE FROM user_progress WHERE user_id = %s", (user_id,),)
			conn.commit()