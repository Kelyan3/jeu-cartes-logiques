import os
import secrets


class Config:
	def __init__(self):
		self.secret_key = os.getenv("SECRET_KEY")
		if not self.secret_key:
			print(
				"ATTENTION! Aucune SECRET_KEY définie dans le fichier .env. "
				"Une clé temporaire sera utilisée et changera à chaque redémarrage "
				"du serveur, et par conséquent, tous les utilisateurs seront déconnectés. "
				"N'oubliez pas d'ajouter \"SECRET_KEY=<key>\" dans votre fichier .env."
			)
			self.secret_key = secrets.token_hex(32)

		self.is_production = os.environ.get("RENDER") is not None
		self.cors_origins = ["http://localhost:5173"]

		frontend_url = os.environ.get("FRONTEND_URL", "").rstrip("/")
		if frontend_url:
			self.cors_origins.append(frontend_url)

	def apply(self, app):
		app.secret_key = self.secret_key
		app.config["SESSION_COOKIE_SAMESITE"] = "None" if self.is_production else "Lax"
		app.config["SESSION_COOKIE_SECURE"] = self.is_production