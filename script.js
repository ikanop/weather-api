async function main() {
  const location = await geocodeLocation();
  weatherData = await fetchWeather(location);
  renderLocation(location);
  renderCurrentWeather(weatherData)
  renderHourlyForecast(weatherData);
  renderDailyForecast(weatherData);
}

function renderLocation(location) {
  document.getElementById("location").textContent = location.name
}

function renderCurrentWeather(weatherData) {
  document.getElementById("temp").textContent = weatherData.current.temperature_2m + "°c"
  document.getElementById("apparent").textContent = `feels like ${weatherData.current.apparent_temperature}°c`

  document.getElementById("wind").textContent = `${weatherData.current.wind_speed_10m}(${weatherData.current.wind_gusts_10m}) m/s ${getWindDirection(weatherData.current.wind_direction_10m)}`
  document.getElementById("precipitation").textContent = `${weatherData.current.precipitation} mm`
}

function renderHourlyForecast(weatherData) {
  const hourly = document.getElementById("hourly");

  const currentIndex = getCurrentHourIndex(weatherData);

  for (let i = currentIndex; i < currentIndex + 12; i++) {
    const time = new Date(weatherData.hourly.time[i] * 1000)

    hourly.innerHTML += `
<div class="hour-row">
  <span>${time.getHours()}:00</span>
  <span>${weatherData.hourly.temperature_2m[i]}°c</span>
  <span>${weatherData.hourly.precipitation_probability[i]}%</span>
  <span>${weatherData.hourly.wind_speed_10m[i]}(${weatherData.hourly.wind_gusts_10m[i]}) m/s ${getWindDirection(weatherData.hourly.wind_direction_10m[i])}</span>
</div>
`
  }
}

function toggleDailyHours(dayIndex, weatherData) {
  const hoursContainer = document.getElementById(`hours-${dayIndex}`)

  if (hoursContainer.innerHTML != "") {
    hoursContainer.innerHTML = "";
    return;
  }

  let start;
  let end;

  if (dayIndex === 0) {
    start = getCurrentHourIndex(weatherData);
    end = (dayIndex + 1) * 24
  } else {
    start = dayIndex * 24
    end = start + 24
  }


  for (let i = start; i < end; i++) {
    const time = new Date(weatherData.hourly.time[i] * 1000)
    hoursContainer.innerHTML += `
<div class="day-hour-row">
  <span>${time.getHours()}:00</span>
  <span>${weatherData.hourly.temperature_2m[i]}°c</span>
  <span>${weatherData.hourly.precipitation_probability[i]}%</span>
  <span>${weatherData.hourly.wind_speed_10m[i]}(${weatherData.hourly.wind_gusts_10m[i]}) m/s ${getWindDirection(weatherData.hourly.wind_direction_10m[i])}</span>
</div>
`
  }
}

function renderDailyForecast(weatherData) {
  const container = document.getElementById("daily")

  for (let i = 0; i < weatherData.daily.time.length; i++) {
    const time = weatherData.daily.time[i]
    const date = new Date(time * 1000)
    const today = new Date().setHours(0, 0, 0, 0)
    const isToday = date.setHours(0, 0, 0, 0) === today

    const label = isToday ? 'today' : date.toLocaleString('en', { weekday: 'short', day: 'numeric' })

    container.innerHTML += `
<div class="daily-row" data-index="${i}">
  <span>${label}</span>
  <span>${weatherData.daily.temperature_2m_min[i]}°c / ${weatherData.daily.temperature_2m_max[i]}°c</span>
  <span>${weatherData.daily.precipitation_probability_max[i]}%</span>
  <span>${weatherData.daily.wind_speed_10m_max[i]}(${weatherData.daily.wind_gusts_10m_max[i]}) m/s ${getWindDirection(weatherData.daily.wind_direction_10m_dominant[i])}</span>
</div>
<div class="day-hours" id="hours-${i}"></div>
`
  }
  container.addEventListener("click", (e) => {
    const row = e.target.closest(".daily-row")
    const i = Number(row.dataset.index);
    toggleDailyHours(i, weatherData)
  })
}

async function fetchWeather(location) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max,precipitation_probability_max,precipitation_sum,sunshine_duration,precipitation_hours&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,cloud_cover&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,weather_code,cloud_cover&timeformat=unixtime&wind_speed_unit=ms&timezone=auto`
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`response status: ${response.status}`);
    }

    const result = await response.json();

    return result

  } catch (Error) {
    console.log(Error.message);
  }
}

async function geocodeLocation() {
  const url = "https://geocoding-api.open-meteo.com/v1/search?name=sandnes&count=10&language=en&format=json"
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`response status: ${response.status}`);
    }

    const result = await response.json();
    const data = result.results[0]

    return {
      lat: data.latitude,
      lon: data.longitude,
      name: data.name
    }

  } catch (Error) {
    console.log(Error.message)
  }
}

function getCurrentHourIndex(weatherData) {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  const nextHourIndex = weatherData.hourly.time.findIndex((t) => t >= nowInSeconds);

  return nextHourIndex;
}

function getWindDirection(degrees) {
  const dirs = [
    "↑",
    "↗",
    "→",
    "↘",
    "↓",
    "↙",
    "←",
    "↖"
  ];

  return dirs[Math.round(degrees / 45) % 8]
}

main();
