'use strict';

const REFRESH_INTERVAL = 5 * 60 * 1000;
const API_URL = 'https://api.open-meteo.com/v1/forecast';
const $ = selector => document.querySelector(selector);
const elements = {
  statusPanel: $('#status-panel'), statusTitle: $('#status-title'), statusMessage: $('#status-message'),
  retryButton: $('#retry-button'), refreshButton: $('#refresh-button'), weatherContent: $('#weather-content'),
  temperature: $('#temperature'), apparentTemperature: $('#apparent-temperature'), description: $('#weather-description'),
  weatherIcon: $('#weather-icon'), windSpeed: $('#wind-speed'), windDirection: $('#wind-direction'),
  beaufort: $('#beaufort'), humidity: $('#humidity'), pressure: $('#pressure'),
  lastUpdate: $('#last-update'), locationLabel: $('#location-label')
};

let coordinates = null;
let refreshTimer = null;
let isLoading = false;

const weatherCodes = {
  0:['Onbewolkt','sun'],1:['Overwegend helder','partly'],2:['Gedeeltelijk bewolkt','partly'],3:['Bewolkt','cloud'],
  45:['Mist','fog'],48:['Rijpmist','fog'],51:['Lichte motregen','rain'],53:['Motregen','rain'],55:['Zware motregen','rain'],
  56:['Lichte ijzel','rain'],57:['Zware ijzel','rain'],61:['Lichte regen','rain'],63:['Regen','rain'],65:['Zware regen','rain'],
  66:['Lichte ijsregen','rain'],67:['Zware ijsregen','rain'],71:['Lichte sneeuw','snow'],73:['Sneeuw','snow'],75:['Zware sneeuw','snow'],
  77:['Sneeuwkorrels','snow'],80:['Lichte regenbuien','rain'],81:['Regenbuien','rain'],82:['Zware regenbuien','rain'],
  85:['Lichte sneeuwbuien','snow'],86:['Zware sneeuwbuien','snow'],95:['Onweer','storm'],96:['Onweer met hagel','storm'],99:['Zwaar onweer met hagel','storm']
};

function getWeatherIcon(type, isDay) {
  const sun='<circle cx="64" cy="52" r="25" fill="#ffd45c"/><g stroke="#ffd45c" stroke-width="6" stroke-linecap="round"><path d="M64 10v9M64 85v9M22 52h9M97 52h9M35 23l7 7M86 75l7 7M93 23l-7 7M42 75l-7 7"/></g>';
  const moon='<path d="M89 70a35 35 0 0 1-41-45 35 35 0 1 0 41 45Z" fill="#dceaff"/>';
  const cloud='<path d="M38 96h61c17 0 26-10 26-23s-10-23-24-23c-5-16-18-25-34-25-20 0-35 15-37 34-13 1-22 8-22 19 0 11 10 18 30 18Z" fill="#d9e8f4"/>';
  const drops='<g stroke="#66d9ff" stroke-width="6" stroke-linecap="round"><path d="m39 108-7 13M68 108l-7 13M97 108l-7 13"/></g>';
  const flakes='<g fill="#d9f5ff" font-size="24" font-family="sans-serif"><text x="25" y="127">✦</text><text x="58" y="132">✦</text><text x="91" y="124">✦</text></g>';
  const bolt='<path d="m74 91-18 30h17l-6 25 30-38H79l10-17Z" fill="#ffd45c"/>';
  const fog='<g stroke="#d9e8f4" stroke-width="7" stroke-linecap="round" opacity=".85"><path d="M20 70h96M31 91h91M17 112h83"/></g>';
  let content = fog;
  if(type==='sun') content=isDay?sun:moon;
  if(type==='partly') content=`${isDay?sun:moon}${cloud}`;
  if(type==='cloud') content=cloud;
  if(type==='rain') content=`${cloud}${drops}`;
  if(type==='snow') content=`${cloud}${flakes}`;
  if(type==='storm') content=`${cloud}${bolt}`;
  return `<svg viewBox="0 0 140 150">${content}</svg>`;
}

function formatWindDirection(degrees) {
  const labels=['N','NO','O','ZO','Z','ZW','W','NW'];
  return `${labels[Math.round(degrees/45)%8]} (${Math.round(degrees)}°)`;
}

function toBeaufort(kmh) {
  const limits=[1,6,12,20,29,39,50,62,75,89,103,118];
  const value=limits.findIndex(limit=>kmh<limit);
  return value===-1?12:value;
}

function setStatus(title,message,isError=false) {
  elements.statusTitle.textContent=title;
  elements.statusMessage.textContent=message;
  elements.statusPanel.classList.toggle('error',isError);
  elements.retryButton.hidden=!isError;
  elements.statusPanel.hidden=false;
  elements.weatherContent.hidden=true;
}

function showError(message) { setStatus('Weer niet beschikbaar',message,true); }

function requestLocation() {
  clearInterval(refreshTimer);
  if(!navigator.geolocation) {
    showError('Je browser ondersteunt geen locatiebepaling. Gebruik een recente browser.');
    return;
  }
  setStatus('Locatie opvragen…','Geef toestemming wanneer je browser daarom vraagt.');
  navigator.geolocation.getCurrentPosition(position=>{
    coordinates={latitude:position.coords.latitude,longitude:position.coords.longitude};
    elements.locationLabel.textContent=`${coordinates.latitude.toFixed(2)}°, ${coordinates.longitude.toFixed(2)}°`;
    fetchWeather();
    refreshTimer=setInterval(fetchWeather,REFRESH_INTERVAL);
  },error=>{
    const messages={
      1:'Locatietoegang is geweigerd. Sta locatiegebruik toe in je browser en probeer opnieuw.',
      2:'Je locatie kon niet worden bepaald. Controleer je verbinding en probeer opnieuw.',
      3:'Het bepalen van je locatie duurde te lang. Probeer het opnieuw.'
    };
    showError(messages[error.code]||'Er ging iets mis bij het bepalen van je locatie.');
  },{enableHighAccuracy:false,timeout:12000,maximumAge:10*60*1000});
}

async function fetchWeather() {
  if(!coordinates||isLoading) return;
  isLoading=true;
  elements.refreshButton.disabled=true;
  elements.refreshButton.classList.add('loading');
  const params=new URLSearchParams({
    latitude:coordinates.latitude,longitude:coordinates.longitude,
    current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m',
    wind_speed_unit:'kmh',timezone:'auto'
  });
  try {
    const response=await fetch(`${API_URL}?${params}`);
    if(!response.ok) throw new Error(`Open-Meteo status ${response.status}`);
    const data=await response.json();
    if(!data.current) throw new Error('Actuele weergegevens ontbreken');
    renderWeather(data.current,data.timezone_abbreviation);
  } catch(error) {
    console.error(error);
    if(elements.weatherContent.hidden) showError('De weergegevens konden niet worden geladen. Controleer je internetverbinding en probeer opnieuw.');
  } finally {
    isLoading=false;
    elements.refreshButton.disabled=false;
    elements.refreshButton.classList.remove('loading');
  }
}

function renderWeather(current,timezone) {
  const [description,iconType]=weatherCodes[current.weather_code]||['Onbekende weersituatie','cloud'];
  elements.temperature.textContent=Math.round(current.temperature_2m);
  elements.apparentTemperature.textContent=Math.round(current.apparent_temperature);
  elements.description.textContent=description;
  elements.weatherIcon.innerHTML=getWeatherIcon(iconType,Boolean(current.is_day));
  elements.windSpeed.textContent=Math.round(current.wind_speed_10m);
  elements.windDirection.textContent=formatWindDirection(current.wind_direction_10m);
  elements.beaufort.textContent=toBeaufort(current.wind_speed_10m);
  elements.humidity.textContent=Math.round(current.relative_humidity_2m);
  elements.pressure.textContent=Math.round(current.pressure_msl);
  const updateTime=new Date();
  elements.lastUpdate.dateTime=updateTime.toISOString();
  elements.lastUpdate.textContent=updateTime.toLocaleString('nl-NL',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'})+(timezone?` ${timezone}`:'');
  elements.statusPanel.hidden=true;
  elements.weatherContent.hidden=false;
}

elements.retryButton.addEventListener('click',requestLocation);
elements.refreshButton.addEventListener('click',()=>coordinates?fetchWeather():requestLocation());
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&coordinates) fetchWeather();});
requestLocation();
