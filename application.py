import os
import requests

from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("submit user")
def vote(data):
    user = data["user"]
    emit("announce user", {"user": user}, broadcast=True)

@socketio.on("submit channel")
def channel(data):
    channel = data["channel"]
    emit("announce channel", {"channel": channel}, broadcast=True)

@socketio.on("submit msg")
def msg(data):
    msg = data["msg"]
    channel = data["channel"]
    time = data["time"]
    user = data["user"]
    emit("announce msg", {"msg": msg, "channel": channel, "time": time, "user":user}, broadcast=True)


