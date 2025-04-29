document.addEventListener('deviceready', function () {
    // Ativar modo de segundo plano
    cordova.plugins.backgroundMode.enable();

    // Personalizar a notificação fixa
    cordova.plugins.backgroundMode.setDefaults({
        title: "Meu App",
        text: "Aplicativo em execução",
        icon: "icon", // Nome do ícone na pasta res
        color: "F14F4F", // Cor do ícone
        resume: true,
        hidden: false,
        bigText: false
    });

    // Ativar a notificação
    cordova.plugins.backgroundMode.on('activate', function () {
        cordova.plugins.backgroundMode.disableWebViewOptimizations();
    });

    // Capturar localização
    navigator.geolocation.watchPosition(
        function (position) {
            console.log("Latitude: " + position.coords.latitude +
                        ", Longitude: " + position.coords.longitude);
        },
        function (error) {
            console.error("Erro ao obter localização: " + error.message);
        },
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
    );

    function checkTimeAndSendEmail() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
    
        // Verifica se é 09:00 ou 15:00 e se os minutos estão em 0 para evitar execuções repetidas
        if ((hours === 9 || hours === 15) && minutes === 0) {
            checkAndSendEmail();
            console.log("enviado email fazendas");
        }
    }
    
    // Executa a verificação a cada minuto
    setInterval(checkTimeAndSendEmail, 60000);
    
}, false);

const API_KEY = '92da2d0d79563c320e4d232ce268efd9';

// Função para buscar o clima
function getWeather() {
    const cityInput = document.getElementById('citySearch').value;
    const selectedCity = document.getElementById('citySearch').dataset.latlon;

    if (selectedCity) {
        const [lat, lon] = selectedCity.split(',');
        fetchWeather(lat, lon);
    } else if (cityInput) {
        fetchCityWeather(cityInput);
    } else {
        alert('Digite uma cidade ou use sua localização atual.');
    }
}

// Busca clima por nome da cidade
function fetchCityWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=pt_br&appid=${API_KEY}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data); // Para debugar e ver o formato dos dados
            displayWeather(data);
        })
        .catch(error => console.error('Erro ao buscar o clima:', error));
}

// Busca clima por coordenadas (latitude e longitude)
function fetchWeather(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data); // Para debugar e ver o formato dos dados
            displayWeather(data);
        })
        .catch(error => console.error('Erro ao buscar o clima:', error));
}

// Exibe a previsão do tempo
function displayWeather(data) {
    if (data.cod !== 200) {
        alert('Erro ao buscar clima: ' + data.message);
        return;
    }

    const weatherInfo = document.getElementById('weatherInfo');

    let rainInfo = data.rain ? `<p>🌧️ Previsão de chuva: ${data.rain["1h"] || 0} mm na última hora</p>` : "<p>☀️ Sem previsão de chuva</p>";

    // Converte a velocidade do vento para km/h
    const windSpeedKmh = (data.wind.speed * 3.6).toFixed(2);

    weatherInfo.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <p> <b>🌡️ Temperatura:</b> ${data.main.temp}°C</p>
        <p>☁️<b> Clima:</b> ${data.weather[0].description}</p>
        <p>💨<b> Vento:</b> ${windSpeedKmh} km/h</p>
        <p>💧<b> Umidade:</b> ${data.main.humidity}%</p> <!-- Adicionando a umidade -->
        ${rainInfo}
    `;

    // Buscar CEP baseado na latitude e longitude
    getPostalCode(data.coord.lat, data.coord.lon);
}

// Busca CEP baseado na latitude e longitude usando OpenStreetMap
function getPostalCode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.address && data.address.postcode) {
                document.getElementById('weatherInfo').innerHTML += `<p>📍 CEP: ${data.address.postcode}</p>`;
            }
        })
        .catch(error => console.error('Erro ao buscar o CEP:', error));
}

// Função para sugerir cidades com Estado (UF) e País
function autocompleteCities() {
    const input = document.getElementById('citySearch');
    const city = input.value;

    if (city.length < 3) {
        document.getElementById('cityList').innerHTML = '';
        return;
    }

    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const suggestionsDiv = document.getElementById('cityList');
            suggestionsDiv.innerHTML = '';

            data.forEach(city => {
                const cityOption = document.createElement('div');
                const state = city.state ? `, ${city.state}` : "";
                const country = city.country ? `, ${city.country}` : "";
                const fullCityName = `${city.name}${state}${country}`; // Nome completo da cidade

                cityOption.textContent = fullCityName; // Exibe o nome completo da cidade
                cityOption.onclick = () => {
                    input.value = fullCityName; // Preenche o campo com o nome completo
                    input.dataset.latlon = `${city.lat},${city.lon}`; // Salva a latitude e longitude
                    suggestionsDiv.innerHTML = ''; // Limpa as sugestões após seleção
                };
                suggestionsDiv.appendChild(cityOption);
            });
        })
        .catch(error => console.error('Erro ao buscar sugestões:', error));
}


// Adiciona o evento de digitação ao input para ativar o autocomplete
document.getElementById('citySearch').addEventListener('input', autocompleteCities);

// Adiciona o evento ao botão de busca para chamar a função getWeather
document.getElementById('searchCity').addEventListener('click', getWeather);

// Função para obter a localização atual
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                console.log("Latitude: " + lat + ", Longitude: " + lon);
                
                // Agora, passamos as coordenadas para a função fetchWeather
                fetchWeather(lat, lon);
            },
            function(error) {
                console.error("Erro ao obter localização: ", error);
                alert("Erro ao obter localização: " + error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        alert("Geolocalização não é suportada pelo seu navegador.");
    }
}

// verificar conexao
function checkNetworkConnection() {
    var networkState = navigator.connection.type;

    if (networkState === Connection.NONE) {
        alert("Sem conexão com a internet.");
    } else {
        alert("Conectado à internet.");
        // Aqui você pode realizar as requisições de rede, como buscar o clima
    }
}

// Verifique o status da rede ao carregar o app
document.addEventListener("deviceready", function() {
    checkNetworkConnection();
}, false);


// Inicializa o EmailJS com a chave pública
emailjs.init("SUhDhXzSelHqmbKYj"); // Substitua pela sua chave pública do EmailJS

// Função para enviar o e-mail com os dados do clima
function sendWeatherEmail(cityName, temperature, weatherDescription, humidity, windSpeed) {
  const dateNow = new Date().toLocaleDateString("pt-BR"); // Formata a data no formato dia/mês/ano

  const templateParams = {
    name: 'João Vitor Mendes', // Seu nome ou o nome do remetente
    dateNow: dateNow,
    city: cityName,
    temperature: temperature,
    weather: weatherDescription,
    humidity: humidity,
    wind: windSpeed,
    email: 'dominique@montealegrecoffees.com' // E-mail do destinatário
  };
  

  // Envia o e-mail usando o serviço e template configurados no EmailJS
  emailjs.send("service_7kaqfgb", "template_y06ka7h", templateParams) // Use o ID de serviço e template do painel EmailJS
    .then(function(response) {
      console.log('E-mail enviado com sucesso:', response);
      alert('E-mail enviado com sucesso!');
    }, function(error) {
      console.error('Erro ao enviar o e-mail:', error);
      alert('Erro ao enviar o e-mail. Tente novamente!');
    });
}

// Função que exibe os dados do clima e envia o e-mail
function displayWeather(data) {
  if (data.cod !== 200) {
    alert('Erro ao buscar clima: ' + data.message);
    return;
  }

  const weatherInfo = document.getElementById('weatherInfo');

  let rainInfo = data.rain ? `<p>🌧️ Previsão de chuva: ${data.rain["1h"] || 0} mm na última hora</p>` : "<p>☀️ Sem previsão de chuva</p>";

  // Converte a velocidade do vento para km/h
  const windSpeedKmh = (data.wind.speed * 3.6).toFixed(2);

  // Exibe as informações de clima
  weatherInfo.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <p><b>🌡️ Temperatura:</b> ${data.main.temp}°C</p>
    <p>☁️<b> Clima:</b> ${data.weather[0].description}</p>
    <p>💨<b> Vento:</b> ${windSpeedKmh} km/h</p>
    <p>💧<b> Umidade:</b> ${data.main.humidity}%</p>
    ${rainInfo}
  `;
  const videback = document.getElementById("videback");

if (data.rain) {
    videback.src = "./img/backchuva.mp4";
} else {
    videback.src = "./img/backdia.mp4";
}


  // Envia as informações por e-mail
  sendWeatherEmail(data.name, data.main.temp, data.weather[0].description, data.main.humidity, windSpeedKmh);
}

// Adicionando a funcionalidade para enviar e-mail ao clicar no botão
document.getElementById('sendEmailButton').addEventListener('click', function() {
  const data = {
    name: 'Monte Belo',
    main: {
      temp: 28,
      humidity: 60
    },
    weather: [{ description: 'Céu limpo' }],
    wind: { speed: 5 },
    sys: { country: 'BR' },
    coord: { lat: -21.123, lon: -46.123 }
  };

  const windSpeedKmh = (data.wind.speed * 3.6).toFixed(2);
  sendWeatherEmail(data.name, data.main.temp, data.weather[0].description, data.main.humidity, windSpeedKmh);
});


// Função para buscar o clima de Areado - MG e enviar por e-mail
function getWeatherForAreado() {
    const apiKey = API_KEY; // Substitua pela sua chave da OpenWeatherMap
    const lat = -21.5043004;
    const lon = -45.9552911;

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=pt`)
    .then(response => response.json())
    .then(data => {
        if (data.cod !== 200) {
            console.error('Erro ao buscar clima:', data.message);
            return;
        }

        const windSpeedKmh = (data.wind.speed * 3.6).toFixed(2);
        sendWeatherEmail(data.name, data.main.temp, data.weather[0].description, data.main.humidity, windSpeedKmh);
    })
    .catch(error => console.error("Erro ao buscar clima:", error));
}

//tq
function getWeatherForTq() {
    const apiKey = API_KEY; // Substitua pela sua chave da OpenWeatherMap
    const lat = -21.3799114;
    const lon = -46.2018319;

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=pt`)
    .then(response => response.json())
    .then(data => {
        if (data.cod !== 200) {
            console.error('Erro ao buscar clima:', data.message);
            return;
        }

        const windSpeedKmh = (data.wind.speed * 3.6).toFixed(2);
        sendWeatherEmail(data.name, data.main.temp, data.weather[0].description, data.main.humidity, windSpeedKmh);
    })
    .catch(error => console.error("Erro ao buscar clima:", error));
}

// Função para verificar a hora atual e enviar o e-mail automaticamente
function checkAndSendEmail() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Verifica se são 09:00 ou 15:00
    if ((hours === 9 || hours === 15) && minutes === 0) {
        getWeatherForAreado(); 
        getWeatherForTq();
        console.log("enviado email fazendas");
    } 
}

// Chama a função a cada minuto para verificar a hora
setInterval(checkAndSendEmail, 60000); // A cada 60.000 ms (1 minuto)
