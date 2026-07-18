from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg

from database import CONN_PARAMS


class User(UserMixin):
	"""Représente un utilisateur connecté, tel qu'attendu par Flask-Login."""
	def __init__(self, id, username, email):
		self.id = id
		self.username = username
		self.email = email


def get_user_by_id(user_id):
	"""
	Récupère un utilisateur à partir de son id. Utilisé par Flask-Login pour
	recharger l'utilisateur depuis le cookie de session à chaque requête.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT id, username, email FROM users WHERE id = %s", (user_id,))
			row = cur.fetchone()
			return User(*row) if row else None

def get_user_row_by_email(email):
	"""
	Récupère la ligne complète (avec le hash du mot de passe) à partir de l'email.
	Utilisé uniquement au moment du login, pour vérifier le mot de passe.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT id, username, email, password_hash FROM users WHERE email = %s", (email,),)
			return cur.fetchone()

def email_or_username_exists(email, username):
	"""Vérifie si un compte existe déjà avec cet email ou ce nom d'utilisateur."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username),)
			return cur.fetchone() is not None

def create_user(username, email, password):
	"""Crée un nouvel utilisateur, avec le mot de passe haché (jamais stocké en clair)."""
	password_hash = generate_password_hash(password)
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"INSERT INTO users (username, email, password_hash) "
				"VALUES (%s, %s, %s) RETURNING id",
				(username, email, password_hash),
			)
			conn.commit()
			return cur.fetchone()[0]

def verify_password(row, password):
	"""Compare un mot de passe en clair au hash stocké en base."""
	return check_password_hash(row[3], password)