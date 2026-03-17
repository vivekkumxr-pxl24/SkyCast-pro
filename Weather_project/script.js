const apiKey = "8a5ef600d7dcf599608332df4f460386";
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherContent = document.getElementById("weatherContent");
const errorDisplay = document.getElementById("error");

async function checkWeather(city, lat = null, lon = null) {
    // Reset state before new search
    errorDisplay.style.display = "none";
    
    let url = lat && lon 
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&units=metric&appid=${apiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.cod !== 200) {
            throw new Error(data.message);
        }

        // 1. Pehle main UI update karein
        updateUI(data);

        // 2. Phir extended data (Forecast & AQI) fetch karein
        // Dhyaan dein: Function ka naam fetchExtendedData rakha hai
        fetchExtendedData(data.coord.lat, data.coord.lon);

        weatherContent.style.display = "block";
        weatherContent.style.opacity = "1";

    } catch (err) {
        errorDisplay.style.display = "block";
        weatherContent.style.display = "none";
        console.error("Weather Fetch Error:", err);
    }
}

// Yeh wahi function hai jo 'ReferenceError' de raha tha
async function fetchExtendedData(lat, lon) {
    try {
        // Air Quality API
        const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        const aqiData = await aqiRes.json();
        const aqiLevels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
        const aqiValue = aqiData.list[0].main.aqi;
        document.querySelector(".aqi").innerHTML = aqiLevels[aqiValue - 1] || "N/A";

        // 5-Day Forecast API
        const fRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const fData = await fRes.json();
        updateForecastUI(fData);
    } catch (e) {
        console.error("Error fetching extended data:", e);
    }
}

function updateUI(data) {
    document.querySelector(".city-name").innerHTML = data.name;
    document.querySelector(".current-temp").innerHTML = Math.round(data.main.temp) + "°";
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";
    document.querySelector(".feels-like").innerHTML = Math.round(data.main.feels_like) + "°";
    document.querySelector(".weather-desc").innerHTML = data.weather[0].description;
    document.querySelector(".date-today").innerHTML = new Date().toDateString();

    // Sunrise & Sunset Fix
    const formatTime = (ts) => new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if(document.querySelector(".sunrise")) document.querySelector(".sunrise").innerHTML = formatTime(data.sys.sunrise);
    if(document.querySelector(".sunset")) document.querySelector(".sunset").innerHTML = formatTime(data.sys.sunset);

    const iconCode = data.weather[0].icon;
    document.getElementById("mainIcon").src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    // Dynamic Background colors
    const condition = data.weather[0].main;
    const bgColors = {
        Clear: "#2e86de", Clouds: "#576574", Rain: "#4b6584", 
        Snow: "#d1d8e0", Mist: "#778ca3", Haze: "#95a5a6"
    };
    document.body.style.backgroundColor = bgColors[condition] || "#1e272e";
}

function updateForecastUI(fData) {
    const list = document.getElementById("forecastList");
    if(!list) return;
    list.innerHTML = "";
    // Filter for 12:00 PM
    const daily = fData.list.filter(item => item.dt_txt.includes("12:00:00"));
    daily.forEach(day => {
        list.innerHTML += `
            <div class="f-card">
                <p>${new Date(day.dt * 1000).toLocaleDateString([], {weekday:'short'})}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">
                <h4>${Math.round(day.main.temp)}°</h4>
            </div>`;
    });
}

// Event Listeners
searchBtn.onclick = () => { if(cityInput.value) checkWeather(cityInput.value); };
cityInput.onkeypress = (e) => { if(e.key === "Enter" && cityInput.value) checkWeather(cityInput.value); };
document.getElementById("locationBtn").onclick = () => {
    navigator.geolocation.getCurrentPosition(p => checkWeather("", p.coords.latitude, p.coords.longitude));
};