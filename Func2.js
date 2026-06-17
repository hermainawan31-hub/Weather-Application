const API = "https://api.open-meteo.com/v1/forecast";

// Helper map to convert Open-Meteo codes to condition emojis
const iconMap = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌧️", 53: "🌧️", 55: "🌧️",
    61: "🌧️", 63: "🌧️", 65: "🌧️",
    71: "❄️", 73: "❄️", 75: "❄️",
    80: "🌦️", 81: "🌦️", 82: "🌧️",
    95: "⛈️"
};

// 🌍 GET WEATHER
async function getWeather(lat, lon, cityName = "Your Location") {
    const url = `${API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max,sunrise,sunset,precipitation_probability_max&timezone=auto`;

    const res = await fetch(url);
    const data = await res.json();
    window.myData = data;
    console.log(data);

    // 1. --- CURRENT CONDITIONS (HERO + CARDS) ---
    document.getElementById("temp").innerText = Math.round(data.current.temperature_2m) + "°";
    document.getElementById("humidity").innerText = data.current.relative_humidity_2m + "%";
    document.getElementById("wind").innerText = data.current.wind_speed_10m + " km/h";
    
    // Match condition emoji codes
    const currentCode = data.current.weather_code;
    document.getElementById("main-icon").innerText = iconMap[currentCode] || "☀️";

    // Map optional metadata values returned from modern metrics
    document.getElementById("uv-index").innerText = Math.round(data.daily.uv_index_max[0]) + " of 10";
    document.getElementById("rain-chance").innerText = data.daily.precipitation_probability_max[0] + "%";
    
    // Parse time format safely strings
    const sunRiseTime = new Date(data.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunSetTime = new Date(data.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById("sunrise-time").innerText = sunRiseTime;
    document.getElementById("sunset-time").innerText = sunSetTime;

    // Sync Labels
    document.getElementById("location").innerText = cityName;
    document.getElementById("locationText").innerText = cityName;

    // 2. --- GENERATE DYNAMIC FORECAST ITEMS ROW ---
    const dailyData = data.daily;
    let forecastHTML = "";

    for (let i = 0; i < 7; i++) {
        const dateObj = new Date(dailyData.time[i]);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dayMaxTemp = Math.round(dailyData.temperature_2m_max[i]);
        const conditionCode = dailyData.weather_code[i];
        const dayEmoji = iconMap[conditionCode] || "☀️";

        forecastHTML += `<div>${dayName}<br>${dayEmoji}<br>${dayMaxTemp}°</div>`;
    }

    // Render straight into template container
    document.getElementById("days-forecast").innerHTML = forecastHTML;
}

// 🌍 GET CITY NAME (reverse geocoding)
async function getCityName(lat, lon) {
    const geoURL = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    
    const res = await fetch(geoURL);
    const data = await res.json();
    return data.city || data.locality || "Unknown";
}

// 📍 USER LOCATION
function loadUserWeather() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const city = await getCityName(lat, lon);
        getWeather(lat, lon, city);
    }, () => {
        // Fallback default: Karachi
        getWeather(24.8607, 67.0011, "Karachi, Pakistan");
    });
}

// 🔍 SEARCH CITY
async function searchCity() {
    const input = document.getElementById("cityInput").value;
    if (!input) return;

    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input)}`);
    const data = await geo.json();

    if (!data.results) {
        alert("City not found");
        return;
    }

    const city = data.results[0];
    getWeather(city.latitude, city.longitude, city.name);
}

// EVENT for Enter key
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchCity();
});

loadUserWeather();


// 🚪 SIDEBAR TOGGLE MECHANIC
function toggleSidebar() {
    const sidebar = document.getElementById("sideMenu");
    sidebar.classList.toggle("open");
}