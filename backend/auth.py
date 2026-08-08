from functools import wraps

from flask import jsonify
from flask_login import UserMixin, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg

from database import CONN_PARAMS


class User(UserMixin):
	"""Représente un utilisateur connecté, tel qu'attendu par Flask-Login."""
	def __init__(self, id, username, email, role="user", id_category=None):
		self.id = id
		self.username = username
		self.email = email
		self.role = role
		self.id_category = id_category

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
				"SELECT id_user, username, email, role, id_category FROM users WHERE id_user = %s",
				(id_user,),
			)
			row = cur.fetchone()
			return User(*row) if row else None

def get_user_row_by_email(email):
	"""
	Récupère la ligne complète (avec le hash du mot de passe) à partir de l'email.
	Utilisé uniquement au moment du login, pour vérifier le mot de passe.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"SELECT id_user, username, email, password_hash, role, id_category FROM users WHERE email = %s",
				(email,),
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
				"VALUES (%s, %s, %s) RETURNING id_user",
				(username, email, password_hash),
			)
			conn.commit()
			return cur.fetchone()[0]

def verify_password(row, password):
	"""Compare un mot de passe en clair au hash stocké en base."""
	return check_password_hash(row[3], password)

def get_categories():
	"""Liste toutes les catégories disponibles (ex: Professeur, Étudiant L1...)."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT id_category, name FROM categories ORDER BY id_category")
			return [{"id_category": id_category, "name": name} for id_category, name in cur.fetchall()]

def set_user_category(user_id, id_category):
	"""
	Assigne une catégorie à l'utilisateur (choisie une fois l'inscription terminée).
	Ne vérifie pas que id_category existe : la contrainte REFERENCES de la table
	users s'en charge et fait échouer la requête si l'id est invalide.
	"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute(
				"UPDATE users SET id_category = %s WHERE id_user = %s",
				(id_category, user_id),
			)
			conn.commit()

def admin_required(view):
	"""
	Décorateur de route : renvoie 403 si l'utilisateur connecté n'est pas admin
	(401 s'il n'est pas connecté du tout). À poser sur les futures routes du
	menu admin (chantier 4).
	"""
	@wraps(view)
	def wrapped(*args, **kwargs):
		if not current_user.is_authenticated:
			return jsonify({"error": "Authentification requise"}), 401
		if not current_user.is_admin:
			return jsonify({"error": "Réservé aux administrateurs"}), 403
		return view(*args, **kwargs)

	return wrapped