from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.services.progress_service import (
	get_progress,
	save_progress,
	reset_progress,
	get_chapters,
	get_unlocked_keys,
	get_leaderboard,
)
from app.utils.helpers import get_json_body

progress_bp = Blueprint("progress", __name__, url_prefix="/api")


@progress_bp.route("/progress", methods=["GET"])
@login_required
def progress_get():
	return jsonify(get_progress(current_user.id))


@progress_bp.route("/progress", methods=["POST"])
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


@progress_bp.route("/progress", methods=["DELETE"])
@login_required
def progress_delete():
	reset_progress(current_user.id)
	return jsonify({"ok": True})


@progress_bp.route("/chapters", methods=["GET"])
def chapters():
	id_user = current_user.id if current_user.is_authenticated else None
	return jsonify(get_chapters(id_user))


@progress_bp.route("/quests", methods=["GET"])
def quests():
	id_user = current_user.id if current_user.is_authenticated else None
	return jsonify(get_unlocked_keys(id_user))


@progress_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
	id_category = request.args.get("category", type=int)
	return jsonify(get_leaderboard(id_category))