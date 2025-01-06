// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDi8D29ieh8D99GqxN6E0KtectCEHO8sWo",
  authDomain: "iot-kebakaranhutan.firebaseapp.com",
  databaseURL:"https://iot-kebakaranhutan-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iot-kebakaranhutan",
  storageBucket: "iot-kebakaranhutan.firebasestorage.app",
  messagingSenderId: "237810608061",
  appId: "1:237810608061:web:62b88ae26c294433e314d4",
  measurementId: "G-TL6JJYVGS2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// References to Firebase Database
const sensorDataRef = ref(database, "sensor_data");

// References to HTML elements
const temperatureElement = document.querySelector("#temperatureGauge .value");
const humidityElement = document.querySelector("#humidityGauge .value");
const soilMoistureElement = document.querySelector("#soilMoistureGauge .value");
const smokeStatusElement = document.getElementById("smokeStatus");
const smokeImageElement = document.getElementById("smokeImage");

// Canvas Elements for Gauges
const temperatureGaugeCanvas = document.getElementById(
  "temperatureGaugeCanvas"
);
const humidityGaugeCanvas = document.getElementById("humidityGaugeCanvas");
const soilMoistureGaugeCanvas = document.getElementById(
  "soilMoistureGaugeCanvas"
);

// Canvas Elements for Charts
const temperatureChartCanvas = document.getElementById("temperatureChart");
const humidityChartCanvas = document.getElementById("humidityChart");
const soilMoistureChartCanvas = document.getElementById("soilMoistureChart");

// Function to update gauge
function updateGauge(gaugeCanvas, value, maxValue) {
  const ctx = gaugeCanvas.getContext("2d");
  if (gaugeCanvas.chart) {
    gaugeCanvas.chart.destroy(); // Destroy old instance
  }
  gaugeCanvas.chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [value, maxValue - value],
          backgroundColor: ["#FF5733", "#E0E0E0"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      circumference: 180,
      rotation: -90,
      cutout: "80%",
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
      },
    },
  });
}

// Initialize charts
const temperatureChart = new Chart(temperatureChartCanvas, {
  type: "line",
  data: {
    labels: [], // Time labels
    datasets: [
      {
        label: "Suhu (°C)",
        data: [],
        borderColor: "#FF5733",
        tension: 0.3,
      },
    ],
  },
  options: { responsive: true, maintainAspectRatio: false },
});

const humidityChart = new Chart(humidityChartCanvas, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Kelembaban Udara (%)",
        data: [],
        borderColor: "#33C3FF",
        tension: 0.3,
      },
    ],
  },
  options: { responsive: true, maintainAspectRatio: false },
});

const soilMoistureChart = new Chart(soilMoistureChartCanvas, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Kelembaban Tanah (%)",
        data: [],
        borderColor: "#33FF57",
        tension: 0.3,
      },
    ],
  },
  options: { responsive: true, maintainAspectRatio: false },
});

// Listen for changes in Firebase Realtime Database
onValue(sensorDataRef, (snapshot) => {
  const data = snapshot.val();
  console.log("Data from Firebase:", data);

  if (data) {
    // Update HTML values
    temperatureElement.textContent = `${data.temp || 0} °C`;
    humidityElement.textContent = `${data.humidity || 0} %`;
    soilMoistureElement.textContent = `${data.soil_moisture || 0} %`;
    smokeStatusElement.textContent =
      data.smoke === "Yes" ? "Terdeteksi!" : "Tidak Ada Asap";

    // Update smoke image
    smokeImageElement.src = data.smoke === "Yes" ? "asap.png" : "no_asap.png";

    // Update Gauges
    updateGauge(temperatureGaugeCanvas, data.temp || 0, 100);
    updateGauge(humidityGaugeCanvas, data.humidity || 0, 100);
    updateGauge(soilMoistureGaugeCanvas, data.soil_moisture || 0, 100);

    // Update Charts
    const currentTime = new Date().toLocaleTimeString();

    if (temperatureChart.data.labels.length > 10) {
      temperatureChart.data.labels.shift();
      temperatureChart.data.datasets[0].data.shift();
    }
    temperatureChart.data.labels.push(currentTime);
    temperatureChart.data.datasets[0].data.push(data.temp || 0);
    temperatureChart.update();

    if (humidityChart.data.labels.length > 10) {
      humidityChart.data.labels.shift();
      humidityChart.data.datasets[0].data.shift();
    }
    humidityChart.data.labels.push(currentTime);
    humidityChart.data.datasets[0].data.push(data.humidity || 0);
    humidityChart.update();

    if (soilMoistureChart.data.labels.length > 10) {
      soilMoistureChart.data.labels.shift();
      soilMoistureChart.data.datasets[0].data.shift();
    }
    soilMoistureChart.data.labels.push(currentTime);
    soilMoistureChart.data.datasets[0].data.push(data.soil_moisture || 0);
    soilMoistureChart.update();
  } else {
    console.error("No data available in Firebase!");
  }
});
