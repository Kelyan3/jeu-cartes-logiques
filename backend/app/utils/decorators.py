from functools import wraps
import logging

from flask import jsonify, request
from flask_login import current_user


def admin_required(view):
	"""
	Décorateur de route : renvoie 403 si l'utilisateur connecté n'est pas admin
	(401 s'il n'est pas connecté du tout).
	"""
	@wraps(view)
	def wrapped(*args, **kwargs):
		if not current_user.is_authenticated:
			return jsonify({"error": "Authentification requise"}), 401
		if not current_user.is_admin:
			return jsonify({"error": "Réservé aux administrateurs"}), 403
		return view(*args, **kwargs)

	return wrapped


def audit_log(action):
	def decorator(view):
		@wraps(view)
		def wrapped(*args, **kwargs):
			response = view(*args, **kwargs)
			status = response[1] if isinstance(response, tuple) else response.status_code
			if status < 400:
				logging.info(
					"AUDIT user=%s(%s) action=%s params=%s body=%s",
					current_user.username, current_user.id, action, kwargs,
					request.get_json(silent=True),
				)
			return response
		return wrapped
	return decorator