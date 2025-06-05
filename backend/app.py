from flask import send_from_directory

# Добавьте этот роут в app.py
@app.route('/')
def serve_frontend():
    return send_from_directory('../frontend', 'index.html')

# Для статических файлов
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('../frontend', path)
from flask import Flask, request, jsonify
import random
import hashlib
from datetime import datetime

app = Flask(__name__)

# Пример данных пользователя (в реальном проекте используйте БД)
users = {
    "user1": {"balance": 1000, "bets": []}
}

@app.route('/')
def home():
    return "Roulette App is Running! 🎰"

@app.route('/bet', methods=['POST'])
def place_bet():
    data = request.json
    user = data.get("user")
    bet_amount = data.get("amount")
    selected_cells = data.get("cells", [])

    if not user or user not in users:
        return jsonify({"error": "User not found"}), 404

    if users[user]["balance"] < bet_amount:
        return jsonify({"error": "Not enough balance"}), 400

    # Симуляция рулетки (выигрышная ячейка)
    winning_cell = random.randint(1, 99)
    is_winner = winning_cell in selected_cells
    prize = bet_amount * 99 / len(selected_cells) if is_winner else 0

    # Обновляем баланс
    users[user]["balance"] += prize - bet_amount

    # Сохраняем ставку
    bet_hash = hashlib.sha256(f"{selected_cells}:{winning_cell}:{datetime.now()}".encode()).hexdigest()
    users[user]["bets"].append({
        "selected": selected_cells,
        "winning": winning_cell,
        "prize": prize,
        "hash": bet_hash
    })

    return jsonify({
        "winning_cell": winning_cell,
        "prize": prize,
        "balance": users[user]["balance"],
        "hash": bet_hash
    })

@app.route('/balance/<user>')
def get_balance(user):
    if user not in users:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"balance": users[user]["balance"]})

if __name__ == '__main__':
    app.run()
