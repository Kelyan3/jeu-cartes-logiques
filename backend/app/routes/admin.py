import psycopg

from flask import Blueprint, jsonify

from app.services.admin_service import (
	create_chapter,
	update_chapter,
	delete_chapter,
	reorder_chapters,
	list_unassigned_levels,
	assign_level,
	update_level,
	get_global_scoring_params,
	update_global_scoring,
	reorder_levels,
	delete_level,
	list_quests_admin,
	create_quest,
	update_quest,
	delete_quest,
	create_category,
	update_category,
	delete_category,
)
from app.services.feedback_service import get_feedback_list, delete_feedback
from app.utils.decorators import admin_required, audit_log
from app.utils.helpers import get_json_body

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


#============================================================================
# Chapitres
#============================================================================

@admin_bp.route("/chapters", methods=["POST"])
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


@admin_bp.route("/chapters/reorder", methods=["PUT"])
@admin_required
@audit_log("reorder_chapters")
def admin_reorder_chapters():
	data = get_json_body()
	ordered_ids = data.get("ordered_ids")

	if not isinstance(ordered_ids, list) or not all(isinstance(i, int) for i in ordered_ids):
		return jsonify({"error": "ordered_ids (liste d'entiers) est requis"}), 400

	reorder_chapters(ordered_ids)
	return jsonify({"ok": True})


@admin_bp.route("/chapters/<int:id_chapter>", methods=["PUT"])
@admin_required
@audit_log("update_chapter")
def admin_update_chapter(id_chapter):
	data = get_json_body()
	name = data.get("name")
	position = data.get("position")

	if name is not None:
		name = name.strip() if isinstance(name, str) else ""
		if not name:
			return jsonify({"error": "name doit être une chaîne non vide"}), 400
	if position is not None and not isinstance(position, int):
		return jsonify({"error": "position doit être un entier"}), 400

	update_chapter(id_chapter, name=name, position=position)
	return jsonify({"ok": True})


@admin_bp.route("/chapters/<int:id_chapter>", methods=["DELETE"])
@admin_required
@audit_log("delete_chapter")
def admin_delete_chapter(id_chapter):
	delete_chapter(id_chapter)
	return jsonify({"ok": True})


#============================================================================
# Niveaux
#============================================================================

@admin_bp.route("/levels/unassigned", methods=["GET"])
@admin_required
def admin_unassigned_levels():
	return jsonify(list_unassigned_levels())


@admin_bp.route("/levels", methods=["POST"])
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
	except psycopg.IntegrityError:
		return jsonify({"error": "Ce niveau est déjà rattaché à un chapitre, ou le chapitre n'existe pas"}), 400

	return jsonify({"id_level": id_level}), 201


@admin_bp.route("/levels/<int:id_level>", methods=["PUT"])
@admin_required
@audit_log("update_level")
def admin_update_level(id_level):
	data = get_json_body()
	id_chapter = data.get("id_chapter")
	position = data.get("position")

	if id_chapter is not None and not isinstance(id_chapter, int):
		return jsonify({"error": "id_chapter doit être un entier"}), 400
	if position is not None and not isinstance(position, int):
		return jsonify({"error": "position doit être un entier"}), 400

	update_level(id_level, id_chapter=id_chapter, position=position)
	return jsonify({"ok": True})


@admin_bp.route("/levels/reorder", methods=["PUT"])
@admin_required
@audit_log("reorder_levels")
def admin_reorder_levels():
	data = get_json_body()
	id_chapter = data.get("id_chapter")
	ordered_ids = data.get("ordered_ids")

	if not isinstance(id_chapter, int) or not isinstance(ordered_ids, list) or not all(isinstance(i, int) for i in ordered_ids):
		return jsonify({"error": "id_chapter et ordered_ids (liste d'entiers) sont requis"}), 400

	reorder_levels(id_chapter, ordered_ids)
	return jsonify({"ok": True})


@admin_bp.route("/levels/<int:id_level>", methods=["DELETE"])
@admin_required
@audit_log("delete_level")
def admin_delete_level(id_level):
	delete_level(id_level)
	return jsonify({"ok": True})


#============================================================================
# Scoring global
#============================================================================

@admin_bp.route("/scoring", methods=["GET"])
@admin_required
def admin_get_global_scoring():
	return jsonify(get_global_scoring_params())


@admin_bp.route("/scoring", methods=["PUT"])
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


#============================================================================
# Quêtes
#============================================================================

@admin_bp.route("/quests", methods=["GET"])
@admin_required
def admin_list_quests():
	return jsonify(list_quests_admin())


@admin_bp.route("/quests", methods=["POST"])
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


@admin_bp.route("/quests/<int:id_quest>", methods=["PUT"])
@admin_required
@audit_log("update_quest")
def admin_update_quest(id_quest):
	data = get_json_body()
	menu = data.get("menu")
	label = data.get("label")
	unlocks_key = data.get("unlocks_key")
	required_chapter = data.get("required_chapter", "__unset__")
	position = data.get("position")

	for field_name, value in (("menu", menu), ("label", label), ("unlocks_key", unlocks_key)):
		if value is not None and (not isinstance(value, str) or not value.strip()):
			return jsonify({"error": f"{field_name} doit être une chaîne non vide"}), 400
	if required_chapter != "__unset__" and required_chapter is not None and not isinstance(required_chapter, int):
		return jsonify({"error": "required_chapter doit être un entier ou null"}), 400
	if position is not None and not isinstance(position, int):
		return jsonify({"error": "position doit être un entier"}), 400

	update_quest(
		id_quest,
		menu=menu,
		label=label,
		unlocks_key=unlocks_key,
		required_chapter=required_chapter,
		position=position,
	)
	return jsonify({"ok": True})


@admin_bp.route("/quests/<int:id_quest>", methods=["DELETE"])
@admin_required
@audit_log("delete_quest")
def admin_delete_quest(id_quest):
	delete_quest(id_quest)
	return jsonify({"ok": True})


#============================================================================
# Catégories
#============================================================================

@admin_bp.route("/categories", methods=["POST"])
@admin_required
@audit_log("create_category")
def admin_create_category():
	data = get_json_body()
	name = (data.get("name") or "").strip()
	if not name:
		return jsonify({"error": "name est requis"}), 400

	id_category = create_category(name)
	return jsonify({"id_category": id_category}), 201


@admin_bp.route("/categories/<int:id_category>", methods=["PUT"])
@admin_required
@audit_log("update_category")
def admin_update_category(id_category):
	data = get_json_body()
	name = (data.get("name") or "").strip()
	if not name:
		return jsonify({"error": "name est requis"}), 400

	update_category(id_category, name)
	return jsonify({"ok": True})


@admin_bp.route("/categories/<int:id_category>", methods=["DELETE"])
@admin_required
@audit_log("delete_category")
def admin_delete_category(id_category):
	delete_category(id_category)
	return jsonify({"ok": True})

#============================================================================
# Feedback (avis utilisateurs)
#============================================================================

@admin_bp.route("/feedback", methods=["GET"])
@admin_required
def admin_feedback_list():
	return jsonify(get_feedback_list())


@admin_bp.route("/feedback/<int:id_feedback>", methods=["DELETE"])
@admin_required
@audit_log("delete_feedback")
def admin_feedback_delete(id_feedback):
	delete_feedback(id_feedback)
	return jsonify({"ok": True})