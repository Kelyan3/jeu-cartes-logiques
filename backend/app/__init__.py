import os
import logging

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException

from app.config import Config
from app.extensions import login_manager
from app.services.auth_service import get_user_by_id


def create_app():
	load_dotenv()
	logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

	app = Flask(__name__, static_folder="./dist")

	config = Config()
	config.apply(app)

	CORS(app, origins=config.cors_origins, supports_credentials=True)

	login_manager.init_app(app)

	@login_manager.user_loader
	def load_user(id_user):
		return get_user_by_id(id_user)

	_register_error_handlers(app)
	_register_blueprints(app)
	_register_static_route(app)

	return app


def _register_error_handlers(app):
	@app.errorhandler(HTTPException)
	def handle_http_exception(error):
		return jsonify({"error": error.description}), error.code

	@app.errorhandler(Exception)
	def handle_unexpected_exception(error):
		logging.exception("Erreur interne non gérée")
		return jsonify({"error": "Erreur interne du serveur"}), 500


def _register_blueprints(app):
	from app.routes.auth import auth_bp
	from app.routes.progress import progress_bp
	from app.routes.admin import admin_bp
	from app.routes.feedback import feedback_bp

	app.register_blueprint(auth_bp)
	app.register_blueprint(progress_bp)
	app.register_blueprint(admin_bp)
	app.register_blueprint(feedback_bp)


def _register_static_route(app):
	@app.route("/", defaults={"path": ""})
	@app.route("/<path:path>")
	def index(path):
		if path != "" and os.path.exists(app.static_folder + "/" + path):
			return send_from_directory(app.static_folder, path)
		return send_from_directory(app.static_folder, "index.html")