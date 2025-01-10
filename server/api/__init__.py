from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
import ai.llm_modelling as llm_modelling
from dotenv import load_dotenv
import gridfs

uri = "mongodb://127.0.0.1:27017"
database = "tanc_database"

# Connect to MongoDB 
client = MongoClient(uri)
dbnames = client.list_database_names()
if (database in dbnames):
  db = client[database]
else:
  db = client[database]
  init_col = db['init']
  x = init_col.insert_one({'text': 'init database'})

UPLOAD_FOLDER = '/cache'
grid_fs = gridfs.GridFS(db)

def create_app(model="azure",wandb_toggle=False):
  app = Flask(__name__)

  CORS(app)

  load_dotenv()  # take environment variables from .env.

  # Set up API endpoints
  from api.routes import endpoints_bp
  app.register_blueprint(endpoints_bp)

  # Set up ML modelling
  llm_modelling.init(model,wandb_toggle)

  return app

