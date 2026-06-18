const API = "https://api.open-meteo.com/v1/forecast";

const iconMap = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌧️", 53: "🌧️", 55: "🌧️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    71: "❄️", 73: "❄️", 75: "❄️",
    80: "🌦️", 81: "🌦️", 82: "🌧️",
    95: "⛈️"
};

let weatherChart = null;

async function getWeather(lat, lon, cityName = "Your Location") {
    const url = `${API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max,sunrise,sunset,precipitation_probability_max&timezone=auto`;

    const res = await fetch(url);
    const data = await res.json();

    // Render Metrics
    document.getElementById("temp").innerText = Math.round(data.current.temperature_2m) + "°";
    document.getElementById("humidity").innerText = data.current.relative_humidity_2m + "%";
    document.getElementById("wind").innerText = data.current.wind_speed_10m + " km/h";
    
    const currentCode = data.current.weather_code;
    document.getElementById("main-icon").innerText = iconMap[currentCode] || "☀️";
    document.getElementById("uv-index").innerText = Math.round(data.daily.uv_index_max[0]) + " of 10";
    document.getElementById("rain-chance").innerText = data.daily.precipitation_probability_max[0] + "%";
    
    const sunRiseTime = new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunSetTime = new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById("sunrise-time").innerText = sunRiseTime;
    document.getElementById("sunset-time").innerText = sunSetTime;

    document.getElementById("location").innerText = cityName;
    document.getElementById("locationText").innerText = cityName;

    // --- 📊 GENERATE CHART TRENDS ---
    const daysLabels = data.daily.time.map(timeStr => {
        return new Date(timeStr).toLocaleDateString('en-US', { weekday: 'short' });
    });
    const maxTemps = data.daily.temperature_2m_max.map(val => Math.round(val));

    if (weatherChart) {
        weatherChart.destroy();
    }

    const ctx = document.getElementById('forecastChart').getContext('2d');
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 150);
    gradientFill.addColorStop(0, 'rgba(67, 97, 238, 0.22)');
    gradientFill.addColorStop(1, 'rgba(67, 97, 238, 0.00)');

    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: daysLabels,
            datasets: [{
                label: 'Max Temp',
                data: maxTemps,
                borderColor: '#5c8df6',
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#4361ee',
                pointHoverRadius: 5,
                tension: 0.4,
                fill: true,
                backgroundColor: gradientFill
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#8fa0be', font: { family: 'Inter', size: 11 } }
                }
            }
        }
    });

    // --- 📋 POPULATE DYNAMIC DAILY FOOTER ITEMS ---
    const footerContainer = document.getElementById("chartForecastFooter");
    footerContainer.innerHTML = ""; 

    data.daily.time.forEach((timeStr, index) => {
        const dayName = new Date(timeStr).toLocaleDateString('en-US', { weekday: 'short' });
        const dayMaxTemp = Math.round(data.daily.temperature_2m_max[index]);
        const dayWeatherCode = data.daily.weather_code[index];
        const dayIcon = iconMap[dayWeatherCode] || "☀️";

        const forecastItem = document.createElement("div");
        forecastItem.classList.add("forecast-item");

        forecastItem.innerHTML = `
            <span class="day-name">${dayName}</span>
            <span class="day-icon">${dayIcon}</span>
            <span class="day-temp">${dayMaxTemp}°</span>
        `;
        
        footerContainer.appendChild(forecastItem);
    });
}

async function getCityName(lat, lon) {
    const geoURL = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(geoURL);
    const data = await res.json();
    return data.city || data.locality || "Unknown";
}

function loadUserWeather() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        getWeather(pos.coords.latitude, pos.coords.longitude, await getCityName(pos.coords.latitude, pos.coords.longitude));
    }, () => {
        getWeather(24.8607, 67.0011, "Karachi, Pakistan");
    });
}

async function searchCity() {
    const input = document.getElementById("cityInput").value;
    if (!input) return;
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input)}`);
    const data = await geo.json();
    if (!data.results) { alert("City not found"); return; }
    const city = data.results[0];
    getWeather(city.latitude, city.longitude, city.name);
}

document.addEventListener("keydown", (e) => { if (e.key === "Enter") searchCity(); });
loadUserWeather();

function toggleSidebar() { document.getElementById("sideMenu").classList.toggle("open"); }
window.addEventListener("load", () => {
    const savedName = localStorage.getItem("profileName");
    if (savedName) document.getElementById("profileName").innerText = savedName;
});
function changeName() {
    const newName = prompt("Enter your new profile name:");
    if (newName && newName.trim() !== "") {
        document.getElementById("profileName").innerText = newName;
        localStorage.setItem("profileName", newName);
    }
}