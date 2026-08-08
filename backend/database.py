import json
import os
import urllib.parse
import psycopg
from dotenv import load_dotenv

# Charge les variables définies dans le fichier .env
load_dotenv()

# Chemin absolu vers data.sql
FILENAME_DB_SCHEMA = os.path.join(os.path.dirname(__file__), "data.sql")

# Chemin absolu vers le manifeste des niveaux (généré par npm run generate-manifest)
FILENAME_MANIFEST = os.path.join(os.path.dirname(__file__), "..", "public", "json", "manifest.json")

# On vérifie si une URL de connexion globale est définie.
CONN_PARAMS = os.getenv("DATABASE_URL")

# Si ce n'est pas le cas, on la construit bloc par bloc à partir des variables de .env
if not CONN_PARAMS:
	user = os.getenv("DB_USER", "postgres")
	password = os.getenv("DB_PASSWORD", "")
	host = os.getenv("DB_HOST", "localhost")
	port = os.getenv("DB_PORT", "5432")
	database = os.getenv("DB_NAME", "cartes_logiques")
	sslparams = "" if host in ("localhost", "127.0.0.1") else "?sslmode=require"
	CONN_PARAMS = "postgresql://{}:{}@{}:{}/{}{}".format(user, password, host, port, database, sslparams)


def reset_table():
	"""Réinitialise le schéma de la base à partir de data.sql"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			with open(FILENAME_DB_SCHEMA, "r", encoding="utf-8") as file:
				cur.execute(file.read())


def seed_levels_from_manifest():
	"""
	Rattache tous les niveaux "Play" présents dans public/json/manifest.json
	au premier chapitre (position 1), s'ils n'ont pas déjà une ligne dans "levels".

	Idempotent : peut être relancée sans dupliquer les niveaux déjà en base
	(ON CONFLICT sur "num"). Ne touche jamais aux niveaux déjà rattachés à un
	autre chapitre par l'admin (chantier "menu admin").
	"""
	if not os.path.exists(FILENAME_MANIFEST):
		print("Pas de manifest.json trouvé, seed des niveaux ignoré.")
		return

	with open(FILENAME_MANIFEST, "r", encoding="utf-8") as file:
		manifest = json.load(file)

	play_count = manifest.get("Play", 0)
	if not play_count:
		return

	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT id_chapter FROM chapters ORDER BY position LIMIT 1")
			row = cur.fetchone()
			if row is None:
				print("Aucun chapitre en base, seed des niveaux ignoré.")
				return
			first_chapter_id = row[0]

			for num in range(1, play_count + 1):
				cur.execute(
					"""
					INSERT INTO levels (id_chapter, num, position)
					VALUES (%s, %s, %s)
					ON CONFLICT (num) DO NOTHING
					""",
					(first_chapter_id, num, num),
				)
			conn.commit()

	print(f"{play_count} niveau(x) rattaché(s) au chapitre par défaut.")


if __name__ == "__main__":
    reset_table()
    seed_levels_from_manifest()