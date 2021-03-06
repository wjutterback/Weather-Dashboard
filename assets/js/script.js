var APIkey = "f094b3d4247e89d90ebcf38a7e5d3caa";

//Search if localStorage has a saved search in it, pass citySearch to searchFunction
$(document).ready(function () {
  if (localStorage.getItem("lastCity") === null) {
  } else {
    citySearch = localStorage.getItem("lastCity");
    searchFunction(citySearch, false);
  }
});

//Primary search function, triggers on enter/click/page reload, queries city/wind/temp/humidity/lat/long/uv/5-day forecast
function searchFunction(citySearch, historySearch) {
  var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + citySearch + "&appid=" + APIkey;
  var queryForecast = "https://api.openweathermap.org/data/2.5/forecast?q=" + citySearch + "&cnt=40&appid=" + APIkey;
  $.ajax({
    url: queryURL,
    method: "GET"
  }).then(function (response) {
    var iconID = (response.weather[0].icon); // find icon ID for website URL lookup
    var weatherIcon = "http://openweathermap.org/img/w/" + iconID + ".png"; // weather icons are located on the openweather website, listed by icon ID inside response
    var weatherIconAlt = (response.weather[0].description) + " weather icon"; // weather icon alt tag response
    $('.city').html(`<h2>${response.name} - ${moment().format('l')}<img src='${weatherIcon}' alt='${weatherIconAlt}' /></h2>`); //City name/weather icon response display
    // $('#cityIcon').attr('src', weatherIcon).attr('alt', weatherIconAlt); ---- just added to the html in line above, left here for the sake of example.
    $('.wind').text(`Wind Speed: ${response.wind.speed} MPH`); // Wind response display
    $('.humidity').text(`Humidity: ${response.main.humidity}%`); // Humidity response display
    let temp = `Tempature: ${parseFloat((response.main.temp - 273.15) * 1.80 + 32).toFixed(2)}°F`; // kelvin to Fahrenheit conversion
    $('.temp').html(temp); // Temp response display
    lonQuery = response.coord.lon;
    latQuery = response.coord.lat;
    uvFunction(lonQuery, latQuery);
    localStorage.setItem('lastCity', `${response.name}`); // where localStorage key/value saved
    weatherCage(iconID); // Where 3d image function is run
  });

  //gets UV values
  function uvFunction(lonQuery, latQuery) {
    var queryUV = "https://api.openweathermap.org/data/2.5/onecall?lat=" + latQuery + "&lon=" + lonQuery + "&exclude=minutely,hourly,alerts,daily&appid=" + APIkey;
    $.ajax({
      url: queryUV,
      method: "GET"
    }).then(function (response) {
      var uvColor = response.current.uvi;
      $('.uv').text(uvColor); // UV Value
      // UV color coding
      if (uvColor <= 3) {
        $('.uv').css('background-color', 'green');
      } else if (uvColor > 3 && uvColor <= 6) {
        $('.uv').css({ 'background-color': 'yellow', 'color': 'black' });
      } else if (uvColor > 6 && uvColor <= 8) {
        $('.uv').css({ 'background-color': 'orange', 'color': 'black' });
      } else if (uvColor > 8 && uvColor <= 11) {
        $('.uv').css('background-color', 'red');
      } else if (uvColor > 11) {
        $('.uv').css('background-color', 'violet');
      }
    });
  }

  $.ajax({
    url: queryForecast,
    method: "GET"
  }).then(function (response) {
    //Five Day Forecast forEach loop
    $(".fiveday").each(function () {
      var position = $(this).attr('id'); // ID in increments of 8: 8 * 3 = 24 hours (3 hour intervals)
      var day = (response.list[position].dt_txt); // Day inside response
      var iconID = (response.list[position].weather[0].icon); // find icon ID for website URL lookup
      var weatherIcon = "http://openweathermap.org/img/w/" + iconID + ".png"; // weather icons are located on the openweather website, listed by icon ID inside response
      var weatherIconAlt = (response.list[position].weather[0].description) + " weather icon"; // weather icon alt tag response
      let temp = `Temperature: ${parseFloat((response.list[position].main.temp - 273.15) * 1.80 + 32).toFixed(2)}°F`; // temperature converted from Kelvin
      $(this).text(moment(day).format('MMMM DD, YYYY')); // Date display
      $(this).next().attr('src', weatherIcon); // weather icon display
      $(this).next().attr('alt', weatherIconAlt); //img alt definition
      $(this).next().next().text(temp); // Temperature display
      $(this).next().next().next().text(`Humidity: ${response.list[position].main.humidity}%`); // Humidity
    });
  });

  //Check whether to save history or not/save search history if true, remove searches greater than 5"
  if (historySearch === true) {
    var searchArray = [];
    var saveHistory = 1;
    $(".savedHistory").each(function () {
      var citySave = $(this).html();
      searchArray.push(citySave);
    });
    for (let i = 0; i < searchArray.length; i++) {
      if (searchArray[i] === citySearch) {
        saveHistory = 0;
        return saveHistory;
      }
    }
    if (saveHistory === 1 && searchArray.length <= 4) {
      createRow();
    } else if (saveHistory === 1 && searchArray.length >= 5) {
      $('.history div').first().remove();
      createRow();
    }
  }

  //create Saved Searches buttons
  function createRow() {
    const row = $('<div class="list-group">');
    const cityName = $('<button class="savedHistory">').text(citySearch);
    row.append(cityName);
    row.appendTo('.history');
  }
}

//"WARNING: Too many active WebGL contexts. Oldest context will be lost." - from searching too many cities
// WebGL. Contexts are deleted by garbage collection (removing canvas seems to just remove rendering superficially - i think still stored in memory, more research here)

//Animated cube and cylinder -
function weatherCage(iconID) {
  $('canvas').remove();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x29D4BE);
  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  $('.appendthreejs').append(renderer.domElement);
  //textures
  // const manager = new THREE.LoadingManager(); // maybe reason why second texture doesn't load from local - might have to use loading manager/local server??
  const texture = new THREE.TextureLoader().load("http://openweathermap.org/img/w/" + iconID + ".png");
  const texture2 = new THREE.TextureLoader().load("https://images.pexels.com/photos/53594/blue-clouds-day-fluffy-53594.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940");

  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 3, 3, 3);
  const cube = new THREE.Mesh(geometry, material);

  const cylinderMaterial = new THREE.MeshBasicMaterial({ map: texture2, side: THREE.BackSide });
  const cylinderGeometry = new THREE.CylinderGeometry(5, 5, 20, 32);
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

  scene.add(cylinder);
  scene.add(cube);
  camera.position.z = 5;

  const animate = function () {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.005;
    cube.rotation.y += 0.005;

    cylinder.rotation.x += 0.005;
    cylinder.rotation.y += 0.005;

    renderer.render(scene, camera);
  };

  animate();
}

$('.buttonInput').on('click', (function () {
  searchFunction($('#search').val(), true);
  $('#search').val('');
}));

$('#form-search').keypress(function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    $('.buttonInput').click();
  }
});

$(document).on('click', '.savedHistory', (function () {
  searchFunction($(this).text(), false);
}));