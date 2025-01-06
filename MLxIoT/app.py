from flask import Flask, render_template
import pickle
import firebase_admin
from firebase_admin import credentials, db
import numpy as np
import threading
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load model and Firebase initialization
model_path = 'KNN_Model_Fire_vx.pkl'
cred_path = "iot-kebakaranhutan-firebase-adminsdk-qz2qj-60ad02f79e.json"

try:
    with open(model_path, 'rb') as file:
        model = pickle.load(file)
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    raise

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://iot-kebakaranhutan-default-rtdb.asia-southeast1.firebasedatabase.app/'
    })
    logger.info("Firebase initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Firebase: {e}")
    raise

sensor_refs = {
    'temp': db.reference('/sensor_data/temp'),
    'humidity': db.reference('/sensor_data/humidity'),
    'soil_moisture': db.reference('/sensor_data/soil_moisture')
}
output_ref = db.reference('/predict')

previous_data = None

def fetch_sensor_data():
    """Fetch sensor data from Firebase."""
    try:
        data = {}
        for key, ref in sensor_refs.items():
            value = ref.get()
            if value is not None:
                try:
                    data[key] = float(value)
                except ValueError:
                    logger.warning(f"Invalid value for {key}: {value}")
                    data[key] = 0
            else:
                logger.warning(f"No value found for {key}")
                data[key] = 0
        
        return np.array([data['temp'], data['humidity']])
    except Exception as e:
        logger.error(f"Error fetching sensor data: {e}")
        return np.array([0, 0])

def predict_and_update(sensor_data):
    """Make a prediction and update Firebase if needed."""
    try:
        if np.any(sensor_data != 0):  # Only predict if we have some non-zero values
            prediction = model.predict([sensor_data])[0]
            output_ref.set({'prediction': int(prediction)})
            logger.info(f"Prediction updated: {prediction} for data {sensor_data}")
        else:
            logger.warning("Skipping prediction due to zero values")
    except Exception as e:
        logger.error(f"Error during prediction: {e}")

def monitor_sensor_changes():
    """Continuously monitor sensor data and trigger predictions."""
    global previous_data
    while True:
        try:
            current_data = fetch_sensor_data()
            if not np.array_equal(current_data, previous_data):
                logger.info(f"New sensor data detected: {current_data}")
                predict_and_update(current_data)
                previous_data = current_data
            time.sleep(1)  # Reduced delay for more responsive updates
        except Exception as e:
            logger.error(f"Error in monitoring loop: {e}")
            time.sleep(5)  # Wait longer if there's an error

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    threading.Thread(target=monitor_sensor_changes, daemon=True).start()
    app.run(debug=True)