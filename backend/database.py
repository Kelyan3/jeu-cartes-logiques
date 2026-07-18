import os
import urllib.parse

from dotenv import dotenv_values
import psycopg

os.chdir(os.path.dirname(__file__))

config = dotenv_values(".env")

FILENAME_DB_SCHEMA = "data.sql"
options = urllib.parse.quote_plus("--search-path=public")
CONN_PARAMS = f"postgresql://{config['USER']}:{config['PASSWORD']}@{config['HOST']}:{config['PORT']}/{config['DATABASE']}?options={options}"


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