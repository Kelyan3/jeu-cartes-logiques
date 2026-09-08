from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg

from app.database import CONN_PARAMS


class User(UserMixin):
	"""Représente un utilisateur connecté, tel qu'attendu par Flask-Login."""
	def __init__(self, id, username, email, role="user", id_category=None, created_at=None):
		self.id = id
		self.username = username
		self.email = email
		self.role = role
		self.id_category = id_category
		self.created_at = created_at

	@property
	def is_admin(self):
		return self.role == "admin"


def get_user_by_id(id_user):
	"""
	Récupère un utilisateur à partir de son id. Utilisé par Flask-Login pour
	recharger l'utilisateur depuis le cookie de session à chaque requête.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"SELECT id_user, username, email, role, id_category, created_at FROM users WHERE id_user = %s",
				(id_user,),
			)
			row = cur.fetchone()
			return User(*row) if row else None

def get_user_row_by_username_and_email(username, email):
	"""
	Récupère la ligne complète (avec le hash du mot de passe) uniquement si le
	nom d'utilisateur ET l'email correspondent à un même compte.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"SELECT id_user, username, email, password_hash, role, id_category, created_at FROM users WHERE LOWER(username) = LOWER(%s) AND LOWER(email) = LOWER(%s)",
				(username, email),
			)
			return cur.fetchone()

def email_or_username_exists(email, username):
	"""Vérifie si un compte existe déjà avec cet email ou ce nom d'utilisateur."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT id_user FROM users WHERE email = %s OR username = %s", (email, username),)
			return cur.fetchone() is not None

def create_user(username, email, password):
	"""Crée un nouvel utilisateur, avec le mot de passe haché (jamais stocké en clair)."""
	password_hash = generate_password_hash(password)
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"INSERT INTO users (username, email, password_hash) "
				"VALUES (%s, %s, %s) RETURNING id_user, created_at",
				(username, email, password_hash),
			)
			conn.commit()
			return cur.fetchone()

def verify_password(row, password):
	"""Compare un mot de passe en clair au hash stocké en base."""
	return check_password_hash(row[3], password)

def get_categories():
	"""Liste toutes les catégories disponibles (ex: Professeur, Étudiant L1...)."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT id_category, name FROM categories ORDER BY id_category")
			return [{"id_category": id_category, "name": name} for id_category, name in cur.fetchall()]

def set_user_category(id_user, id_category):
	"""
	Assigne une catégorie à l'utilisateur (choisie une fois l'inscription terminée).
	Ne vérifie pas que id_category existe : la contrainte REFERENCES de la table
	users s'en charge et fait échouer la requête si l'id est invalide.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"UPDATE users SET id_category = %s WHERE id_user = %s",
				(id_category, id_user),
			)
			conn.commit()

def get_public_profile_by_username(username):
	"""
	Récupère les informations publiques d'un utilisateur et ses statistiques globales
	pour la consultation de son profil.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"""
				SELECT u.id_user, u.username, u.id_category, c.name, u.created_at,
				       COALESCE(SUM(CASE WHEN p.mode = 'Play' AND p.completed = TRUE THEN 1 ELSE 0 END), 0) AS completed,
				       COALESCE(SUM(CASE WHEN p.mode = 'Play' AND p.completed = TRUE THEN p.score ELSE 0 END), 0) AS score
				FROM users u
				LEFT JOIN categories c ON c.id_category = u.id_category
				LEFT JOIN progression p ON p.id_user = u.id_user
				WHERE LOWER(u.username) = LOWER(%s)
				GROUP BY u.id_user, u.username, u.id_category, c.name, u.created_at
				""",
				(username,),
			)
			row = cur.fetchone()
			if not row:
				return None
			return {
				"id_user": row[0],
				"username": row[1],
				"id_category": row[2],
				"category_name": row[3],
				"created_at": row[4].isoformat() if row[4] else None,
				"completed": int(row[5]),
				"score": int(row[6]),
			}