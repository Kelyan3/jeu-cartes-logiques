import os
import secrets
import logging

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from dotenv import load_dotenv

from auth import *
from progress import *

# Charge les variables définies dans le fichier .env
load_dotenv()

app = Flask(__name__, static_folder="./dist")

secret_key = os.getenv("SECRET_KEY")
if not secret_key:
	print(
		"ATTENTION! Aucune SECRET_KEY définie dans le fichier .env. "
		"Une clé temporaire sera utilisée et changera à chaque redémarrage "
		"du serveur, et par conséquent, tous les utilisateurs seront déconnectés. "
		"N'oubliez pas d'ajouter \"SECRET_KEY=<key>\" dans votre fichier .env."
	)
	secret_key = secrets.token_hex(32)

app.secret_key = secret_key

IS_PRODUCTION = os.environ.get("RENDER") is not None
app.config["SESSION_COOKIE_SAMESITE"] = "None" if IS_PRODUCTION else "Lax"
app.config["SESSION_COOKIE_SECURE"] = IS_PRODUCTION

frontend_url = os.environ.get("FRONTEND_URL", "").rstrip("/")
CORS(
	app,
	origins=[
		"http://localhost:5173",
		frontend_url,
	],
	supports_credentials=True,
)

login_manager = LoginManager(app)


@login_manager.user_loader
def load_user(user_id):
	return get_user_by_id(user_id)


@app.route("/api/register", methods=["POST"])
def register():
	data = request.get_json()
	username = data.get("username", "").strip()
	email = data.get("email", "").strip().lower()
	password = data.get("password", "")

	if not username or not email or not password:
		return jsonify({"error": "Tous les champs sont requis"}), 400
	if len(password) < 8:
		return jsonify({"error": "Le mot de passe doit faire au moins 8 caractères"}), 400
	if email_or_username_exists(email, username):
		return jsonify({"error": "Cet email ou ce nom d'utilisateur est déjà utilisé"}), 409

	user_id = create_user(username, email, password)
	user = User(user_id, username, email)
	login_user(user)

	return jsonify({"username": user.username, "email": user.email}), 201


@app.route("/api/login", methods=["POST"])
def login():
	data = request.get_json()
	email = data.get("email", "").strip().lower()
	password = data.get("password", "")

	row = get_user_row_by_email(email)
	if row and verify_password(row, password):
		user = User(row[0], row[1], row[2])
		login_user(user)
		return jsonify({"username": user.username, "email": user.email})

	return jsonify({"error": "Identifiants invalides"}), 401


@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
	logout_user()
	return jsonify({"ok": True})


@app.route("/api/me", methods=["GET"])
def me():
	if current_user.is_authenticated:
		return jsonify({"username": current_user.username, "email": current_user.email})
	return jsonify(None), 200


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def index(path):
	if path != "" and os.path.exists(app.static_folder + "/" + path):
		return send_from_directory(app.static_folder, path)
	return send_from_directory(app.static_folder, "index.html")


@app.route("/api/progress", methods=["GET"])
@login_required
def progress_get():
	return jsonify(get_progress(current_user.id))


@app.route("/api/progress", methods=["POST"])
@login_required
def progress_post():
	data = request.get_json()
	mode = data.get("mode")
	num = data.get("num")
	completed = data.get("completed", True)
	score = data.get("score", 0)

	if mode not in ("Play", "Tutorial") or not isinstance(num, int):
		return jsonify({"error": "Paramètres invalides"}), 400

	save_progress(current_user.id, mode, num, completed, score)
	return jsonify({"ok": True})


@app.route("/api/progress", methods=["DELETE"])
@login_required
def progress_delete():
	reset_progress(current_user.id)
	return jsonify({"ok": True})


@app.route("/api/leaderboard", methods=["GET"])
def leaderboard():
	return jsonify(get_leaderboard())


if __name__ == "__main__":
	app.run(host="0.0.0.0", port=80)