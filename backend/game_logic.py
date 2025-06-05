import hashlib
import secrets

def generate_game_hash(selected_cells, winning_cell, amount):
    salt = secrets.token_hex(16)
    cells_str = ','.join(map(str, sorted(selected_cells)))
    data = f"{cells_str}:{winning_cell}:{amount}:{salt}"
    return hashlib.sha256(data.encode()).hexdigest() + salt

def verify_game_hash(selected_cells, winning_cell, amount, game_hash):
    if len(game_hash) < 64:
        return False
    
    hash_part = game_hash[:64]
    salt = game_hash[64:]
    
    cells_str = ','.join(map(str, sorted(selected_cells)))
    data = f"{cells_str}:{winning_cell}:{amount}:{salt}"
    computed_hash = hashlib.sha256(data.encode()).hexdigest()
    
    return computed_hash == hash_part