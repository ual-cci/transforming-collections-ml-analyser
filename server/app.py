from api import create_app
from gevent.pywsgi import WSGIServer
import argparse


def app(model="openai",wandb_toggle=False,port=8080):
    http_server = WSGIServer(("0.0.0.0", port), create_app(model,wandb_toggle))
    http_server.serve_forever() 

parser = argparse.ArgumentParser()
parser.add_argument("-m", "--model", action="store", default="openai")
parser.add_argument("-l", "--log_wandb", action="store", default=False)
parser.add_argument("-p", "--port", action="store", default=8080)
parser.add_argument("-r", "--reload", action="store", default=True)
args, unknown = parser.parse_known_args()
model = args.model

if __name__ == '__main__':
    port = int(args.port)
    wandb = str(args.log_wandb).lower() == "true"
    reload = str(args.reload).lower() == "true"

    app = create_app(args.model,wandb)
    app.run(debug=True, port=port, use_reloader=reload)
