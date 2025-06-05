from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from auth import auth_bp, generate_captcha, verify_captcha
from database import init_db, get_db, User, Bet
from game_logic import generate_game_hash, verify_game_hash
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///roulette.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

init_db(app)
app.register_blueprint(auth_bp)

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    return render_template('index.html')

@app.route('/api/place_bet', methods=['POST'])
def place_bet():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401
    
    data = request.get_json()
    selected_cells = data.get('cells', [])
    bet_amount = data.get('amount', 0)
    
    if len(selected_cells) > 3 or len(selected_cells) == 0:
        return jsonify({'error': 'Select 1-3 cells'}), 400
    
    db = get_db()
    user = db.query(User).filter_by(id=session['user_id']).first()
    
    if user.balance < bet_amount:
        return jsonify({'error': 'Insufficient balance'}), 400
    
    # Game logic
    winning_cell = secrets.randbelow(99) + 1
    is_winner = winning_cell in selected_cells
    prize = bet_amount * 99 / len(selected_cells) if is_winner else 0
    
    # Update user balance
    user.balance += prize - bet_amount
    
    # Record bet
    new_bet = Bet(
        user_id=user.id,
        selected_cells=','.join(map(str, selected_cells)),
        winning_cell=winning_cell,
        amount=bet_amount,
        prize=prize,
        game_hash=generate_game_hash(selected_cells, winning_cell, bet_amount)
    )
    db.add(new_bet)
    db.commit()
    
    return jsonify({
        'winning_cell': winning_cell,
        'prize': prize,
        'is_winner': is_winner,
        'new_balance': user.balance,
        'game_hash': new_bet.game_hash
    })

@app.route('/api/verify_hash', methods=['POST'])
def verify_hash():
    data = request.get_json()
    is_valid = verify_game_hash(
        data.get('selected_cells', []),
        data.get('winning_cell', 0),
        data.get('amount', 0),
        data.get('hash', '')
    )
    return jsonify({'valid': is_valid})

if __name__ == '__main__':
    app.run(debug=True)