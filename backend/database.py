from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    balance = db.Column(db.Float, default=1000.0)
    totp_secret = db.Column(db.String(32))
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Bet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    selected_cells = db.Column(db.String(20), nullable=False)
    winning_cell = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    prize = db.Column(db.Float, nullable=False)
    game_hash = db.Column(db.String(64), nullable=False)
    timestamp = db.Column(db.DateTime, server_default=db.func.now())
    
    user = db.relationship('User', backref=db.backref('bets', lazy=True))

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()

def get_db():
    return db.session