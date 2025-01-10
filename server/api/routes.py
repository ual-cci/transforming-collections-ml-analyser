from flask import request
from flask import jsonify
from bson.objectid import ObjectId
from bson import json_util
import json
from sklearn.metrics import f1_score
import api.models as models
from app import model
from flask import Blueprint
import traceback

endpoints_bp = Blueprint('endpoints', __name__)

def parse_json(data):
    return json.loads(json_util.dumps(data))


@endpoints_bp.route('/backend/model_source', methods=['GET', 'POST']) 
def getModeSource():
    try: 
      return jsonify({
        "status": "200",
        "data": model
      }),200
    except Exception as e:
      print("ERROR in model source endpoint")
      print(e)
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500


@endpoints_bp.route('/backend/dataset', methods=['GET', 'POST']) 
def getDataset(analyser_id=None,dataset_id="",includeArtworks=False, includeEmbeddings=False):
    try: 
      dataset_id = ObjectId(request.args.get('dataset_id')) if request.args.get('dataset_id') else dataset_id
      analyser_id = ObjectId(request.args.get('analyser_id')) if request.args.get('analyser_id') else analyser_id
      includeItems = bool(request.args.get('include_items')) if request.args.get('include_items') else bool(includeArtworks)

      if analyser_id!=None:
        analyser = models.Analyser.get(analyser_id, False,False)
        dataset_id = analyser["dataset_id"]

      dataset = models.Dataset.get(dataset_id,includeItems,False)

      return jsonify({
        "status": "200",
        "data": dataset
      }),200
    except Exception as e:
      print("ERROR in dataset endpoint")
      print(e)
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500

@endpoints_bp.route('/backend/datasets', methods=['GET']) 
def getDatasets():
  try:

    user_id = request.args.get("user_id")

    datasets_list = models.Dataset.get_all(user_id)

    return jsonify({
      "status": "200",
      "data": datasets_list
    }),200
  except Exception as e:
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/category', methods=['GET', 'POST']) 
def getCategory(category_id):
  if request.method == 'GET':
    try: 
      category_id = ObjectId(request.args.get('category_id')) if request.args.get('category_id') else category_id
      category = models.Category.get(category_id)

      return jsonify({
        "status": "200",
        "data": category
      }),200
    except Exception as e:
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500

@endpoints_bp.route('/backend/categories', methods=['GET']) 
def getCategories():
  try:

    user_id = request.args.get("user_id")

    categories_list = models.Category.get_all(user_id)

    return jsonify({
      "status": "200",
      "data": categories_list
    }),200
  except Exception as e:
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/analysers', methods=['GET']) 
def getAnalysers():
  try:
    user_id = request.args.get('user_id')
    includeNames = bool(request.args.get('include_names'))
    includeVersions = bool(request.args.get('include_versions'))
    analyser_list = models.Analyser.all(user_id,includeNames,includeVersions)

    return jsonify({
      "status": "200",
      "data": analyser_list
    }),200

  except Exception as e:
    print("ERROR in classifier endpoint")
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500 

@endpoints_bp.route('/backend/category_add', methods=['POST'])
def createCategory():
    try:
      # # Get data from the form
      category_name = request.args.get('name')
      owner = request.args.get('user_id')

      # Create a new category object
      category = {
        "name": category_name,
        "owner": owner
      }
      
      # Add the new category to the database
      category_id = models.category_collection.insert_one(category)

      return jsonify({
        "status": "200",
        "message": "Category " + category_name + " has been created with ID " + str(category_id)
      },200)
    
    except Exception as e:
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500

@endpoints_bp.route('/backend/category_delete', methods=['POST'])
def category_delete():
  try:
    category_id = request.args.get('category_id')
    models.category_collection.delete_one({"_id": ObjectId(category_id)})

    return jsonify({
        "status": "200",
        "message": "Category " + str(category_id) + " has been deleted"
    },200)
  
  except Exception as e:
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/classifier', methods=['GET', 'POST'])
def classifier():
  
  try: 
    includeNames = bool(request.args.get('include_names')) if request.args.get('include_names') else True
    includeModel = bool(request.args.get('include_model')) if request.args.get('include_model') else False

    if request.args.get('analyser_id') and request.args.get('analyser_id') != None:

      analyser_id = ObjectId(request.args.get('analyser_id'))
      classifier = models.Analyser.get(analyser_id,includeNames,False)

    return jsonify({
      "status": "200",
      "data": classifier
    }),200

  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/classifier_status', methods=['GET', 'POST'])
def classifier_status(analyser_id=None):

  try:
    analyser_id = ObjectId(request.args.get('analyser_id')) if request.args.get('analyser_id') else analyser_id
    if str(analyser_id) != "null":
      classifier_db_entry = models.analyser_collection.find({
        "_id": analyser_id
      },{'knn_text_classifier':1,'knn_sentence_classifier':1,'knn_constituent_classifier':1})
      classifier = list(classifier_db_entry)[0]

      status = ""
      model = None

      model = classifier['knn_text_classifier']

      if model != None:
        status = "Trained"
      else: 
        status = "Untrained"
      
      return jsonify({
        "status":200,
        "data":status
      }),200

    else:
      raise Exception("Please provide a valid classifer ID")
  
  except Exception as e:
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/classifier_delete', methods=['POST'])
def classifier_delete():
  try:
    analyser_id = request.args.get('analyser_id')
    models.Analyser.delete(analyser_id)

    return jsonify({
        "status": "200",
        "message": "Analyser " + str(analyser_id) + " has been deleted"
    })
  except Exception as e:
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/labelsets', methods=['GET'])
def labelsets(includeLabels=False, includeNames=True, includeCount=True):

  try:

    includeLabels = bool(request.args.get('include_labels')) if request.args.get('include_labels') else bool(includeLabels)
    includeNames = bool(request.args.get('include_names')) if request.args.get('include_names') else bool(includeNames)
    includeCount = bool(request.args.get('include_count')) if request.args.get('include_count') else bool(includeCount)
    dataset_id = ObjectId(request.args.get('dataset_id')) if request.args.get('dataset_id') else None
    label_type = request.args.get('label_type') if request.args.get('label_type') else None
    user_id = request.args.get('user_id') if request.args.get('user_id') else None

    if dataset_id != None or label_type != None:
      labelsets = models.Labelset.get_all(user_id, dataset_id, label_type, includeLabels, includeNames, includeCount)
    else:
      labelsets = models.Labelset.all(user_id,includeLabels,includeNames, includeCount)
    
    return jsonify({
      "status": "200",
      "data": labelsets
    })
  
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/labelset', methods=['GET'])
def labelset():

  try:

    labelset_id = ObjectId(request.args.get('labelset_id'))
    includeLabels = bool(request.args.get('include_labels'))

    labelset = models.Labelset.get(None,labelset_id,includeLabels)
    labelset["_id"] = str(labelset["_id"])
    labelset["dataset_id"] = str(labelset["dataset_id"])

    if includeLabels:
      labels = models.Label.all(labelset_id, None, {"parse_ids":True})
      labelset["labels"] = labels

    return jsonify({
      "status": "200",
      "data": labelset
    })
  
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500
  
@endpoints_bp.route('/backend/labelset_copy', methods=['GET'])
def labelset_copy():

  try:

    labelset_id = ObjectId(request.args.get('labelset_id'))
    owner_id = request.args.get('owner_id')
    new_labelset_name = request.args.get('name')

    new_labelset = models.Labelset.get(None,labelset_id)
    new_labelset_id = models.Labelset.create(owner_id, new_labelset['dataset_id'], new_labelset['label_type'], new_labelset_name)
    
    models.Label.copy_all(labelset_id, new_labelset_id, None)

    new_labelset_id = str(new_labelset_id)

    return jsonify({
      "status": "200",
      "data": new_labelset_id
    })
  
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500


@endpoints_bp.route('/backend/labelset_new', methods=['GET'])
def labelset_new():

  try:

    labelset_name = request.args.get('name')
    labelset_type = request.args.get('type')
    dataset_id = ObjectId(request.args.get('dataset_id'))
    analyser_id = ObjectId(request.args.get('analyser_id')) if request.args.get('analyser_id') else None
    owner_id = request.args.get('owner_id')

    labelset_id = models.Labelset.create(owner_id,dataset_id,labelset_type,labelset_name,analyser_id)
    labelset_id = str(labelset_id)

    return jsonify({
      "status": "200",
      "data": labelset_id
    })
  
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500
  
@endpoints_bp.route('/backend/labelset_update', methods=['GET'])
def labelset_update():

  try:

    labelset_id = request.args.get('labelset_id') if isinstance(request.args.get('labelset_id'),ObjectId) else ObjectId(request.args.get('labelset_id'))
    update_data = json.loads(request.args.get('data'))

    models.Labelset.update(labelset_id,update_data,False)

    return jsonify({
      "status": "200",
      "message": "Labelset " + str(labelset_id) + " updated"
    })
  
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500
  
@endpoints_bp.route('/backend/labelset_delete', methods=['POST'])
def labelset_delete():

  try:

    labelset_id = request.args.get('labelset_id') if isinstance(request.args.get('labelset_id'),ObjectId) else ObjectId(request.args.get('labelset_id'))
    models.Labelset.delete(labelset_id)

    return jsonify({
      "status": "200",
      "message": "Labelset " + str(labelset_id) + " deleted"
    })
  
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500
  
@endpoints_bp.route('/backend/resultsets', methods=['GET'])
def resultsets():

  try:

    analyser_id = ObjectId(request.args.get('analyser_id')) if request.args.get('analyser_id') else None
    dataset_id = ObjectId(request.args.get('dataset_id')) if request.args.get('dataset_id') else None
    labelset_id = ObjectId(request.args.get('labelset_id')) if request.args.get('labelset_id') else None

    resultsets = models.Resultset.get_all(dataset_id, analyser_id, labelset_id)
    
    return jsonify({
      "status": "200",
      "data": resultsets
    })
  
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/resultset', methods=['GET'])
def resultset():

  try:

    resultset_id = ObjectId(request.args.get('resultset_id'))

    resultset = models.Resultset.get(None,None,None,resultset_id)
    resultset["_id"] = str(resultset["_id"])
    resultset["analyser_id"] = str(resultset["analyser_id"])
    resultset["dataset_id"] = str(resultset["dataset_id"])
    resultset["labelset_id"] = str(resultset["labelset_id"])

    return jsonify({
      "status": "200",
      "data": resultset
    })
  
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/resultset_new', methods=['GET'])
def resultset_new():

  try:

    resultset_name = request.args.get('name')
    resultset_type = request.args.get('type')
    dataset_id = ObjectId(request.args.get('dataset_id'))
    analyser_id = ObjectId(request.args.get('analyser_id')) if request.args.get('analyser_id') else None
    owner_id = request.args.get('owner_id')

    resultset_id = models.Resultset.create(owner_id,dataset_id,resultset_type,resultset_name,analyser_id)
    resultset_id = str(resultset_id)

    return jsonify({
      "status": "200",
      "data": resultset_id
    })
  
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500


@endpoints_bp.route('/backend/dataset_new', methods=['POST'])
def dataset_new():
    
    print("dataset_new")

    try:

      owner_id = request.args.get('owner_id')
      dataset_name = request.form['dataset_name']
      dataset_type = request.args.get('dataset_type')
      
      if dataset_type == 'text':
        dataset = request.files['text_file']
        dataset_id = models.Dataset.create(owner_id,dataset_type,dataset_name,dataset,None,None,None)
      elif dataset_type == 'image':
        image_upload_type = request.args.get('image_upload_type')
        if image_upload_type == 'image_file': 
          dataset = request.files.getlist('image_file')
          print(len(dataset))
          dataset_id = models.Dataset.create(owner_id,dataset_type,dataset_name,None,dataset,None,image_upload_type)
        else:
          dataset = request.files['image_file'] # image links
          #TODO send error_links back to frontend and display as status box
          dataset_id, error_links = models.Dataset.create(owner_id,dataset_type,dataset_name,None,dataset,None,image_upload_type)
      elif dataset_type == "textimage":
        image_upload_type = request.args.get('image_upload_type')
        if image_upload_type == 'image_file':
          text_dataset = request.files['text_file']
          image_dataset = request.files.getlist('image_file')
          print("GOT IMAGE DATASET")
          print(len(image_dataset))
          dataset_id = models.Dataset.create(owner_id,dataset_type,dataset_name,text_dataset,image_dataset,None,image_upload_type)
        else:
          text_image_dataset = request.files['text_image_file']
          dataset_id, error_links = models.Dataset.create(owner_id,dataset_type,dataset_name,None,None,text_image_dataset,image_upload_type)

      if dataset_type == 'image' and image_upload_type == 'image_link':
        return jsonify({
        "status": "200",
        "message": "Dataset has been created",
        "data": error_links
        })
      else:
        return jsonify({
          "status": "200",
          "message": "Dataset has been created"
        })
    except Exception as e:
      
      print(e)
      print(traceback.format_exc())

      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500


@endpoints_bp.route('/backend/dataset_delete', methods=['POST'])
def dataset_delete():

  try:
    dataset_id = request.args.get('dataset_id')

    models.Dataset.delete(dataset_id)

    print("Dataset deleted")

    return jsonify({
      "status": "200",
      "message": "Dataset " + str(dataset_id) + " has been deleted"
    })
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/dataset_status', methods=['GET'])
def dataset_status():
  try:
    dataset_id = request.args.get('dataset_id')
    dataset_db_res = models.dataset_collection.find({"_id": ObjectId(dataset_id)},{"status":1, "artwork_count":1})
    dataset_res = list(dataset_db_res)
    dataset = dataset_res[0]
    return jsonify({
      "status": "200",
      "data": {"id":dataset_id, "status":dataset['status']}
    }),200
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500
  

@endpoints_bp.route('/backend/dataset_update', methods=['GET'])
def dataset_update():
  try:
    dataset_id = request.args.get('dataset_id')
    data = json.loads(request.args.get("data"))
    models.Dataset.update(dataset_id,data)
    return jsonify({
      "status": "200",
      "message": "Dataset " + dataset_id + " updated"
    }),200
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500
  
@endpoints_bp.route('/backend/set_dataset_status', methods=['GET'])
def set_dataset_status():
  try:
    dataset_id = request.args.get('dataset_id')
    dataset_status = request.args.get('dataset_status')
    models.Dataset.set_status(dataset_id,dataset_status)
    return jsonify({
      "status": "200",
      "message": "Status set to " + dataset_status + "for dataset " + dataset_id
    }),200
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/analyser', methods=['GET'])
def getAnalyser():
  try: 
    include_names = bool(request.args.get('include_names')) if request.args.get('include_names') else True
    include_versions = bool(request.args.get('include_versions')) if request.args.get('include_versions') else False

    if request.args.get('analyser_id') and request.args.get('analyser_id') != None:

      analyser_id = ObjectId(request.args.get('analyser_id'))
      analyser = models.Analyser.get(analyser_id,include_names,include_versions)

    return jsonify({
      "status": "200",
      "data": analyser
    }),200

  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/analyser_new', methods=['GET'])
def createAnalyser():
    try:
      # Get data from the form
      name = request.args.get('name')
      dataset_id = ObjectId(request.args.get('dataset_id')) if request.args.get('dataset_id') != "" else None
      category_id = ObjectId(request.args.get('category_id')) if request.args.get('category_id') != "" else None
      user_id = request.args.get('user_id')

      task_description = request.args.get('task_description')
      analyser_type = request.args.get('analyser_type')
      labelling_guide = request.args.get('labelling_guide')
      labelset_id = ObjectId(request.args.get('labelset_id')) if request.args.get('labelset_id') != "" else None

      auto_select_examples = request.args.get('auto_select_examples') if request.args.get('auto_select_examples') else None
      example_ids = request.args.get('example_ids') if request.args.get('example_ids') else None
      num_examples = int(request.args.get('num_examples')) if request.args.get('num_examples') else None
      examples_start_index = int(request.args.get('examples_start_index')) if request.args.get('examples_start_index') else None
      examples_end_index = int(request.args.get('examples_end_index')) if request.args.get('examples_end_index') else None

      example_ids = json.loads(example_ids)

      if (labelset_id != None):
        labelset_data={}
        if (labelling_guide != ""): 
          labelset_data["labelling_guide"] = labelling_guide
        models.Labelset.update(labelset_id, labelset_data,False)

      analyser_id = models.Analyser.create(
        user_id,
        analyser_type,
        name,
        task_description,
        labelling_guide,
        dataset_id,
        labelset_id,
        category_id,
        auto_select_examples,
        example_ids,
        num_examples,
        examples_start_index,
        examples_end_index
      )

      if analyser_id != None:
        return jsonify({
          "status": "200",
          "message": "Analyser " + analyser_id + " has been created",
          "data": {
            "analyser_id":analyser_id
          }
        })
      else: 
        raise

    except Exception as e:
      print("ERROR in createAnalyser")
      print(e)
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500

@endpoints_bp.route('/backend/analyser_update', methods=['GET'])
def analyser_update():
    try:

      print("in analyser_update")
      # Get data from the form
      analyser_id = request.args.get('analyser_id')
      data = json.loads(request.args.get('update_data'))
      config = json.loads(request.args.get('analyser_config')) if request.args.get('analyser_config') else None
      newVersion = bool(request.args.get('new_version')=="true") if request.args.get('new_version') else False

      print("is newversion")

      models.Analyser.update(
        analyser_id, data, config, newVersion
      )

      if analyser_id != None:
        return jsonify({
          "status": "200",
          "message": "Analyser " + analyser_id + " has been updated",
        })
      else: 
        raise Exception("Error in analyser_update")

    except Exception as e:
      print(e)
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500

@endpoints_bp.route('/backend/analyser_change_version', methods=['GET'])
def analyser_update_version():
    try:

      print("updateAnalyserVersion")
      # Get data from the form
      analyser_id = request.args.get('analyser_id')
      version = request.args.get('version')

      if analyser_id != None and version != None:

        models.Analyser.update_version(analyser_id,version)

        return jsonify({
          "status": "200",
          "message": "Version " + version + " of analyser " + analyser_id + " loaded",
        })
      
      else: 
        raise Exception("Error in analyser_update_version")

    except Exception as e:
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500
    

@endpoints_bp.route('/backend/analyser_change_version_details', methods=['GET'])
def analyser_update_version_details():
    try:
      # Get data from the form
      analyser_id = request.args.get('analyser_id')
      version = request.args.get('version')
      data = json.loads(request.args.get('data')) if request.args.get('data') else None

      models.Analyser.update_version_details(analyser_id,version,data)

      if analyser_id != None:
        return jsonify({
          "status": "200",
          "message": "Version " + version + " of analyser " + analyser_id + " updated",
        })
      else: 
        raise Exception("Error in analyser_update_version_status")

    except Exception as e:
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500
    

@endpoints_bp.route('/backend/analyser_create', methods=['GET'])
def analyser_create():
    try:
      # Get data from the form
      name = request.args.get('name')
      dataset_id = request.args.get('dataset_id')
      category_id = request.args.get('category_id')
      user_id = request.args.get('user_id')

      analyser_id = models.Analyser.create(user_id,name,dataset_id,category_id)

      return jsonify({
        "status": "200",
        "message": "Analyser " + analyser_id + " has been created",
        "data": {
          "analyser_id":analyser_id
        }
      })
    except Exception as e:
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500

# fetch pre-calculated predictions
@endpoints_bp.route('/backend/classifier_predictions', methods=['GET'])
def classifier_predictions(analyser_id=None):

  analyser_id = analyser_id if analyser_id!=None else request.args.get('analyser_id')

  #get classifier object 
  classifier_db_res = models.analyser_collection.find({"analyser_id": analyser_id})
  classifier = list(classifier_db_res)[0]
  
  try:
    results = {
      'predictions':{
        'text':{}
      }
    }

    if classifier['knn_text_classifier'] is not None:
      text_predictions = classifier['knn_text_classifier']['text_predictions_per_artwork']
      results['predictions']['text'] = text_predictions
    else:
      raise Exception("Predictions unavailable as a model has not yet been trained for full text data. First, add labels then press 'Train Model' button")

    return jsonify({
      "status": "200",
      "message": "Predictions recieved for text",
      "data": results
    }), 200
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500
  
@endpoints_bp.route('/backend/llm_predictions', methods=['GET'])
def llm_predictions(analyser_id=None,num_predictions=0,start=None,end=None):

  analyser_id = ObjectId(request.args.get('analyser_id')) if request.args.get('analyser_id') else ObjectId(analyser_id)
  auto_select_sample = request.args.get("auto_select_sample")
  sample_ids = request.args.get("sample_ids").split(",")
  num_predictions = int(request.args.get("num_predictions")) if request.args.get("num_predictions") else len(sample_ids)
  start_index = int(request.args.get("start")) if request.args.get("start") else start
  end_index = int(request.args.get("end")) if request.args.get("end") else end
  dataset_id = request.args.get("dataset_id") if request.args.get("dataset_id") and request.args.get("dataset_id") != 'null' else None

  try:
    
    predictions_res = models.Analyser.use(analyser_id,sample_ids,num_predictions,auto_select_sample,dataset_id,start_index,end_index)
    
    if predictions_res is not None:
      if "Runtime error" in predictions_res:
        print("Runtime exception")
        return jsonify({
          "status":"500",
          "error":"Runtime error: Your device is out of memory."
        }),500
      else:
        return jsonify({
          "status": "200",
          "message": "Predictions received for text",
          "data": {
            **predictions_res,
            "sample_ids":sample_ids
          }
        }), 200
    else:
      print("Predictions Error: Predictions not formatted correctly and/or missing values")
      return jsonify({
        "status":"500",
        "error":"Prediction Error: Please contact the technical team."
      }),500
  
  except Exception as e:
    print("exception in LLM predictions")
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500
  
@endpoints_bp.route('/backend/llm_accuracy', methods=['GET'])
def llm_accuracy(analyser_id=None):

  analyser_id = ObjectId(request.args.get('analyser_id')) if request.args.get('analyser_id') else ObjectId(analyser_id)
  
  try:

    analyser = models.Analyser.get(analyser_id,False,False)
    accuracy, unlabelled_test_data = models.Analyser.getAccuracy(analyser_id)

    models.Analyser.update(analyser_id,{"accuracy":accuracy},None,False)

    return jsonify({
      "status": "200",
      "message": "Accuracy recieved for version " + str(analyser['version']) + " of analyser " + str(analyser_id),
      "data": {
        "accuracy" : accuracy,
        "unlabelled_test_data": unlabelled_test_data
      }
    }), 200
  
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

# Renamed from update_all_predictions
@endpoints_bp.route('/backend/train_model', methods=['GET', 'POST'])
def train_model():

  try:
    analyser_id = ObjectId(request.args.get("analyser_id"))

    #get classifier object
    classifier = models.analyser_collection.find({"analyser_id": analyser_id})

    classifier.train_knn_text_model()

    return jsonify({
      "status": "200",
      "message": "Model succesfully created for classifier " + str(analyser_id)
    })
  
  except Exception as e:
    print("ERROR IN TRAINING")
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500

@endpoints_bp.route('/backend/update_example', methods=['GET', 'POST'])
def update_example():
    print("in update_Example")

    try:

      obj_id = request.args.get('id')
      item_id_string = obj_id.split('artwork-')[1].split('-')[0]
      analyser_id = ObjectId(request.args.get('analyser_id'))
      is_checked = json.loads(request.args.get('checked')) # This is the new state after clicking, not the previous state

      analyser = models.Analyser.get(analyser_id,False,False)

      example_refs = analyser['example_refs']

      if (item_id_string in example_refs) and not is_checked: 
        example_refs.remove(item_id_string) 
      elif (item_id_string not in example_refs) and is_checked:
        example_refs.append(item_id_string) 
      else:
        raise Exception("Invalid status for example update " + obj_id)

      models.Analyser.update(
        analyser_id,
        {
          "example_refs":example_refs
        },
        None,
        False
      )

      return jsonify({
        "status": "200",
        "message": "Example " + str(obj_id) + " has been added" if is_checked else "Example " + str(obj_id) + " has been removed"
      })
    
    except Exception as e:
      print(e)
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500
    
@endpoints_bp.route('/backend/update_sample', methods=['GET', 'POST'])
def update_sample():
    print("in update_Sample")

    try:

      obj_id = request.args.get('id')
      item_id_string = obj_id.split('artwork-')[1].split('-')[0]
      analyser_id = ObjectId(request.args.get('analyser_id'))
      is_checked = json.loads(request.args.get('checked')) # This is the new state after clicking, not the previous state

      analyser = models.Analyser.get(analyser_id,False,False)

      print(analyser)

      sample_refs = analyser['sample_ids']

      print(sample_refs)

      if (item_id_string in sample_refs) and not is_checked: 
        sample_refs.remove(item_id_string) 
      elif (item_id_string not in sample_refs) and is_checked:
        sample_refs.append(item_id_string) 
      else:
        raise Exception("Invalid status for sample update " + obj_id)

      models.Analyser.update(
        analyser_id,
        {
          "sample_ids":sample_refs
        },
        None,
        False
      )

      return jsonify({
        "status": "200",
        "message": str(obj_id) + " has been added to sample" if is_checked else str(obj_id) + " has been removed from sample"
      })
    
    except Exception as e:
      print(e)
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500

  
@endpoints_bp.route('/backend/update_label', methods=['GET', 'POST'])
def update_label():
    print("in check_label")

    try:

      obj_id = request.args.get('id')
      print(obj_id)

      item_id = ObjectId(obj_id.split('artwork-')[1].split('-')[0])

      labelset_id = ObjectId(request.args.get('labelset_id'))

      labelset = models.Labelset.get(None,labelset_id)
      label_type = labelset["label_type"]

      options = {}

      action_string = ""

      is_checked = json.loads(request.args.get('checked')) if request.args.get('checked') else None # This is the new state after clicking, not the previous state
      if is_checked != None:
        positive_tag = True if obj_id.startswith('positive') else False # True if clicked on positive label, false if clicked on Negative
        options["label_subtype"] = "positive" if positive_tag else "negative"
        options["ticked"] = is_checked
        action_string = "Value changed to " + str(is_checked)

      score = request.args.get('score') if request.args.get('score') else None
      if score != None:
        options["score"] = score
        action_string = "Value changed to " + str(score)

      rationale = request.args.get('rationale') if request.args.get('rationale') else None
      if rationale != None:
        options["rationale"] = rationale if rationale != "<Empty>" else ""
        action_string = "Rationale changed to " + rationale

      highlight = request.args.get('highlight') if request.args.get('highlight') else None
      if highlight != None:
        options["highlight"] = json.loads(highlight)
        action_string = "Highlight changed"

      exclude = request.args.get('exclude') if request.args.get('exclude') else None
      if exclude != None:
        print(exclude)
        options["exclude"] = exclude
        action_string = "Exclude changed"

      models.Label.update(
        label_type,labelset_id,item_id,item_id,"text",options
      )

      return jsonify({
        "status": "200",
        "message": "Label " + str(obj_id) + " has been updated: " + action_string
      })
    
    except Exception as e:
      print(e)
      return jsonify({
        "status":"500",
        "error":str(e) 
      }),500
    

@endpoints_bp.route('/backend/highlight_text', methods=['GET', 'POST'])
def highlight_text():

  try:

    item_id = request.args.get('item_id')
    subcontent_value = request.args.get('subcontent_value')

    models.Item.update_text_subcontent(item_id, subcontent_value)

    return jsonify({
          "status": "200",
          "message": "Highlighted text has been added to " + str(item_id)
        })
    
  except Exception as e:
    print(e)
    return jsonify({
      "status":"500",
      "error":str(e) 
    }),500
  

# Get data with labels for classifier training
# TODO refactor to use basic dataset endpoint
@endpoints_bp.route('/backend/get_training_set')
def getTrainingSet(analyser_id=None, start=0, length=0):
    
    try:
      # get classifier
      analyser_id = ObjectId(request.args.get('analyser_id')) if request.args.get('analyser_id') else ObjectId(analyser_id)
      start = request.args.get('start', type=int) if request.args.get('start') else start
      length = request.args.get('length', type=int) if request.args.get('length') else length
      classifier = models.Analyser.get(analyser_id, False, False)

      if classifier == None:
        raise Exception("ERROR - Invalid models.Analyser ID: Please provide a valid classifier id")

      print(classifier['dataset_id'])

      dataset = getDataset(classifier["dataset_id"],True,False)

      return jsonify({
        "status":"200",
        "data":dataset
      }),200
    
    except Exception as e:
      print("ERROR in getTrainingSet")
      print(e)
      return jsonify({
          "status":"500",
          "error":e 
      }),500

@endpoints_bp.route('/backend/get_accuracy')
def get_acc():
  
  analyser_id = ObjectId(request.args.get('analyser_id'))
  dataset_id = ObjectId(request.args.get('dataset_id'))
  dataset_type = request.args.get('dataset_type')

  labelled_ids = []

  try: 

    if (dataset_type == "train"):
      dataset_res = getTrainingSet(analyser_id)
    elif dataset_type == "test":
      dataset_res = getDataset(dataset_id,True)
    else:
      raise Exception("Dataset type error: Please use either train or test as keywords")
    
    if (dataset_res[1] == 200):
      d_res = dataset_res[0].json
      artworks = d_res['data']['artworks']

      labels = []
      for artwork in artworks:
        if (artwork['_textLabel'] != None):
          labels += [artwork['_textLabel']]
          labelled_ids += [str(artwork['id'])]
      
    else:
      raise Exception("Dataset labels unavailable")


    predictions_res = classifier_predictions(analyser_id)
    if (predictions_res[1] == 200):
      p_res = predictions_res[0].json  
      preds = p_res['data']['predictions']['text']
      preds_arr = []

      for item in preds:
        if isinstance(preds[item], str): # Check if it is a string for fulltext
          if str(item) in labelled_ids:
            if preds[item] == 'positive':
              preds_arr += [1]
            else:
              preds_arr += [0]
        else:
          itt4 = 0
          itt6 = 0
          for pred in preds[item]:
            if isinstance(pred, str):
              itt4 = itt4 + 1
              if (str(item) + "_" + str(itt4)) in labelled_ids:
                if pred == 'positive':
                  preds_arr += [1]
                else:
                  preds_arr += [0]
            else: 
              for p in pred:
                itt6 = itt6 + 1
                if ("_".join([str(item),str(itt6)])) in labelled_ids:
                  if p == 'positive':
                    preds_arr += [1]
                  else:
                    preds_arr += [0]
      
    else:
      raise Exception("Predictions unavailable")
    
    if labels != [] and preds_arr != []:
      accuracy = f1_score(labels,preds_arr)

      return jsonify({
        "status":200,
        "data": {
          "score":accuracy
        }
      }),200
    
    else:
      raise Exception("Could not compute labels or predictions") 

  except Exception as e:

    error_message = e

    if (str(e).startswith("Predictions unavailable")):
      error_message = "Unable to get acccuracy measure as predictions do not exist yet"

    return jsonify({
        "status":"500",
        "error":error_message
    })


@endpoints_bp.route('/backend/item_image')
def get_item_image():
  item_id = ObjectId(request.args.get('item_id'))
  image_storage_id = ObjectId(request.args.get('image_storage_id'))
  img = models.Item.getImage(item_id,image_storage_id)
  decoded_img = img.decode()
  return jsonify({
      "status":"200",
      "data":decoded_img
  })