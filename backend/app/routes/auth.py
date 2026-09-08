import re
import psycopg

from flask import Blueprint, jsonify
from flask_login import login_user, logout_user, login_required, current_user

from app.services.auth_service import (
	User,
	email_or_username_exists,
	create_user,
	get_user_row_by_username_and_email,
	verify_password,
	get_categories,
	set_user_category,
	get_public_profile_by_username,
)

from app.utils.helpers import get_json_body


auth_bp = Blueprint("auth", __name__, url_prefix="/api")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@auth_bp.route("/register", methods=["POST"])
def register():
	data = get_json_body()
	username = data.get("username", "").strip()
	email = data.get("email", "").strip().lower()
	password = data.get("password", "")

	if not username or not email or not password:
		return jsonify({"error": "Tous les champs sont requis"}), 400
	if not EMAIL_RE.match(email):
		return jsonify({"error": "Format d'email invalide"}), 400
	if len(password) < 8:
		return jsonify({"error": "Le mot de passe doit faire au moins 8 caractères"}), 400
	if email_or_username_exists(email, username):
		return jsonify({"error": "Cet email ou ce nom d'utilisateur est déjà utilisé"}), 409

	id_user, created_at = create_user(username, email, password)
	user = User(id_user, username, email, role="user", id_category=None, created_at=created_at)
	login_user(user)

	return jsonify({
		"username": user.username,
		"email": user.email,
		"role": user.role,
		"id_category": user.id_category,
		"created_at": user.created_at.isoformat() if user.created_at else None,
	}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
	data = get_json_body()
	username = (data.get("username") or "").strip()
	email = (data.get("email") or "").strip().lower()
	password = data.get("password", "")

	if not username or not email or not password:
		return jsonify({"error": "Nom d'utilisateur, email et mot de passe sont requis"}), 400

	row = get_user_row_by_username_and_email(username, email)
	if row and verify_password(row, password):
		user = User(row[0], row[1], row[2], row[4], row[5], row[6])
		login_user(user)
		return jsonify({
			"username": user.username,
			"email": user.email,
			"role": user.role,
			"id_category": user.id_category,
			"created_at": user.created_at.isoformat() if user.created_at else None,
		})

	return jsonify({"error": "Identifiants invalides"}), 401


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
	logout_user()
	return jsonify({"ok": True})


@auth_bp.route("/me", methods=["GET"])
def me():
	if current_user.is_authenticated:
		return jsonify({
			"username": current_user.username,
			"email": current_user.email,
			"role": current_user.role,
			"id_category": current_user.id_category,
			"created_at": current_user.created_at.isoformat() if getattr(current_user, "created_at", None) else None,
		})
	return jsonify(None), 200


@auth_bp.route("/users/<username>", methods=["GET"])
def get_user_profile(username):
	profile = get_public_profile_by_username(username)
	if not profile:
		return jsonify({"error": "Utilisateur introuvable"}), 404
	return jsonify(profile)


@auth_bp.route("/categories", methods=["GET"])
def categories():
	return jsonify(get_categories())


@auth_bp.route("/profile/category", methods=["POST"])
@login_required
def profile_category():
	data = get_json_body()
	id_category = data.get("id_category")

	if not isinstance(id_category, int):
		return jsonify({"error": "id_category invalide"}), 400

	try:
		set_user_category(current_user.id, id_category)
	except psycopg.IntegrityError:
		return jsonify({"error": "Catégorie inconnue"}), 400

	return jsonify({"ok": True})