from flask import Blueprint, jsonify
from flask_login import current_user

from app.services.feedback_service import (
	VALID_DEVICES,
	create_feedback,
)
from app.utils.helpers import get_json_body

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api")


def _valid_rating(value):
	return isinstance(value, int) and 1 <= value <= 5


@feedback_bp.route("/feedback", methods=["POST"])
def feedback_submit():
	data = get_json_body()

	device = data.get("device")
	device_other = (data.get("device_other") or "").strip()
	rules_rating = data.get("rules_rating")
	rules_comment = (data.get("rules_comment") or "").strip()
	features_rating = data.get("features_rating")
	features_comment = (data.get("features_comment") or "").strip()
	design_rating = data.get("design_rating")
	design_comment = (data.get("design_comment") or "").strip()
	remarks = (data.get("remarks") or "").strip()
	anonymous = data.get("anonymous", False)

	if device not in VALID_DEVICES:
		return jsonify({"error": "Support invalide"}), 400
	if device == "autre" and not device_other:
		return jsonify({"error": "Merci de préciser le support utilisé"}), 400

	for name, rating in (
		("rules_rating", rules_rating),
		("features_rating", features_rating),
		("design_rating", design_rating),
	):
		if not _valid_rating(rating):
			return jsonify({"error": f"{name} doit être une note entre 1 et 5"}), 400

	for name, text in (
		("device_other", device_other), ("rules_comment", rules_comment),
		("features_comment", features_comment), ("design_comment", design_comment),
		("remarks", remarks),
	):
		if len(text) > 1000:
			return jsonify({"error": f"{name} trop long (1000 caractères maximum)"}), 400

	# Anonyme si non connecté, ou si connecté mais coché "envoyer anonymement".
	id_user = current_user.id if current_user.is_authenticated and not anonymous else None

	create_feedback(
		id_user,
		device, device_other or None,
		rules_rating, rules_comment or None,
		features_rating, features_comment or None,
		design_rating, design_comment or None,
		remarks or None,
	)
	return jsonify({"ok": True})
