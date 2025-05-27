from flask import Flask, jsonify, request, render_template_string
import json
import os
from db import get_latest_events
import paho.mqtt.client as mqtt
import threading
import sys
import signal

app = Flask(__name__)

def test_mqtt_connection(host, port, username, password):
    result = {"success": False, "message": ""}
    
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            result["success"] = True
            result["message"] = "Connected successfully!"
        else:
            result["message"] = f"Failed to connect with code: {rc}"
        client.disconnect()
    
    try:
        client = mqtt.Client()
        if username:
            client.username_pw_set(username, password)
        client.on_connect = on_connect
        client.connect(host, port)
        client.loop_start()
        # Wait for connection result
        for _ in range(10):  # 5 seconds timeout
            if result["message"]:
                break
            threading.Event().wait(0.5)
        client.loop_stop()
    except Exception as e:
        result["message"] = f"Connection error: {str(e)}"
    
    return result

def restart_application():
    # Send SIGTERM to the current process
    os.kill(os.getpid(), signal.SIGTERM)

@app.route('/events')
def events():
    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Events - Frigate AI Filter</title>
            <style>
                :root {
                    --bg-color: #1a1a1a;
                    --text-color: #ffffff;
                    --accent-color: #2196F3;
                    --secondary-bg: #2d2d2d;
                    --border-color: #404040;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: var(--bg-color);
                    color: var(--text-color);
                }
                
                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                nav {
                    background-color: var(--secondary-bg);
                    padding: 1rem;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid var(--border-color);
                }
                
                nav a {
                    color: var(--text-color);
                    text-decoration: none;
                    margin-right: 20px;
                    padding: 5px 10px;
                    border-radius: 4px;
                }
                
                nav a:hover {
                    background-color: var(--accent-color);
                }
                
                h1 {
                    color: var(--text-color);
                    margin-bottom: 1.5rem;
                }

                .table-container {
                    overflow-x: auto;
                    background-color: var(--secondary-bg);
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }

                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid var(--border-color);
                }

                th {
                    background-color: var(--bg-color);
                    color: var(--accent-color);
                    font-weight: 600;
                    position: sticky;
                    top: 0;
                }

                tr:hover {
                    background-color: #363636;
                }

                .json-cell {
                    max-width: 300px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .json-cell:hover {
                    white-space: normal;
                    overflow: visible;
                    position: relative;
                    z-index: 1;
                    background-color: var(--secondary-bg);
                }

                .full-json-cell {
                    max-width: 400px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-family: monospace;
                    font-size: 0.8rem;
                }

                .full-json-cell:hover {
                    white-space: pre-wrap;
                    overflow: visible;
                    position: relative;
                    z-index: 1;
                    background-color: var(--secondary-bg);
                    padding: 1rem;
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .boolean-true {
                    color: #4CAF50;
                }

                .boolean-false {
                    color: #f44336;
                }

                .timestamp {
                    color: #888;
                    font-size: 0.9em;
                }
            </style>
        </head>
        <body>
            <nav>
                <a href="/events">Events</a>
                <a href="/settings">Settings</a>
            </nav>
            <div class="container">
                <h1>Events Database</h1>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Label</th>
                                <th>Sub Label</th>
                                <th>Camera</th>
                                <th>Zone</th>
                                <th>Entered Zones</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Has Snapshot</th>
                                <th>Has Clip</th>
                                <th>Score</th>
                                <th>Top Score</th>
                                <th>False Positive</th>
                                <th>Box</th>
                                <th>Area</th>
                                <th>Ratio</th>
                                <th>Region</th>
                                <th>Stationary</th>
                                <th>Motionless Count</th>
                                <th>Position Changes</th>
                                <th>Attributes</th>
                                <th>Created At</th>
                                <th>Full JSON</th>
                            </tr>
                        </thead>
                        <tbody>
                            {% for event in events %}
                            <tr>
                                <td>{{ event[0] }}</td>
                                <td>{{ event[1] }}</td>
                                <td>{{ event[2] }}</td>
                                <td>{{ event[3] }}</td>
                                <td>{{ event[4] }}</td>
                                <td>{{ event[5] }}</td>
                                <td class="timestamp">{{ event[6] }}</td>
                                <td class="timestamp">{{ event[7] }}</td>
                                <td class="boolean-{{ 'true' if event[8] else 'false' }}">{{ 'Yes' if event[8] else 'No' }}</td>
                                <td class="boolean-{{ 'true' if event[9] else 'false' }}">{{ 'Yes' if event[9] else 'No' }}</td>
                                <td>{{ "%.2f"|format(event[10]) }}</td>
                                <td>{{ "%.2f"|format(event[11]) }}</td>
                                <td class="boolean-{{ 'true' if event[12] else 'false' }}">{{ 'Yes' if event[12] else 'No' }}</td>
                                <td class="json-cell">{{ event[13] }}</td>
                                <td>{{ event[14] }}</td>
                                <td>{{ "%.2f"|format(event[15]) }}</td>
                                <td class="json-cell">{{ event[16] }}</td>
                                <td class="boolean-{{ 'true' if event[17] else 'false' }}">{{ 'Yes' if event[17] else 'No' }}</td>
                                <td>{{ event[18] }}</td>
                                <td>{{ event[19] }}</td>
                                <td class="json-cell">{{ event[20] }}</td>
                                <td class="timestamp">{{ event[21] }}</td>
                                <td class="full-json-cell">{{ event | tojson(indent=2) }}</td>
                            </tr>
                            {% endfor %}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
    ''', events=get_latest_events())

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    config_path = os.environ.get("MQTT_CONFIG", "config/mqtt_config.json")
    with open(config_path, 'r') as f:
        mqtt_config = json.load(f)

    if request.method == 'POST':
        if 'test_connection' in request.form:
            test_result = test_mqtt_connection(
                request.form['host'],
                int(request.form['port']),
                request.form['username'],
                request.form['password']
            )
            return jsonify(test_result)
        
        mqtt_config['host'] = request.form['host']
        mqtt_config['port'] = int(request.form['port'])
        mqtt_config['username'] = request.form['username']
        mqtt_config['password'] = request.form['password']
        mqtt_config['topic'] = request.form['topic']

        with open(config_path, 'w') as f:
            json.dump(mqtt_config, f, indent=4)

        return render_template_string('''
            <!DOCTYPE html>
            <html>
            <head>
                <title>Settings Updated</title>
                <script>
                    alert("Settings saved! The application will now restart to apply the changes.");
                    window.location.href = "/settings";
                </script>
            </head>
            <body>
                <p>Settings saved! The application will now restart to apply the changes.</p>
            </body>
            </html>
        ''')

    return render_template_string('''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Settings - Frigate AI Filter</title>
            <style>
                :root {
                    --bg-color: #1a1a1a;
                    --text-color: #ffffff;
                    --accent-color: #2196F3;
                    --secondary-bg: #2d2d2d;
                    --border-color: #404040;
                    --input-bg: #333333;
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: var(--bg-color);
                    color: var(--text-color);
                }
                
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                nav {
                    background-color: var(--secondary-bg);
                    padding: 1rem;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid var(--border-color);
                }
                
                nav a {
                    color: var(--text-color);
                    text-decoration: none;
                    margin-right: 20px;
                    padding: 5px 10px;
                    border-radius: 4px;
                }
                
                nav a:hover {
                    background-color: var(--accent-color);
                }
                
                h1 {
                    color: var(--text-color);
                    margin-bottom: 1.5rem;
                }
                
                form {
                    background-color: var(--secondary-bg);
                    padding: 2rem;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                }
                
                .form-group {
                    margin-bottom: 1.5rem;
                }
                
                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: var(--text-color);
                }
                
                input {
                    width: 100%;
                    padding: 0.75rem;
                    background-color: var(--input-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    color: var(--text-color);
                    font-size: 1rem;
                }
                
                input:focus {
                    outline: none;
                    border-color: var(--accent-color);
                }
                
                button {
                    background-color: var(--accent-color);
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-right: 1rem;
                }
                
                button:hover {
                    background-color: #1976D2;
                }
                
                #testResult {
                    margin-top: 1rem;
                    padding: 1rem;
                    border-radius: 4px;
                }
                
                .success {
                    background-color: #4CAF50;
                    color: white;
                }
                
                .error {
                    background-color: #f44336;
                    color: white;
                }
            </style>
        </head>
        <body>
            <nav>
                <a href="/events">Events</a>
                <a href="/settings">Settings</a>
            </nav>
            <div class="container">
                <h1>MQTT Settings</h1>
                <form method="post" id="settingsForm">
                    <div class="form-group">
                        <label for="host">Host:</label>
                        <input type="text" id="host" name="host" value="{{ mqtt_config.host }}" required>
                    </div>
                    <div class="form-group">
                        <label for="port">Port:</label>
                        <input type="number" id="port" name="port" value="{{ mqtt_config.port }}" required>
                    </div>
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" value="{{ mqtt_config.username }}">
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" value="{{ mqtt_config.password }}">
                    </div>
                    <div class="form-group">
                        <label for="topic">Topic:</label>
                        <input type="text" id="topic" name="topic" value="{{ mqtt_config.topic }}" required>
                    </div>
                    <button type="button" onclick="testConnection()">Test Connection</button>
                    <button type="submit">Save Settings</button>
                </form>
                <div id="testResult"></div>
            </div>

            <script>
                function testConnection() {
                    const form = document.getElementById('settingsForm');
                    const formData = new FormData(form);
                    formData.append('test_connection', 'true');
                    
                    fetch('/settings', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        const resultDiv = document.getElementById('testResult');
                        resultDiv.textContent = data.message;
                        resultDiv.className = data.success ? 'success' : 'error';
                    });
                }
            </script>
        </body>
        </html>
    ''', mqtt_config=mqtt_config)

def start_viewer():
    app.run(host='0.0.0.0', port=8080)

if __name__ == '__main__':
    start_viewer() 