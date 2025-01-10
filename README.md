# UAL TaNC ML App

An interactive ML-driven app designed to assist people working in the GLAM sector with improving their work and processes. Including efforts to decolonise collections and works.

## Usage
Our version of the website is currently active at https://collectionstransforming.com/

## Technologies
- Python (3.9)
- NextJS (Using Pages router)
- React
- Conda (23.1.0)
- venv
- pip
- Flask
- MongoDB

See server/requirements.txt and client/package.json for a full set of requirements.

## Application Setup
### 1. Install Homebrew
#### Recommended Instructions:
- Mac install: https://docs.brew.sh/Installation
- Linux install: https://docs.brew.sh/Homebrew-on-Linux
### Alternative Instructions:
If you have failed at installing the reccomended way because you don't have admin rights, you can install homebrew in the following way:
* Open Terminal
* Navigate to your user directory (If you aren't there already)
* Run `git clone https://github.com/Homebrew/brew homebrew`
* Then, run the following commands:
``eval "$(homebrew/bin/brew shellenv)"
brew update --force --quiet
chmod -R go-w "$(brew --prefix)/share/zsh"``

### 2. Install pyenv, nvm
`brew install pyenv`
### 3. Install miniconda
`brew install miniconda`
### 4. Install conda env from environment.yml 
`conda env create --name tanc-ml-app --file=environment.yml`
### 5. Activate conda env 
`conda activate tanc-ml-app`
### 6. Install local Mongodb 
#### Instructions
Ubuntu:
```
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \

   <!-- sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor -->
```
Mac:
```
brew tap mongodb/brew
brew update
brew install mongodb-community@7.0
```
### 7. Start MongoDB service
`brew services start mongodb-community@7.0`

### 8. Create virtual environment from requirements.txt
1. navigate to server folder
2. Create a new virtual environment: `python3 -m venv venv`
3. Activate virtual environment: `source venv/bin/activate`
4. Install requirements from requirements.txt: `pip install -r requirements.txt`


## Create supporting services & APIs
### Authentication: Auth0
#### Use an existing Auth0 Tenant
If you already have an Auth0 instance for your organisation please skip to step 3 below
#### Set up a new Auth0 Tenant
* Step 1: Create an account on Auth0 (https://auth0.com/signup)
* Step 2: Create a new tenant
* Step 3: Create a new application
* Step 4: Add relevant URLs to the application settings on Auth0
* Step 5: Add your application's credentials to the .env files in the client folder (See [Client Setup](#client-setup) below for more details)
* Step 6: Test access on the app (locally and on your host server)

### AI services

You can choose between three different AI model sources to run the app. First, create an .env file in the server folder and follow env.template.

| Model source                                                                                 | OpenAI                          | Azure OpenAI Service                                                                                                                              | Hugging Face                                                                                                                                                |
|----------------------------------------------------------------------------------------------|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Remote (API) or local (model downloaded to your machine, you don't send your data to an API) | Remote                          | Remote                                                                                                                                            | Local                                                                                                                                                       |
| Cost                                                                                         | https://openai.com/api/pricing/ | https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/                                                              | Free                                                                                                                                                        |
| Minimum requirements                                                                         | CPU                             | CPU                                                                                                                                               | GPU, 24GB RAM (You can try to run the text model on CPU but it can take about 30 minutes to run inference on 25 text samples. It does not work for images.) |
| Model                                                                                        | GPT models (we used gpt4-o)     | GPT models (we used GPT4 Turbo for text and GPT4 vision-preview for image)                                                                        | meta-llama/Llama-3.2-11B-Vision                                                                                                                             |
| Content filter                                                                               | No                              | Yes (It is quick to flag images in particular, even when you adjust the content filter settings. It is not possible to turn it off at this time.) | No                                                                                                                                                          |


#### Azure OpenAI Service
At https://portal.azure.com:
* Step 1: Set up necessary subscription IDs
* Step 2: Request access to the Azure OpenAI service
* Step 3: Set up AI endpoints via Azure AI Studio. You can set up separate image and text models in our app.
* Step 4: Apply for increased token allowance (Optional)
* Step 5: Apply for control over content filtering (Optional)

In the project folder:
* Step 6: Copy credentials, model names and API version into .env in server folder

#### OpenAI 
At https://platform.openai.com/:
* Step 1: Create OpenAI Account
* Step 2: Set up billing details

In the project folder:
* Step 3: Copy details (API key and model option) into .env in server folder

#### Local Model (Hugging Face)
At https://huggingface.co/:
* Step 1: Create an account.
* Step 2: Request access for this repository: https://huggingface.co/meta-llama/Llama-3.2-11B-Vision
* Step 3: Once it is approved, create an access token: https://huggingface.co/settings/tokens/new?tokenType=fineGrained (tick all the User Permissions and select 'meta-llama/Llama-3.2-11B-Vision-Instruct' in the Repositories Permissions section and tick all those permissions).

In the project folder:
* Step 4: Copy the API key into .env in server folder
  

## Local Deployment

### Client Setup
1. Navigate to client folder
2. Activate conda environment `conda activate tanc-ml-app`
3. Add .env.local file with relevant credentials (eg. Auth0). See env.local.template for reference.

At a minimum, you will need to fill in:
* .env.local (For sensitive data such as API keys.)
* .env.development (For credentials specific to local development.)
* .env.production (For credentials specific to your production server.)

If you are setting up two versions of the project (for example Azure and OpenAI seperately), you can create further .env files as needed

For example, we have created:
* .env.azure-dev (available via `npm run dev-azure`)
* .env.azure-prod (available via `npm run build-azure`, `npm run start-azure`)
* .env.openai-dev (available via `npm run dev-openai`)
* .env.openai-prod (available via `npm run build-openai`, `npm run start-openai`)

Once you have altered or created any necessary .env files, remember to update references in the package.json file.

3. `npm install`
4. `npm run dev`
5. Check http://localhost:3000

### Server Setup
1. Navigate to server folder
2. Activate virtual environment: `source venv/bin/activate`
3. Run Flask app: `python3 app.py`\
\
Options (you can change the defaults in server/app.py):
* -m or --model : Sets the model source (default: "openai"). Choose between "azure" or "openai" or "huggingface" depending on what you've set up.
* -p or --port : Sets the port (eg. 8000, 8080)
* -l or --log_wandb : Sets whether or not the system will log data to Weights & Biases (true or false, default is false)
   * Note: to fully enable this capabilitity you will first need to add you Weights & Biases credentials to your .env file
* -r or --reload : Sets the server to reload automatically when files are changed. (true or false, default is true)

4. Check http://localhost:8080

## Production Deployment
The following instructions are based on our set up - running two versions of the app from the same codebase

* The OpenAI-driven app will be available at port 3000 and supported by the API service at port 8080
* The Azure-driven app will be available at port 3005 and supported by the API service at port 8085

This two-port approach can be a helpful set up, whether you want to use the same version of the code serviced by different model endpoints, or simply to create seperate production and staging environments on your host server.

### Client Deployment
1. Navigate to client folder
2. Activate conda environment `conda activate tanc-ml-app`

#### For OpenAI:
3. `npm run build-openai`
4. `npm run start-openai`

This will create a folder containing the static website files at client/.next-builds/.next-openai-prod
   
#### For Azure:
3. `npm run build-azure`
4. `npm run start-azure`

This will create a folder containing the static website files at client/.next-builds/.next-azure-prod

To make your own changes, see the package.json file in the client folder

### Server Deployment
1. Navigate to server folder
2. Activate virtual environment
`source venv/bin/activate`
3. Run Gunicorn

When running the following command, you will be running the app directly using the app function in app.py.

The following options are available:

* model : Sets the model source. Choose between "openai" or "azure" depending on what you've set up.
* wandb_toggle : Enables or disables logging directly to Weights & Biases (True or False)

#### For OpenAI:
```
gunicorn -b 0.0.0.0:8080 -k gevent --workers=12 'app:app(model="openai",wandb_toggle=False)' --timeout 600 --preload
```

#### For Azure:
```
gunicorn -b 0.0.0.0:8085 -k gevent --workers=12 'app:app(model="azure",wandb_toggle=False,port=8085)' --timeout 600 --preload
```

## Useful database commands

If you have deployed the app on a server and want to make a dataset public (available to all users) or share it with specific users (you will need access to their Auth0 IDs for that), you can use the following mongosh commands.

#### Start mongosh
```
mongosh
use tanc_database
```

#### Make dataset public
```
db.dataset.updateOne({name:DATASET_NAME},{$set:{"users":[]}})
db.dataset.updateOne({name:DATASET_NAME}, {$unset:{"owner":1}})
```

#### Share dataset
```
db.dataset.updateOne({name:DATASET_NAME},{$set:{"users":[AUTH0_ID_1, AUTH0_ID_2]}})
```

## Research materials

You can find a number of research materials created during the project in the `research-materials` folder.

