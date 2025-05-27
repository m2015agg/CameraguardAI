from flask import Flask, jsonify, request, render_template_string
import json
import os
from db import get_latest_events

app = Flask(__name__)

@app.route('/events')
def events():
    return render_template_string('''
        <h1>Events</h1>
        <nav>
            <a href="/events">Events</a> | <a href="/settings">Settings</a>
        </nav>
        <pre>{{ events }}</pre>
    ''', events=json.dumps(get_latest_events(), indent=4))

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    config_path = os.environ.get("MQTT_CONFIG", "config/mqtt_config.json")
    with open(config_path, 'r') as f:
        mqtt_config = json.load(f)

    if request.method == 'POST':
        mqtt_config['host'] = request.form['host']
        mqtt_config['port'] = int(request.form['port'])
        mqtt_config['username'] = request.form['username']
        mqtt_config['password'] = request.form['password']
        mqtt_config['topic'] = request.form['topic']

        with open(config_path, 'w') as f:
            json.dump(mqtt_config, f, indent=4)

        return "Settings updated successfully!"

    return render_template_string('''
        <h1>MQTT Settings</h1>
        <nav>
            <a href="/events">Events</a> | <a href="/settings">Settings</a>
        </nav>
        <form method="post">
            <label for="host">Host:</label>
            <input type="text" id="host" name="host" value="{{ mqtt_config.host }}" required><br>
            <label for="port">Port:</label>
            <input type="number" id="port" name="port" value="{{ mqtt_config.port }}" required><br>
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" value="{{ mqtt_config.username }}" required><br>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" value="{{ mqtt_config.password }}" required><br>
            <label for="topic">Topic:</label>
            <input type="text" id="topic" name="topic" value="{{ mqtt_config.topic }}" required><br>
            <button type="submit">Save Settings</button>
        </form>
    ''', mqtt_config=mqtt_config)

def start_viewer():
    app.run(host='0.0.0.0', port=8080)

if __name__ == '__main__':
    start_viewer() 