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
	user = os.getenv("USER", "postgres")
	password = os.getenv("PASSWORD", "")
	host = os.getenv("HOST", "localhost")
	port = os.getenv("PORT", "5432")
	database = os.getenv("DATABASE", "cartes_logiques")
	
	options = urllib.parse.quote_plus("--search-path=public")
	CONN_PARAMS = "postgresql://{}:{}@{}:{}/{}?options={}".format(user, password, host, port, database, options)


def reset_table():
	"""Réinitialise le schéma de la base à partir de data.sql"""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			with open(FILENAME_DB_SCHEMA, "r", encoding="utf-8") as file:
				cur.execute(file.read())


def get_database():
	"""Récupère toutes les lignes de la table data_carte (table de test)."""
	with psycopg.connect(CONN_PARAMS) as conn:
		with conn.cursor() as cur:
			cur.execute("SELECT * FROM data_carte;")
			return cur.fetchall()


if __name__ == "__main__":
    reset_table()