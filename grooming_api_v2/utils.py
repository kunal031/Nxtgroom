from bson import ObjectId
from bson.errors import InvalidId

def get_db_id(id_str: str):
    try:
        return ObjectId(id_str)
    except InvalidId:
        return id_str
