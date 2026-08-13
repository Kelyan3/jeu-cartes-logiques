from flask import request


def get_json_body():
	data = request.get_json(silent=True)
	return data if isinstance(data, dict) else {}