import os, pandas as pd, numpy as np, os, re
os.environ['CUDA_LAUNCH_BLOCKING'] = "1"
os.environ["PYTORCH_USE_CUDA_DSA"] = "1"
import torch
from transformers import AutoProcessor, MllamaForConditionalGeneration, MllamaConfig
from huggingface_hub import login
from datetime import datetime
import openai
from openai import OpenAI, AzureOpenAI
import wandb
from wandb.sdk.data_types.trace_tree import Trace
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, precision_recall_fscore_support
from wandb.sdk.data_types._dtypes import AnyType
import math
import traceback
import random
import re
import copy
from io import BytesIO
from PIL import Image
import base64

def init(model, wandb_toggle=False):
    
    global azure_image_model_option
    global azure_text_model_option
    global azure_api_version
    global openai_model_option
    global huggingface_model_option
    global llm_client
    global text_llm_client
    global image_llm_client
    global huggingface_model
    global huggingface_processor
    global model_source
    global wandb_logging

    model_source=model
    wandb_logging= wandb_toggle

    os.environ["ENVIRONMENT"] = os.environ.get("ENVIRONMENT")
    if model_source == "openai":
      os.environ['OPENAI_API_KEY'] = os.environ.get('OPENAI_API_KEY')
      os.environ['OPENAI_API_TYPE'] = os.environ.get('OPENAI_API_TYPE')
      openai_model_option = os.environ.get('OPENAI_MODEL_OPTION')
    if model_source == "azure":
      os.environ['AZURE_OPENAI_API_KEY'] =  os.environ.get('AZURE_OPENAI_API_KEY')
      os.environ['AZURE_OPENAI_ENDPOINT'] = os.environ.get('AZURE_OPENAI_ENDPOINT')
      azure_image_model_option = os.environ.get('AZURE_IMAGE_MODEL_OPTION')
      azure_text_model_option = os.environ.get('AZURE_TEXT_MODEL_OPTION')
      azure_api_version = os.environ.get('AZURE_API_VERSION')
    if model_source == "huggingface":
      huggingface_model_option = "meta-llama/Llama-3.2-11B-Vision-Instruct"
      os.environ['HUGGINGFACE_API_KEY'] = os.environ.get('HUGGINGFACE_API_KEY')
    
    if wandb_logging:
      os.environ["WANDB__SERVICE_WAIT"] = os.environ.get("WANDB__SERVICE_WAIT")
      os.environ["WANDB_MODE"] = os.environ.get("WANDB_MODE")

    print("---------------- SERVER INITIALISED ------------------")
    print("Model Source: " + model_source)
    print("Weights & Biases Logging: " + str(wandb_logging))
    if model_source == "openai":
      llm_client = OpenAI(
        api_key=os.environ['OPENAI_API_KEY']  
      )

    if model_source == "azure":
      text_api_base = os.environ['AZURE_OPENAI_ENDPOINT']
      text_llm_client = AzureOpenAI(
          api_key=os.environ['AZURE_OPENAI_API_KEY'],  
          api_version=azure_api_version,
          azure_endpoint=text_api_base
      )
      image_api_base = os.environ['AZURE_OPENAI_ENDPOINT']
      image_llm_client = AzureOpenAI(
          api_key=os.environ['AZURE_OPENAI_API_KEY'],  
          api_version=azure_api_version,
          base_url=f"{image_api_base}openai/deployments/{azure_image_model_option}/extensions",
      )

    if model_source == "huggingface":
      login(token = os.environ['HUGGINGFACE_API_KEY']) #llama repo permission

      print('Downloading ' + huggingface_model_option + '...')
      config = MllamaConfig()
      config._attn_implementation_autoset = True
      config._name_or_path = "meta-llama/Llama-3.2-11B-Vision-Instruct"
      config.architectures = ["MllamaForConditionalGeneration"]
      config.torch_dtype = "bfloat16"
      config.text_config.eos_token_id = [128001,128008,128009]
      config.text_config.rope_scaling = {
          "factor": 8.0,
          "high_freq_factor": 4.0,
          "low_freq_factor": 1.0,
          "original_max_position_embeddings": 8192,
          "rope_type": "llama3"
      }
      config.text_config.rope_theta = 500000.0
      config.text_config.torch_dtype = "bfloat16"
      config.text_config.max_position_embeddings = int(1e30) #increase context size
      config.vision_config.image_size = 560
      config.vision_config.torch_dtype = "bfloat16"
      huggingface_model = MllamaForConditionalGeneration.from_pretrained("meta-llama/Llama-3.2-11B-Vision-Instruct", device_map="auto", torch_dtype=torch.bfloat16, config=config, low_cpu_mem_usage=True)
      huggingface_processor = AutoProcessor.from_pretrained(huggingface_model_option)

    if wandb_logging:
      wandb.finish()
      wandb.login()

    print("------------------------------------------------------")

def start_logging(analyser):
  
  if wandb_logging:

    global run

    wandb.finish()
    run = wandb.init(project="ual-tanc-ml-app")

    wandb.log({
      "analyser_id":str(analyser['_id']),
      "analyser_name":analyser['name'],
      "analyser_type":analyser['analyser_type'],
      "analyser_format":analyser['analyser_format'],
      "analyser_task_description":analyser['task_description'],
      "analyser_labelling_guide":analyser['labelling_guide'],
      "version":analyser['version']
    })

def end_logging():
  if wandb_logging:
    wandb.finish()

def get_model_baseline(prompt_examples,items_for_inference,analyser,labels,dataset):

  print("get_model_baseline")

  if wandb_logging:
    start_logging(analyser)

  #Get fake "random" predictions based on example distribution
  if (analyser['analyser_type'] == "binary"):
    pos_examples = [example for example in prompt_examples if str(example['label']) == "1"]
    prob = len(pos_examples)/len(prompt_examples)
    prob_dist = [prob, 1-prob]
    random_preds = random.choices(["positive","negative"],prob_dist,k=len(items_for_inference))
    predictions = [{item["_id"]:random_preds[index]} for index, item in enumerate(items_for_inference)]

    trained_example_ids = [example['_id'] for example in prompt_examples]

  elif (analyser['analyser_type'] == "score"):
    prompt_scores = [int(example['label']) for example in prompt_examples]
    average_score = sum(prompt_scores)/len(prompt_scores)
    predictions = [{item["_id"]:round(average_score,3)} for item in items_for_inference]

    trained_example_ids = [example['_id'] for example in prompt_examples]

  else:

    return None

  try:
    accuracy = compute_accuracy(labels,dataset,trained_example_ids,predictions,analyser['analyser_type'],analyser['analyser_format'], True)
  
  except Exception as e:
    print(e)
    if wandb_logging:
      end_logging()
    return None
  
  if wandb_logging:
    if (analyser['analyser_type'] == "binary"):
      wandb.log({
        "model_type":model_source,
        "baseline_accuracy":accuracy,
      })

    elif (analyser['analyser_type'] == "score"):
      wandb.log({
        "model_type":model_source,
        "baseline_mae":accuracy,
      })

  return accuracy


def use_model(prompt,prompt_examples,item_indices,items_for_inference, analyser):

  try: 

    if wandb_logging:
      global root_span

      # Create a root span to represent the entire trace
      start_time_ms = round(datetime.now().timestamp() * 1000)
      root_span = Trace(
        name="LLMChain",
        kind="chain",
        metadata={
          "analyser_id":str(analyser['_id']),
          "version":analyser['version']
        },
        start_time_ms=start_time_ms,
        inputs={"analyser_id":str(analyser['_id']),"version":analyser['version'],"query":prompt}
      )

    prediction_results = make_predictions(prompt,prompt_examples,item_indices,items_for_inference, analyser['analyser_type'], analyser['analyser_format'])

    if wandb_logging:
      root_span.add_inputs_and_outputs({"analyser_id":str(analyser['_id']),"version":analyser['version'],"prompt":prompt},{"result":prediction_results})
      root_span.end_time_ms = round(datetime.now().timestamp() * 1000)
      # log all spans to W&B by logging the root span
      root_span.log(name="prediction_trace")

    return prediction_results
  
  except Exception as e:
    print (e)
    if wandb_logging:
      end_logging()

def create_user_prompt(inference_examples, analyser_type, analyser_format):

  try:

    print("------------------- Creating user prompt")
    print(len(inference_examples))
    print(analyser_format)
    print(analyser_type)
    print("------------------------------")

    prompt = f"\nNow please give a total of exactly {len(inference_examples)} results, one for each of the following inputs. " 

    if analyser_type == 'binary':
      prompt = prompt + "Please print results as one word (either positive or negative) in sequence, each seperated by a new line. Do not include any other numbers or text."

    if analyser_type == 'score':
      prompt = prompt + "Please print results as one number (either 0, 1, 2, 3, 4, or 5) in sequence, each seperated by a new line. Do not include any other numbers or text."

    if analyser_format == "text":
      prompt = prompt + "\n-----\nINPUT:\n"
      for index, ex in enumerate(inference_examples):
        example_text = f"TEXT-{index}:{ex}\n"
        prompt += example_text
      prompt = prompt + "--\nOUTPUT:"  

      return prompt

    elif analyser_format == "image":
      prompt = prompt + "\n-----\nINPUT:\n"
      test_content = [
        {
            "type": "text",
            "text": prompt
        }
      ]

      for i, ex in enumerate(inference_examples):
        if model_source == "huggingface":
          imagetag={
            "type": "text",
            "text": "IMAGE-"+str(i)+":"
          }
          image = {
              "type": "image"
          }
        
        else:
          img_url = f"data:image/jpeg;base64,{ex}"

          imagetag={
              "type": "text",
              "text": "IMAGE-"+str(i)+":"
          }
          image = {
              "type": "image_url",
              "image_url": {
                  "url": img_url,
                  "detail":"low"
              }
          }

        test_content.append(imagetag)
        test_content.append(image)

      prompt_end = {
        "type": "text",
        "text": "--\nOUTPUT:"
      }

      test_content.append(prompt_end)

      return test_content
    
    elif analyser_format == "textimage":
        
        test_content = [
          {
              "type": "text",
              "text": prompt + "\n-----\nINPUT:\n"
          }
        ]

        for index, ex in enumerate(inference_examples):

          example_text = {
              "type": "text",
              "text": f"TEXT-{index}:{ex['text']}\n"
          }

          test_content.append(example_text)
          
          if model_source == "huggingface":
            imagetag={
              "type": "text",
              "text": "IMAGE-"+str(index)+":"
            }
            image = {
                "type": "image"
            }

          else:
            img_url = f"data:image/jpeg;base64,{ex['image']}"

            imagetag={
                "type": "text",
                "text": "IMAGE-"+str(index)+":"
            }
            image = {
                "type": "image_url",
                "image_url": {
                    "url": img_url,
                    "detail":"low"
                }
            }

          test_content.append(imagetag)
          test_content.append(image)

      
        prompt_end = {
          "type": "text",
          "text": "--\nOUTPUT:"
        }

        test_content.append(prompt_end)

        return test_content
      
    return None

  except Exception as e:
    print("exception in create_user_prompt")
    print(e)


def make_predictions(system_prompt,prompt_examples,test_set_indices,test_set,analyser_type,analyser_format):

  print("making predictions")
  
  if (analyser_format == "text") and (model_source!="huggingface"):
    prompt_batch_size = 10
  elif (analyser_format != "text") and (model_source=="huggingface"):
    prompt_batch_size = 1
  else:
    prompt_batch_size = 5

  i = 0
  pred_count = 0
  batch_count = 1
  max_retry_count = 2
  retry_count = 0
  prediction_type = analyser_format

  predictions = []

  while i < len(test_set_indices):
    print("Calculating predictions: Batch " + str(batch_count))
    try:
      if retry_count == max_retry_count:
        print("Max retry exceeded for batch " + str(batch_count))
        i+= prompt_batch_size
        batch_count += 1
        retry_count = 0
      
      batch_indices = test_set_indices[i: min(i+prompt_batch_size, len(test_set))]

      if len(batch_indices) > 0:
        if len(test_set[0]['content']) > 0: 
          if prediction_type == "text":
            final_test_batch = [next((x for x in item["content"] if x['content_type'] == 'text'), None)['content_value']['text'] for i, item in enumerate(test_set) if i in batch_indices]
          elif prediction_type == "image":
            final_test_batch=[]
            for itt, item in enumerate(test_set):
              if itt in batch_indices:
                content_val = next((x for x in item["content"] if x['content_type'] == 'image'), None)["content_value"]
                base64embeddings = [e['value'] for e in content_val["embeddings"] if ("embeddings" in content_val and e['format']=="base64")]
                if len(base64embeddings)>0:
                  final_test_batch.append(base64embeddings[0])
                else:
                  print("NO EMBEDDING")
          elif prediction_type == "textimage":
            text = [next((x for x in item["content"] if x['content_type'] == 'text'), None)['content_value']['text'] for i, item in enumerate(test_set) if i in batch_indices]
            images=[]
            for itt, item in enumerate(test_set):
              if itt in batch_indices:
                content_val = next((x for x in item["content"] if x['content_type'] == 'image'), None)["content_value"]
                base64embeddings = [e['value'] for e in content_val["embeddings"] if ("embeddings" in content_val and e['format']=="base64")]
                if len(base64embeddings)>0:
                  images.append(base64embeddings[0])
                else:
                  print("NO EMBEDDING")
            final_test_batch = [{
              "image":image_data,
              "text": text[index] if index < len(text) else ""
            } for index, image_data in enumerate(images)]

        # Get batch results
        result = get_batch_predictions(i,final_test_batch,system_prompt,analyser_type,prediction_type,prompt_examples,batch_indices)

        if (result['status'] == 'success'):
          batch_results = {
            "batch_num":batch_count,
            "batch_indicies":batch_indices,
            "status":result["status"],
            "results":result["res"],
            "end_time":result["end"]
          }
        elif (result['status'] == 'filtered_success'):
          batch_results = {
            "batch_num":batch_count,
            "batch_indicies":batch_indices,
            "status":result["status"],
            "results":result["res"],
            "end_time":result["end"],
            "error":result["error"]
          }
        else:
          batch_results = {
            "batch_num":batch_count,
            "batch_indicies":batch_indices,
            "status":"fail",
            "results":[],
            "error":result["error"] if "error" in result else ""
          }                    
        
      else:
        print("Trying to predict empty batch")
        i+= prompt_batch_size
        batch_results = None
      
      if batch_results!=None:
        predictions.append(batch_results)
        pred_count += len(batch_results['results'])
        i+= prompt_batch_size
        batch_count += 1
      else:
        if (len(batch_indices) > 0) and (batch_results['status']=="success"):
          raise Exception("Error: Batch results length zero")
        else:
          batch_results = []

    except Exception as e:
      print(e)
      error_string = "Prediction error for batch " + str(batch_count) + ". Re-running predictions for items " + str(batch_indices)
      print(error_string)
      retry_count += 1
      pass

  return predictions


def get_batch_predictions(i,test_batch, system_prompt, analyser_type, analyser_format, prompt_examples=None, test_indices=None):
    
    print("Calculating batch predictions for " + str(len(test_batch)) + " in batch " + str(int(math.ceil(i/len(test_batch)))))

    try:
      trancename = ""
      token_usage = None
      batch_start_time = round(datetime.now().timestamp() * 1000)

      user_prompt = create_user_prompt(test_batch, analyser_type, analyser_format)
      response_text = ""
      predictions = []
      batch_end_time = None
      metrics = None

      # Get results from chosen AI provide
      if model_source == "azure":
        model_result = get_azure_gpt_response(system_prompt, user_prompt, analyser_format, analyser_type, prompt_examples)
        if model_result['status']=="200":
          batch_end_time = model_result["end"]
          response_text = model_result["res"]
          token_usage = model_result["token"]

        #if content filter is triggered in batch -> put each item through model to see which one gets triggered
        if model_result['status']=="400" and 'content_filter_data' in model_result:
          print("Rerunning filtered results")
          response_text = ""
          content_errors = []
          for sample in test_batch:
            user_prompt = create_user_prompt([sample], analyser_type, analyser_format)
            rerun_result = get_azure_gpt_response(system_prompt, user_prompt, analyser_format, analyser_type, prompt_examples)
            if rerun_result['status'] == '200':
              response_text += rerun_result['res'] + '\n'
            if rerun_result['status'] == '400' and 'content_filter_data' in rerun_result:
              response_text += 'content_filter' + '\n'
              content_errors.append(rerun_result['error'])

      if model_source == "openai":
        print("GETTING OPENAI RESPONSE")
        model_result = get_openai_gpt_response(system_prompt, user_prompt)
        if model_result['status']=="200":
          batch_end_time = model_result["end"]
          response_text = model_result["res"]
          token_usage = model_result["token"]
        

      if model_source == "huggingface":
        print("GETTING huggingface RESPONSE")
        model_result = get_huggingface_response(system_prompt, user_prompt, analyser_format, analyser_type, prompt_examples, test_batch) 
        if model_result['status']=="200":
          batch_end_time = model_result["end"]
          response_text = model_result["res"]
          token_usage = model_result["token"]

      print('response_text')
      print(response_text)

      if wandb_logging:
        if model_source == "openai":
          tracename = "OpenAI-"+str(i)
          md = dict({
            "model_source": model_source,
            "model_name": openai_model_option,
            "token_usage": {
              "completion_tokens":token_usage.completion_tokens, 
              "prompt_tokens":token_usage.prompt_tokens, 
              "total_tokens":token_usage.total_tokens
            }
          })
        elif model_source == "azure":
          tracename = "Azure-openai-"+str(i)
          md = dict({
            "model_source": model_source,
            "model_name":azure_image_model_option if (analyser_format == "image") else azure_text_model_option
          })
        elif model_source == "huggingface":
          tracename = "huggingface-"+str(i)
          md = dict({
            "model_source": model_source,
            "model_name":huggingface_model_option
          })

        wandb.log({
          "model_source":model_source,
          "model_name":md['model_name'],
        })

        if token_usage != None:
          wandb.log({
            "completion_tokens":token_usage.completion_tokens, 
            "prompt_tokens":token_usage.prompt_tokens, 
            "total_tokens":token_usage.total_tokens
          })

      # Parse results from results string

      if len(response_text)>0:

        predictions = re.split(r'\n+', response_text) 

        if analyser_type == 'binary': 
          predictions = [clean_response_string(p.strip().lower()) for p in predictions if ("positive" in p.lower()) or ("negative" in p.lower()) or ("content_filter" in p.lower())] #[p.strip() for p in predictions]

          predictions = [extract_binary_result(p) for p in predictions]

          for p in set(predictions):
            if not(p.lower() in ['positive', 'negative', 'content_filter']): 
              raise Exception("Results Error: Invalid response: '" + p + "'")
            
        if analyser_type == 'score':
          predictions = [extract_score_result(p) for p in predictions]
          predictions = [p for p in predictions if p!= None]

          for p in set(predictions):
            if not (p in ['0', '1', '2', '3', '4', '5','content_filter']):
              raise Exception("Results Error: Invalid response: '" + p + "'")

        if len(test_batch) != len(predictions):
          raise Exception("Results Error: Missing predictions: Expected " + str(len(test_batch)) + " received " + str(len(predictions)))

        if wandb_logging:
          llm_span = Trace(
              name=tracename,
              kind="llm",
              status_code="success",
              metadata=md,
              start_time_ms=batch_start_time,
              end_time_ms=batch_end_time,
              inputs={"system_prompt":system_prompt if analyser_format=="text" else "", "query": user_prompt if analyser_format=="text" else ""},
              outputs={"response": response_text, "predictions":predictions},
              )

          root_span.add_child(llm_span)
        
        if model_result['status']=="200":
          return {
            "status":"success",
            "end":batch_end_time,
            "res":predictions
          }
      
        if (model_result['status']=="400") and ('content_filter_data' in model_result):
          return {
            "status":"filtered_success",
            "end":batch_end_time,
            "res":predictions,
            "error": content_errors
          }

      else:
        return {
          "status":"fail",
          "error":model_result
        }
    
    except Exception as e:
      print("exception in get_batch_predictions")
      print(e)


def clean_response_string(string) :
  result = ''.join([s for s in string if s.isalnum() or s.isspace()])
  return result

def extract_binary_result(prediction):
  result = 'positive' if 'positive' in prediction.lower() else 'negative' if 'negative' in prediction.lower() else 'content_filter' 
  return result

def extract_score_result(prediction):
  if ("content_filter" in prediction):
    result = "content_filter"
  else:
    number_results = re.findall(r'\b\d+\b', prediction)
    if (len(number_results)>0):
      result = "".join(number_results)
    else:
      result = None
  return result

def get_openai_gpt_response(primer_message, user_message):

  try:
    chat_settings = {
      "model": openai_model_option,
      "max_tokens": 1000,
      "temperature": 0.8
    }

    body = {
      "model":
      chat_settings["model"],
      "messages": [{
        "role": "system",
        "content": primer_message
      }, {
        "role": "user",
        "content": user_message
      }]
    }

    completion = openai.chat.completions.create(
      model=chat_settings["model"],
      messages=body["messages"],
      max_tokens=chat_settings["max_tokens"],
      temperature=chat_settings["temperature"])

    llm_end_time_ms = round(datetime.now().timestamp() * 1000)
    response_text = completion.choices[0].message.content
    token_usage = completion.usage

    return {
      "status":"200",
      "res":response_text,
      "end":llm_end_time_ms, 
      "token":token_usage 
    }
  
  except Exception as e:
    print("exception in get_openai_gpt_response")
    print(e)

def get_azure_gpt_response(primer_message, user_message, analyser_format, analyser_type, prompt_examples=None):

  print("GETTING AZURE")

  try:
    chat_settings = {
      "model": azure_image_model_option if (analyser_format == "image") or (analyser_format == "textimage") else azure_text_model_option
    }

    messages = []

    if analyser_format == "text":
      messages.append({
        "role": "system",
        "content": primer_message
      })
    elif (analyser_format == "image") or (analyser_format == "textimage"):
      
      prompt_messages = []

      primer = {
        "type": "text",
        "text": primer_message + "-----\n\nExamples:\n\n""-----\n\n"
      }
      prompt_messages.append(primer)

      for i, ex in enumerate(prompt_examples):

        if (analyser_format == "textimage"):
          text = {
              "type": "text",
              "text": f"TEXT-{str(i)}:{ex['text']}\n"
          }
          prompt_messages.append(text)

        imagetag = {
          "type": "text",
          "text": f"\nIMAGE-{str(i)}:" 
        }
        prompt_messages.append(imagetag)

        img_data = ex['image']
        img_url = f"data:image/png;base64,{img_data}"
        image = {
          "type": "image_url",
          "image_url": {
            "url": img_url,
            "detail":"low"
          }
        }
        prompt_messages.append(image)

        if analyser_type == 'binary':
          result_text = f"\nRESULT-{str(i)}:" + ('positive' if ex['label'] == 1 else 'negative')
        else: #score
          result_text = f"\nRESULT-{str(i)}:" + str(ex['label'])
        rationale_text = ("" if (len(ex['rationale']) == 0) else "\nREASON:" + ex['rationale'])

        label = {
          "type": "text",
          "text": result_text + rationale_text
        }
        prompt_messages.append(label)

        print(result_text)
      
      messages.append({
        "role": "system",
        "content": prompt_messages
      })

    messages.append({
      "role": "user",
      "content": user_message
    })

    body = {
      "messages": messages
    }

    completion = None

    if (analyser_format == "image") or (analyser_format == "textimage"):
      try:
        completion = image_llm_client.chat.completions.create(
          model=chat_settings["model"],
          messages=body["messages"]
        )
      except Exception as e:
        res = e.response.json()
        if res['error']['code'] == "content_filter":
          error_msg = res['error']['message']
          error_obj = res['error']['inner_error']['content_filter_results']
          return {
            "status":"400",
            "error":res['error'],
            "message":error_msg,
            "content_filter_data":error_obj
          }
        else:
          return {
            "status":"400",
            "error":res
          }
        
    elif analyser_format == "text":
      try:
        completion = text_llm_client.chat.completions.create(
          model=chat_settings["model"],
          messages=body["messages"]
        )
      except Exception as e:
        res = e.response.json()
        if res['error']['code'] == "content_filter":
          error_msg = res['error']['message']
          error_obj = res['error']['inner_error']['content_filter_results']
          return {
            "status":"400",
            "error":res['error'],
            "message":error_msg,
            "content_filter_data":error_obj
          }
        else:
          return {
            "status":"400",
            "error":res
          }

    llm_end_time_ms = round(datetime.now().timestamp() * 1000)
    response_text = completion.choices[0].message.content
    token_usage = completion.usage
    return {
      "status":"200",
      "res":response_text,
      "end":llm_end_time_ms, 
      "token":token_usage 
    }

  except Exception as e:
    print("exception in get_azure_gpt_response")
    print(e)
    print(traceback.format_exc())

def get_huggingface_response(primer_message, user_message, analyser_format, analyser_type, prompt_examples=None, test_batch=None):
  try:
    image_data = None
    messages = []

    if analyser_format == "text":
        messages.append({
          "role": "system",
          "content": [{
              'type': 'text',
              'text': primer_message
          }]
        })
    elif (analyser_format == "image") or (analyser_format == "textimage"):

      prompt_messages = []

      primer = {
        "type": "text",
        "text": primer_message
      }
      prompt_messages.append(primer)

      train_images = []
      train_messages = []

      train_content = [
          {
            "type": "text",
            "text": "-----\n\nExamples:\n\n""-----\n\n"
        }
      ]

      train_messages.append(train_content)

      for i, ex in enumerate(prompt_examples):

        if (analyser_format == "textimage"):
          text = {
              "type": "text",
              "text": f"TEXT-{str(i)}:{ex['text']}\n"
          }
          train_messages.append(text)

        imagetag = {
          "type": "text",
          "text": f"\nIMAGE-{str(i)}:"
        }
        train_messages.append(imagetag)

        img_data = ex['image']
        train_images.append(Image.open(BytesIO(base64.b64decode(img_data))))

        image = {
          "type": "image"
        }
        train_messages.append(image)

        if analyser_type == 'binary':
          result_text = f"\nRESULT-{str(i)}:" + ('positive' if ex['label'] == 1 else 'negative')
        else:
          result_text = f"\nRESULT-{str(i)}:" + str(ex['label'])

        rationale_text = ("" if (len(ex['rationale']) == 0) else "\nREASON:" + ex['rationale'])

        label = {
          "type": "text",
          "text": result_text + rationale_text
        }
        train_messages.append(label)

      messages.append({
        "role": "system",
        "content": prompt_messages
      })

      messages.append({
          "role": "user",
          "content": train_messages
      })

      test_images = []
      for i in test_batch:  
        test_images.append(Image.open(BytesIO(base64.b64decode(i if analyser_format == 'image' else i['image']))))

      image_data = train_images + test_images

    messages.append({
      "role": "user",
      "content": user_message
    })

    completion = None 

    try:
      prompt = huggingface_processor.apply_chat_template(messages, add_generation_prompt=True)
      inputs = huggingface_processor(images=image_data, text=prompt, padding=True, return_tensors="pt").to(huggingface_model.device) 
      completion = huggingface_model.generate(**inputs, min_new_tokens=len(test_batch)*2, max_new_tokens=len(test_batch)*2, use_cache=False, do_sample=True)
      response = huggingface_processor.decode(completion[0], skip_special_tokens=True, clean_up_tokenization_spaces=False) 
      response_text = response.split('assistant')[-1].strip()

    except RuntimeError as e:
      print("Runtime exception in get_huggingface_response")
      print(e)
      print(traceback.format_exc())
      return {
        "status":"400",
        "error":"Runtime error: Your device is out of memory."
      }

    except Exception as e:
      return {
        "status":"400",
        "error":e
      }

    llm_end_time_ms = round(datetime.now().timestamp() * 1000)
    token_usage = len(prompt) 

    return {
      "status":"200",
      "res":response_text,
      "end":llm_end_time_ms,
      "token":token_usage
    }

  except RuntimeError as e:
    print("Runtime exception in get_huggingface_response")
    print(e)
    print(traceback.format_exc())
    return {
      "status":"400",
      "error":"Runtime error: Your device is out of memory."
    }

  except Exception as e:
    print("exception in get_huggingface_response")
    print(e)
    print(traceback.format_exc())
    return {
      "status":"400",
      "error":e
    }
  

def compute_accuracy(labels,dataset,trained_example_ids,predictions,analyser_type,analyser_format,isBaseline):

  try:

    print("Computing accuracy...")

    # Combine dataset and labels for all items in the dataset, ready for sampling
    combinedData = []

    for index, item in enumerate(dataset):

      newItem = removeItemEmbeddings(copy.deepcopy(item)) if "image" in analyser_format else copy.deepcopy(item)

      label_result = next((x for x in labels if str(x['item_id']) == str(item["_id"])), None)
      
      if label_result != None:
        if analyser_type == 'binary':
          newItem['label'] = "negative" if (str(label_result['value'])=="0") else ("positive" if (str(label_result['value'])=="1") else "")
        if analyser_type == 'score':
          newItem['label'] = label_result['value']
      else:
        newItem['label'] = ""

      pred_result = next((x for x in predictions if list(x.keys())[0] == str(item["_id"])), None)
      if (pred_result != None):
        newItem['predicted'] = str(list(pred_result.items())[0][1])
      else:
        newItem['predicted'] = ""

      combinedData.append(newItem)
    
    # Make a copy of examples (+ Remove embeddings for images)
    train_data = [(removeItemEmbeddings(copy.deepcopy(item1)) if "image" in analyser_format else copy.deepcopy(item1)) for item1 in dataset if item1['_id'] in trained_example_ids]

    # remove items without predictions
    test_data = [item3 for item3 in combinedData if (len(str(item3["predicted"])) > 0) and (len(str(item3["label"])) > 0)]
    # get unlabelled test data
    unlabelled_test_data = [item3 for item3 in combinedData if (len(str(item3["predicted"])) > 0) and (len(str(item3["label"])) == 0)]

    if wandb_logging:
      train_data_table = wandb.Table(dataframe=pd.DataFrame(train_data),dtype=AnyType)
      print("train data table created")
      print(len(train_data))
      test_data_table = wandb.Table(dataframe=pd.DataFrame(test_data),dtype=AnyType)
      print("test data table created")
      print(len(test_data))

      if not isBaseline:
        if analyser_type == "text":
          wandb.log({"examples": train_data_table})
          wandb.log({"test_sample": test_data_table})
        wandb.log({"dataset_length": len(dataset)})

    y_true = []
    y_pred = []

    if (len(test_data) > 0):

      for item in test_data:

        pred = item['predicted']
        label = item['label']

        if "content_filter" in pred:
          continue
        # Handle pred
        if analyser_type == 'binary':
          if "positive" in pred: 
            y_pred.append(1)
          elif "negative" in pred:
            y_pred.append(0)
        elif analyser_type == 'score':
          y_pred.append(float(pred))
        else:
          raise Exception("Compute Accuracy Error - Invalid predictions in array")

        # Handle label
        if analyser_type == 'binary':
          if label == "positive": 
            y_true.append(1)
          elif label == "negative":
            y_true.append(0)
        elif analyser_type == 'score':
          y_true.append(float(label))
        else:
          raise Exception("Compute Accuracy Error - Invalid labels in array")

      y_true = np.array(y_true)
      y_pred = np.array(y_pred)

      print(y_true)
      print(y_pred)

      num_correct = np.sum(y_true==y_pred)

    else:
      raise Exception("Unable to calculate accuracy due to lack of labelled test data. Please label at least one item for testing.")
    
    if analyser_type == 'binary':
      if (len(y_true) > 0) and (len(y_pred) > 0):
        accuracy = num_correct/len(y_true)

        if (not isBaseline) and wandb_logging:
          if ((1 in y_true) or ("1" in y_true)):
            precision, recall, f1, support = precision_recall_fscore_support(y_true, y_pred, average='binary',labels=np.unique(y_pred))
            wandb.log({'overall_f1': f1, 'precision':precision,'recall':recall, 'support':len(y_true)})

          wandb.log({"accuracy": accuracy}, commit=True)
          end_logging()

        return str(accuracy), unlabelled_test_data

      else: 
        raise Exception("Unable to calculate accuracy due to lack of positively labelled test data. Please provide at least one positive labelled example")
      
    if analyser_type == 'score':
      if (len(y_true) > 0) and (len(y_pred) > 0):
        accuracy = num_correct/len(y_true)

        num_close = []
        for i in range(len(y_true)):
          if int(y_pred[i]-1) <= int(y_true[i]) <= int(y_pred[i]+1):
            num_close.append(True)
          else:
            num_close.append(False)
        num_close = np.sum(num_close)
          
        accuracy_close = num_close/len(y_true)

        mae = mean_absolute_error(y_true, y_pred)
        rmes = root_mean_squared_error(y_true, y_pred)

        if (not isBaseline) and wandb_logging:
          wandb.log({"accuracy": accuracy, 'within_1': accuracy_close, 'mae':mae,'rmes':rmes}, commit=True)
          end_logging()

        return str(accuracy_close), unlabelled_test_data
      
      else:
        raise Exception('error in compute accuracy')
    
  except Exception as e:
    print("Exception in compute_accuracy")
    print(e)
    print(traceback.format_exc())


def removeItemEmbeddings(item):
  image_content_obj = next((x for x in item["content"] if x['content_type'] == 'image'), None)
  image_content_obj['content_value']["embeddings"] = []
  return item