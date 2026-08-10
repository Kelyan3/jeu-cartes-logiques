import os
import re
import secrets
import logging

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException

from auth import *
from progress import *
from admin import *


# Logging pour les actions administratives.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# RegEx pour les emails.
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

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

def get_json_body():
	data = request.get_json(silent=True)
	return data if isinstance(data, dict) else {}


@app.errorhandler(HTTPException)
def handle_http_exception(error):
	return jsonify({"error": error.description}), error.code

@app.errorhandler(Exception)
def handle_unexpected_exception(error):
    logging.exception("Erreur interne non gérée")
    return jsonify({"error": "Erreur interne du serveur"}), 500


@app.route("/api/register", methods=["POST"])
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

	user_id = create_user(username, email, password)
	user = User(user_id, username, email)
	login_user(user)

	return jsonify({"username": user.username, "email": user.email, "role": user.role, "id_category": user.id_category}), 201


@app.route("/api/login", methods=["POST"])
def login():
	data = get_json_body()
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
	data = get_json_body()
	mode = data.get("mode")
	num = data.get("num")
	completed = data.get("completed", True)
	elapsed_seconds = data.get("elapsed_seconds")
	moves = data.get("moves")

	if mode not in ("Play", "Tutorial") or not isinstance(num, int):
		return jsonify({"error": "Paramètres invalides"}), 400
	if elapsed_seconds is not None and not isinstance(elapsed_seconds, int):
		return jsonify({"error": "elapsed_seconds doit être un entier"}), 400
	if moves is not None and not isinstance(moves, int):
		return jsonify({"error": "moves doit être un entier"}), 400

	save_progress(current_user.id, mode, num, completed, elapsed_seconds, moves)
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
	data = get_json_body()
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
@audit_log("create_chapter")
def admin_create_chapter():
	data = get_json_body()
	name = (data.get("name") or "").strip()
	position = data.get("position")

	if not name:
		return jsonify({"error": "name est requis"}), 400
	if position is not None and not isinstance(position, int):
		return jsonify({"error": "position doit être un entier si fournie"}), 400

	id_chapter = create_chapter(name, position)
	return jsonify({"id_chapter": id_chapter}), 201

@app.route("/api/admin/chapters/reorder", methods=["PUT"])
@admin_required
@audit_log("reorder_chapters")
def admin_reorder_chapters():
	data = request.get_json()
	ordered_ids = data.get("ordered_ids")

	if not isinstance(ordered_ids, list) or not all(isinstance(i, int) for i in ordered_ids):
		return jsonify({"error": "ordered_ids (liste d'entiers) est requis"}), 400

	reorder_chapters(ordered_ids)
	return jsonify({"ok": True})

@app.route("/api/admin/chapters/<int:id_chapter>", methods=["PUT"])
@admin_required
@audit_log("update_chapter")
def admin_update_chapter(id_chapter):
	data = get_json_body()
	update_chapter(id_chapter, name=data.get("name"), position=data.get("position"))
	return jsonify({"ok": True})


@app.route("/api/admin/chapters/<int:id_chapter>", methods=["DELETE"])
@admin_required
@audit_log("delete_chapter")
def admin_delete_chapter(id_chapter):
	delete_chapter(id_chapter)
	return jsonify({"ok": True})


@app.route("/api/admin/levels/unassigned", methods=["GET"])
@admin_required
def admin_unassigned_levels():
	return jsonify(list_unassigned_levels())


@app.route("/api/admin/levels", methods=["POST"])
@admin_required
@audit_log("assign_level")
def admin_assign_level():
	data = get_json_body()
	num = data.get("num")
	id_chapter = data.get("id_chapter")
	position = data.get("position")

	if not isinstance(num, int) or not isinstance(id_chapter, int):
		return jsonify({"error": "num et id_chapter (entiers) sont requis"}), 400
	if position is not None and not isinstance(position, int):
		return jsonify({"error": "position doit être un entier si fournie"}), 400

	try:
		id_level = assign_level(num, id_chapter, position)
	except Exception:
		return jsonify({"error": "Ce niveau est déjà rattaché à un chapitre, ou le chapitre n'existe pas"}), 400

	return jsonify({"id_level": id_level}), 201


@app.route("/api/admin/levels/<int:id_level>", methods=["PUT"])
@admin_required
@audit_log("update_level")
def admin_update_level(id_level):
	data = get_json_body()
	update_level(id_level, id_chapter=data.get("id_chapter"), position=data.get("position"))
	return jsonify({"ok": True})

@app.route("/api/admin/scoring", methods=["GET"])
@admin_required
def admin_get_global_scoring():
	return jsonify(get_global_scoring_params())


@app.route("/api/admin/scoring", methods=["PUT"])
@admin_required
@audit_log("update_global_scoring")
def admin_update_global_scoring():
	data = get_json_body()
	fields = {key: data.get(key) for key in (
		"score_max", "score_min", "time_grace_s", "time_interval_s", "time_penalty", "moves_threshold", "moves_rate"
	)}

	for key, value in fields.items():
		if value is None or not isinstance(value, int):
			return jsonify({"error": f"{key} doit être un entier"}), 400

	update_global_scoring(**fields)
	return jsonify({"ok": True})


@app.route("/api/admin/levels/reorder", methods=["PUT"])
@admin_required
@audit_log("reorder_levels")
def admin_reorder_levels():
	data = request.get_json()
	id_chapter = data.get("id_chapter")
	ordered_ids = data.get("ordered_ids")

	if not isinstance(id_chapter, int) or not isinstance(ordered_ids, list) or not all(isinstance(i, int) for i in ordered_ids):
		return jsonify({"error": "id_chapter et ordered_ids (liste d'entiers) sont requis"}), 400

	reorder_levels(id_chapter, ordered_ids)
	return jsonify({"ok": True})

@app.route("/api/admin/levels/<int:id_level>", methods=["DELETE"])
@admin_required
@audit_log("delete_level")
def admin_delete_level(id_level):
	delete_level(id_level)
	return jsonify({"ok": True})


@app.route("/api/admin/quests", methods=["GET"])
@admin_required
def admin_list_quests():
	return jsonify(list_quests_admin())


@app.route("/api/admin/quests", methods=["POST"])
@admin_required
@audit_log("create_quest")
def admin_create_quest():
	data = get_json_body()
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
@audit_log("update_quest")
def admin_update_quest(id_quest):
	data = get_json_body()
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
@audit_log("delete_quest")
def admin_delete_quest(id_quest):
	delete_quest(id_quest)
	return jsonify({"ok": True})


@app.route("/api/admin/categories", methods=["POST"])
@admin_required
@audit_log("create_category")
def admin_create_category():
	data = get_json_body()
	name = (data.get("name") or "").strip()
	if not name:
		return jsonify({"error": "name est requis"}), 400

	id_category = create_category(name)
	return jsonify({"id_category": id_category}), 201


@app.route("/api/admin/categories/<int:id_category>", methods=["PUT"])
@admin_required
@audit_log("update_category")
def admin_update_category(id_category):
	data = get_json_body()
	name = (data.get("name") or "").strip()
	if not name:
		return jsonify({"error": "name est requis"}), 400

	update_category(id_category, name)
	return jsonify({"ok": True})


@app.route("/api/admin/categories/<int:id_category>", methods=["DELETE"])
@admin_required
@audit_log("delete_category")
def admin_delete_category(id_category):
	delete_category(id_category)
	return jsonify({"ok": True})


if __name__ == "__main__":
	app.run(host="0.0.0.0", port=80)