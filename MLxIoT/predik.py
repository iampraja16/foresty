import pickle
import firebase_admin
from firebase_admin import credentials, db
import numpy as np
import time

# Mount Google Drive and load the model
file_path = 'E:\MLxIoT\KNN_Model_Fire.pkl'
cred_path = "E:\MLxIoT\iot-kebakaranhutan-firebase-adminsdk-qz2qj-9f79a86cab (1).json"

# Load the pickle model
with open(file_path, 'rb') as file:
    model = pickle.load(file)
    print("Model loaded successfully!")

# Initialize Firebase
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://iot-kebakaranhutan-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

# References to Firebase database
sensor_refs = {
    'temp': db.reference('/sensor_data/temp'),
    'humidity': db.reference('/sensor_data/humidity'),
    'soil_moisture': db.reference('/sensor_data/soil_moisture')
}
output_ref = db.reference('/predict')

def fetch_sensor_data():
    """Fetches sensor data from Firebase."""
    try:
        data = {key: float(ref.get() or 0) for key, ref in sensor_refs.items()}
        return np.array([data['temp'], data['humidity'], data['soil_moisture']]).reshape(1, -1)
    except Exception as e:
        print(f"Error fetching sensor data: {e}")
        return None

def predict_and_update():
    """Performs prediction and updates Firebase."""
    input_data = fetch_sensor_data()
    if input_data is not None:
        y_pred = model.predict(input_data)
        output_ref.set({'predictions': y_pred.tolist()})
        print(f"Prediction updated: {y_pred}")
    else:
        print("Skipping prediction due to invalid input data.")

# Real-time prediction loop
print("Starting real-time prediction...")
while True:
    predict_and_update()
