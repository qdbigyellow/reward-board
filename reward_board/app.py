# reward_board/app.py
from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
import calendar
import os
import json

app = Flask(__name__)

# Path to the storage file
STORAGE_FILE = os.path.join(os.path.dirname(__file__), 'data', 'board_state.json')

def ensure_data_dir():
    """Ensure the data directory exists"""
    data_dir = os.path.dirname(STORAGE_FILE)
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

def get_default_state():
    """Create a default empty board state"""
    today = datetime.now()
    return {
        "last_updated": today.strftime("%Y-%m-%d %H:%M:%S"),
        "date": today.strftime("%d/%m/%Y"),
        "week": today.isocalendar()[1],
        "rows": []
    }

def save_state(state):
    """Save the board state to storage file"""
    ensure_data_dir()
    with open(STORAGE_FILE, 'w') as f:
        json.dump(state, f)

def load_state():
    """Load the board state from storage file"""
    ensure_data_dir()
    if os.path.exists(STORAGE_FILE):
        try:
            with open(STORAGE_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            # If file is corrupted or missing, return default state
            return get_default_state()
    else:
        # If file doesn't exist, create default state
        default_state = get_default_state()
        save_state(default_state)
        return default_state

@app.route('/')
def index():
    # Load state from storage
    state = load_state()
    
    # Return the rendered template with state data
    return render_template('index.html', 
                           date=state["date"], 
                           week=state["week"],
                           board_state=json.dumps(state))

@app.route('/save_state', methods=['POST'])
def update_state():
    """Endpoint to save the current board state"""
    data = request.json
    save_state(data)
    return jsonify({"status": "success"})

@app.route('/regenerate', methods=['POST'])
def regenerate():
    """Regenerate a new empty board"""
    # Create new default state
    new_state = get_default_state()
    save_state(new_state)
    return jsonify(new_state)

def main():
    app.run(host='0.0.0.0', port=5000)

if __name__ == '__main__':
    main()