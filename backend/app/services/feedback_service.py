import psycopg

from app.database import CONN_PARAMS


VALID_DEVICES = ("ordinateur", "mobile", "autre")

RATING_FIELDS = ("rules_rating", "features_rating", "design_rating")


def create_feedback(
	id_user,
	device, device_other,
	rules_rating, rules_comment,
	features_rating, features_comment,
	design_rating, design_comment,
	remarks,
):
	"""
	Enregistre un avis.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"INSERT INTO feedback ("
				"id_user, device, device_other, "
				"rules_rating, rules_comment, "
				"features_rating, features_comment, "
				"design_rating, design_comment, "
				"remarks"
				") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
				(
					id_user,
					device, device_other,
					rules_rating, rules_comment,
					features_rating, features_comment,
					design_rating, design_comment,
					remarks,
				),
			)
			conn.commit()


def get_feedback_list():
	"""Liste tous les avis pour l'admin, du plus récent au plus ancien."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"SELECT f.id_feedback, f.device, f.device_other, "
				"f.rules_rating, f.rules_comment, "
				"f.features_rating, f.features_comment, "
				"f.design_rating, f.design_comment, "
				"f.remarks, f.created_at, u.username "
				"FROM feedback f "
				"LEFT JOIN users u ON u.id_user = f.id_user "
				"ORDER BY f.created_at DESC"
			)
			rows = cur.fetchall()

			return [
				{
					"id_feedback": id_feedback,
					"device": device,
					"device_other": device_other,
					"rules_rating": rules_rating,
					"rules_comment": rules_comment,
					"features_rating": features_rating,
					"features_comment": features_comment,
					"design_rating": design_rating,
					"design_comment": design_comment,
					"remarks": remarks,
					"created_at": created_at.isoformat(),
					"username": username,
				}
				for (
					id_feedback,
					device, device_other,
					rules_rating, rules_comment,
					features_rating, features_comment,
					design_rating, design_comment,
					remarks, created_at, username,
				) in rows
			]


def delete_feedback(id_feedback):
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("DELETE FROM feedback WHERE id_feedback = %s", (id_feedback,))
			conn.commit()