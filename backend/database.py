import os
import urllib.parse
import psycopg
from dotenv import load_dotenv

# Charge les variables définies dans le fichier .env
load_dotenv()

# Chemin absolu vers data.sql
FILENAME_DB_SCHEMA = os.path.join(os.path.dirname(__file__), "data.sql")

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


if __name__ == "__main__":
    reset_table()