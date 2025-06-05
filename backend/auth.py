from flask import Blueprint, render_template, request, session, redirect, url_for
from database import get_db, User
import pyotp
import secrets
from io import BytesIO
from captcha.image import ImageCaptcha
import base64

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        captcha = request.form.get('captcha')
        
        if not verify_captcha(session.get('captcha_text', ''), captcha):
            return render_template('login.html', error='Invalid CAPTCHA')
        
        db = get_db()
        user = db.query(User).filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            return render_template('login.html', error='Invalid credentials')
        
        session['user_id'] = user.id
        
        if user.totp_secret:
            return redirect(url_for('auth.totp_verify'))
        
        return redirect(url_for('index'))
    
    captcha_text, captcha_image = generate_captcha()
    session['captcha_text'] = captcha_text
    return render_template('login.html', captcha_image=captcha_image)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        captcha = request.form.get('captcha')
        
        if not verify_captcha(session.get('captcha_text', ''), captcha):
            return render_template('register.html', error='Invalid CAPTCHA')
        
        db = get_db()
        if db.query(User).filter_by(username=username).first():
            return render_template('register.html', error='Username taken')
        
        new_user = User(username=username)
        new_user.set_password(password)
        new_user.balance = 1000  # Starting balance
        
        db.add(new_user)
        db.commit()
        
        session['user_id'] = new_user.id
        return redirect(url_for('index'))
    
    captcha_text, captcha_image = generate_captcha()
    session['captcha_text'] = captcha_text
    return render_template('register.html', captcha_image=captcha_image)

@auth_bp.route('/totp/setup')
def totp_setup():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    db = get_db()
    user = db.query(User).filter_by(id=session['user_id']).first()
    
    if user.totp_secret:
        return redirect(url_for('index'))
    
    secret = pyotp.random_base32()
    session['totp_secret'] = secret
    
    uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user.username,
        issuer_name='Roulette Site'
    )
    
    return render_template('totp_setup.html', totp_uri=uri, secret=secret)

@auth_bp.route('/totp/verify', methods=['GET', 'POST'])
def totp_verify():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    
    if request.method == 'POST':
        token = request.form.get('token')
        
        db = get_db()
        user = db.query(User).filter_by(id=session['user_id']).first()
        
        totp = pyotp.TOTP(user.totp_secret or session.get('totp_secret', ''))
        
        if totp.verify(token):
            if 'totp_secret' in session:
                user.totp_secret = session['totp_secret']
                db.commit()
                session.pop('totp_secret')
            
            return redirect(url_for('index'))
        
        return render_template('totp_verify.html', error='Invalid token')
    
    return render_template('totp_verify.html')

def generate_captcha():
    text = ''.join([secrets.choice('ABCDEFGHJKLMNPQRSTUVWXYZ23456789') for _ in range(6)])
    image = ImageCaptcha().generate(text)
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return text, f"data:image/png;base64,{image_data}"

def verify_captcha(original, provided):
    return original.lower() == provided.lower()