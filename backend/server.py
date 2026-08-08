import os
import secrets
import logging

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from dotenv import load_dotenv

from auth import *
from progress import *
from admin import *

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

cors_origins = ["http://localhost:5173"]
frontend_url = os.environ.get("FRONTEND_URL", "").rstrip("/")
if frontend_url:
	cors_origins.append(frontend_url)

CORS(app, origins=cors_origins, supports_credentials=True)

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

	return jsonify({"username": user.username, "email": user.email, "role": user.role, "id_category": user.id_category}), 201


@app.route("/api/login", methods=["POST"])
def login():
	data = request.get_json()
	email = data.get("email", "").strip().lower()
	password = data.get("password", "")

	row = get_user_row_by_email(email)
	if row and verify_password(row, password):
		user = User(row[0], row[1], row[2], row[4], row[5])
		login_user(user)
		return jsonify({"username": user.username, "email": user.email, "role": user.role, "id_category": user.id_category})

	return jsonify({"error": "Identifiants invalides"}), 401


@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
	logout_user()
	return jsonify({"ok": True})


@app.route("/api/me", methods=["GET"])
def me():
	if current_user.is_authenticated:
		return jsonify({
			"username": current_user.username,
			"email": current_user.email,
			"role": current_user.role,
			"id_category": current_user.id_category,
		})
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


@app.route("/api/chapters", methods=["GET"])
def chapters():
	user_id = current_user.id if current_user.is_authenticated else None
	return jsonify(get_chapters(user_id))


@app.route("/api/quests", methods=["GET"])
def quests():
	user_id = current_user.id if current_user.is_authenticated else None
	return jsonify(get_unlocked_keys(user_id))


@app.route("/api/categories", methods=["GET"])
def categories():
	return jsonify(get_categories())


@app.route("/api/profile/category", methods=["POST"])
@login_required
def profile_category():
	data = request.get_json()
	id_category = data.get("id_category")

	if not isinstance(id_category, int):
		return jsonify({"error": "id_category invalide"}), 400

	try:
		set_user_category(current_user.id, id_category)
	except Exception:
		return jsonify({"error": "Catégorie inconnue"}), 400

	return jsonify({"ok": True})


@app.route("/api/leaderboard", methods=["GET"])
def leaderboard():
	id_category = request.args.get("category", type=int)
	return jsonify(get_leaderboard(id_category))


@app.route("/api/admin/chapters", methods=["POST"])
@admin_required
def admin_create_chapter():
	data = request.get_json()
	name = (data.get("name") or "").strip()
	position = data.get("position")

	if not name or not isinstance(position, int):
		return jsonify({"error": "name et position (entier) sont requis"}), 400

	id_chapter = create_chapter(name, position)
	return jsonify({"id_chapter": id_chapter}), 201


@app.route("/api/admin/chapters/<int:id_chapter>", methods=["PUT"])
@admin_required
def admin_update_chapter(id_chapter):
	data = request.get_json()
	update_chapter(id_chapter, name=data.get("name"), position=data.get("position"))
	return jsonify({"ok": True})


@app.route("/api/admin/chapters/<int:id_chapter>", methods=["DELETE"])
@admin_required
def admin_delete_chapter(id_chapter):
	delete_chapter(id_chapter)
	return jsonify({"ok": True})


@app.route("/api/admin/levels/unassigned", methods=["GET"])
@admin_required
def admin_unassigned_levels():
	return jsonify(list_unassigned_levels())


@app.route("/api/admin/levels", methods=["POST"])
@admin_required
def admin_assign_level():
	data = request.get_json()
	num = data.get("num")
	id_chapter = data.get("id_chapter")
	position = data.get("position")

	if not isinstance(num, int) or not isinstance(id_chapter, int) or not isinstance(position, int):
		return jsonify({"error": "num, id_chapter et position (entiers) sont requis"}), 400

	try:
		id_level = assign_level(num, id_chapter, position)
	except Exception:
		return jsonify({"error": "Ce niveau est déjà rattaché à un chapitre, ou le chapitre n'existe pas"}), 400

	return jsonify({"id_level": id_level}), 201


@app.route("/api/admin/levels/<int:id_level>", methods=["PUT"])
@admin_required
def admin_update_level(id_level):
	data = request.get_json()
	update_level(id_level, id_chapter=data.get("id_chapter"), position=data.get("position"))
	return jsonify({"ok": True})


@app.route("/api/admin/levels/<int:id_level>", methods=["DELETE"])
@admin_required
def admin_delete_level(id_level):
	delete_level(id_level)
	return jsonify({"ok": True})


@app.route("/api/admin/quests", methods=["GET"])
@admin_required
def admin_list_quests():
	return jsonify(list_quests_admin())


@app.route("/api/admin/quests", methods=["POST"])
@admin_required
def admin_create_quest():
	data = request.get_json()
	menu = (data.get("menu") or "").strip()
	label = (data.get("label") or "").strip()
	unlocks_key = (data.get("unlocks_key") or "").strip()
	required_chapter = data.get("required_chapter")  # peut être None (= toujours débloquée)
	position = data.get("position")

	if not menu or not label or not unlocks_key or not isinstance(position, int):
		return jsonify({"error": "menu, label, unlocks_key et position (entier) sont requis"}), 400

	id_quest = create_quest(menu, label, unlocks_key, required_chapter, position)
	return jsonify({"id_quest": id_quest}), 201


@app.route("/api/admin/quests/<int:id_quest>", methods=["PUT"])
@admin_required
def admin_update_quest(id_quest):
	data = request.get_json()
	update_quest(
		id_quest,
		menu=data.get("menu"),
		label=data.get("label"),
		unlocks_key=data.get("unlocks_key"),
		required_chapter=data.get("required_chapter", "__unset__"),
		position=data.get("position"),
	)
	return jsonify({"ok": True})


@app.route("/api/admin/quests/<int:id_quest>", methods=["DELETE"])
@admin_required
def admin_delete_quest(id_quest):
	delete_quest(id_quest)
	return jsonify({"ok": True})


@app.route("/api/admin/categories", methods=["POST"])
@admin_required
def admin_create_category():
	data = request.get_json()
	name = (data.get("name") or "").strip()
	if not name:
		return jsonify({"error": "name est requis"}), 400

	id_category = create_category(name)
	return jsonify({"id_category": id_category}), 201


@app.route("/api/admin/categories/<int:id_category>", methods=["PUT"])
@admin_required
def admin_update_category(id_category):
	data = request.get_json()
	name = (data.get("name") or "").strip()
	if not name:
		return jsonify({"error": "name est requis"}), 400

	update_category(id_category, name)
	return jsonify({"ok": True})


@app.route("/api/admin/categories/<int:id_category>", methods=["DELETE"])
@admin_required
def admin_delete_category(id_category):
	delete_category(id_category)
	return jsonify({"ok": True})


if __name__ == "__main__":
	app.run(host="0.0.0.0", port=80)