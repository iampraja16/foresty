// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDi8D29ieh8D99GqxN6E0KtectCEHO8sWo",
  authDomain: "iot-kebakaranhutan.firebaseapp.com",
  databaseURL: "https://iot-kebakaranhutan-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iot-kebakaranhutan",
  storageBucket: "iot-kebakaranhutan.firebasestorage.app",
  messagingSenderId: "237810608061",
  appId: "1:237810608061:web:62b88ae26c294433e314d4",
  measurementId: "G-TL6JJYVGS2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Paths to sensor data in Firebase
const sensorPath = "/sensor_data";

const data = snapshot.val();

document.addEventListener('DOMContentLoaded', () => {
  const createGauge = (ctx, min, max, value, label) => {
      return new Chart(ctx, {
          type: 'doughnut',
          data: {
              datasets: [
                  {
                      data: [value, max - value],
                      backgroundColor: ['#FF6384', '#E0E0E0'],
                      hoverBackgroundColor: ['#FF6384', '#E0E0E0']
                  }
              ],
              labels: [label, '']
          },
          options: {
              rotation: -90,
              circumference: 180,
              plugins: {
                  tooltip: { enabled: false },
                  legend: { display: false }
              }
          }
      });
  };

  // Inisialisasi gauge
  const temperatureCtx = document.querySelector('#temperatureGauge canvas').getContext('2d');
  const humidityCtx = document.querySelector('#humidityGauge canvas').getContext('2d');
  const soilMoistureCtx = document.querySelector('#soilMoistureGauge canvas').getContext('2d');

  const temperatureGauge = createGauge(temperatureCtx, 0, 100, 0, '°C');  // Rentang suhu 0-100°C
  const humidityGauge = createGauge(humidityCtx, 0, 100, 0, '%');  // Rentang kelembaban udara 0-100%
  const soilMoistureGauge = createGauge(soilMoistureCtx, 0, 100, 0, '%');  // Rentang kelembaban tanah 0-100%

  // Update ukuran canvas gauge
  document.querySelectorAll('.gauge-box canvas').forEach((canvas) => {
      canvas.width = 150;  // Atur lebar canvas
      canvas.height = 150; // Atur tinggi canvas
  });

  // Inisialisasi chart untuk suhu
  const temperatureChartCtx = document.getElementById('temperatureChart').getContext('2d');
  const temperatureChart = new Chart(temperatureChartCtx, {
      type: 'line',
      data: {
          labels: [],  // Waktu atau timestamps
          datasets: [{
              label: 'Suhu (°C)',
              data: [],
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2,
              fill: false,
              tension: 0.1
          }]
      },
      options: {
          scales: {
              x: {
                  title: { display: true, text: 'Waktu' }
              },
              y: {
                  beginAtZero: true,
                  min: 0,
                  max: 100,  // Rentang suhu 0-100°C
                  title: { display: true, text: 'Suhu (°C)' }
              }
          }
      }
  });

  // Inisialisasi chart untuk kelembaban udara
  const humidityChartCtx = document.getElementById('humidityChart').getContext('2d');
  const humidityChart = new Chart(humidityChartCtx, {
      type: 'line',
      data: {
          labels: [],
          datasets: [{
              label: 'Kelembaban Udara (%)',
              data: [],
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 2,
              fill: false,
              tension: 0.1
          }]
      },
      options: {
          scales: {
              x: {
                  title: { display: true, text: 'Waktu' }
              },
              y: {
                  beginAtZero: true,
                  min: 0,
                  max: 100,  // Rentang kelembaban udara 0-100%
                  title: { display: true, text: 'Kelembaban Udara (%)' }
              }
          }
      }
  });

  // Inisialisasi chart untuk kelembaban tanah
  const soilMoistureChartCtx = document.getElementById('soilMoistureChart').getContext('2d');
  const soilMoistureChart = new Chart(soilMoistureChartCtx, {
      type: 'line',
      data: {
          labels: [],
          datasets: [{
              label: 'Kelembaban Tanah (%)',
              data: [],
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              fill: false,
              tension: 0.1
          }]
      },
      options: {
          scales: {
              x: {
                  title: { display: true, text: 'Waktu' }
              },
              y: {
                  beginAtZero: true,
                  min: 0,
                  max: 100,  // Rentang kelembaban tanah 0-100%
                  title: { display: true, text: 'Kelembaban Tanah (%)' }
              }
          }
      }
  });

  // Fungsi untuk memperbarui gauge dengan data baru
  const updateGauges = (data) => {
      temperatureGauge.data.datasets[0].data = [data.suhu, 100 - data.suhu];  // Update data suhu
      temperatureGauge.update();

      humidityGauge.data.datasets[0].data = [data.kelembabanUdara, 100 - data.kelembabanUdara];  // Update data kelembaban udara
      humidityGauge.update();

      soilMoistureGauge.data.datasets[0].data = [data.kelembabanTanah, 100 - data.kelembabanTanah];  // Update data kelembaban tanah
      soilMoistureGauge.update();
  };

  // Fungsi untuk memperbarui chart dengan data baru
  function updateChart(chart, label, data) {
      chart.data.labels.push(label);
      chart.data.datasets[0].data.push(data);
      chart.update();
  }

  // Fungsi simulasi untuk pembacaan suhu, kelembaban udara, dan kelembaban tanah
  function fetchRealtimeData() {
      const currentTime = new Date().toLocaleTimeString(); // Simulasi waktu
      
      // Simulasi data suhu, kelembaban udara, dan tanah (misal dari sensor)
      const suhu = Math.random() * 100;        // Suhu antara 0 - 100°C
      const kelembabanUdara = Math.random() * 100;  // Kelembaban udara antara 0% - 100%
      const kelembabanTanah = Math.random() * 100;  // Kelembaban tanah antara 0% - 100%

      // Update chart dengan data baru
      updateChart(temperatureChart, currentTime, suhu);
      updateChart(humidityChart, currentTime, kelembabanUdara);
      updateChart(soilMoistureChart, currentTime, kelembabanTanah);

      // Update gauge
      updateGauges({
          suhu: suhu,
          kelembabanUdara: kelembabanUdara,
          kelembabanTanah: kelembabanTanah
      });

      // Update tampilan nilai pada gauge
      document.querySelector('#temperatureGauge .value').textContent = `${suhu.toFixed(1)} °C`;
      document.querySelector('#humidityGauge .value').textContent = `${kelembabanUdara.toFixed(1)} %`;
      document.querySelector('#soilMoistureGauge .value').textContent = `${kelembabanTanah.toFixed(1)} %`;
  }

  // Jalankan pembaruan data setiap 5 detik
  setInterval(fetchRealtimeData, 5000);  // Update setiap 5 detik
});