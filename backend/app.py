from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return "Roulette App is Running!"
