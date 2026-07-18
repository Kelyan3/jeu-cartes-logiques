import os
import secrets

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from dotenv import dotenv_values

from database import get_database
from auth import *


config = dotenv_values(".env")

app = Flask(__name__, static_folder="./build")
app.secret_key = config.get("SECRET_KEY", secrets.token_hex(32))
CORS(app, origins="http://localhost:5173", supports_credentials=True)

login_manager = LoginManager(app)


@login_manager.user_loader
def load_user(user_id):
	return get_user_by_id(user_id)


@app.route("/test", methods=["GET"])
def test():
	return jsonify({"test": "test"})


@app.route("/getDatabase", methods=["GET"])
def get_database_server():
	return jsonify(get_database())


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


if __name__ == "__main__":
	app.run(host="0.0.0.0", port=80)