// set this Boolean to false because a button hasn't been clicked yet when the page first loads or is refreshed
var clickBool = false;
// event handlers for clicks on the search button or clicks on the search history list 
$("#find-city").on("click", function () {
    clickBool = true;
    createWeatherData();
});
$("#search-history").on("click", function () {
    clickBool = true;
    createWeatherData();
});
// this function is called either by the click on the search button, the clicks on the search history list, or when the page is refreshed and there is something in local storage
function createWeatherData() {
    // get userInputCity by checking what invoked this function
    // page refreshed, search button click, search history list click, else return
    if (localStorage.length !== 0 && !$("#city-input").val() && !clickBool) {
        var userInputCity = localStorage.getItem(localStorage.length - 1);
    } else if (event.target.matches("button") || event.target.matches("i") && clickBool) {
        event.preventDefault();
        var userInputCity = $("#city-input").val().toLowerCase().trim();
    } else if (event.target.matches("li") && clickBool) {
        var userInputCity = event.target.getAttribute("data-city").toLowerCase().trim();;
    } else {
        return;
    }
    // if an empty input is submitted, break out of this function
    if (userInputCity === "") {
        return;
    }
    // the localStorageBool keeps track of whether the city is in local storage or not. if local storage is empty, add the city into the list. else run through local storage to check if the city is stored.
    let localStorageBool = false;
    if (localStorage.length === 0) {
        localStorage.setItem(0, userInputCity);
        createSearchHistory();
        localStorageBool = true;
    } else {
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.getItem(i) === userInputCity) {
                localStorageBool = true;
            }
        }
    }
    // add the city to local storage if not already stored
    if (!localStorageBool) {
        localStorage.setItem(localStorage.length, userInputCity);
        createSearchHistory();
    }
    // OpenWeatherApp API key 
    let APIKey = "870109d2706d7781ec3e7e2c0c95b193";
    // Build the URL for the AJAX call
    let queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + userInputCity + "&appid=" +
        APIKey;
    // AJAX call for current weather data
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        // get current date. the response returns the date and time in unix. these next couple lines of code convert it to a standard format
        let currentDateUnix = response.dt;
        let currentDateMilliseconds = currentDateUnix * 1000;
        let currentDateConverted = new Date(currentDateMilliseconds).toLocaleDateString(
            "en-US");
        // get icon
        let currentWeatherIcon = response.weather[0].icon;
        // get current temperature. the response returns temperature in Kelvin. Kelvin to Fahrenheit: F = (K - 273.15) * 1.80 + 32
        let tempF = ((response.main.temp - 273.15) * 1.80 + 32).toFixed(1);
        // get lat and lon coordinates for the second AJAX call for the uv index and forecast 
        let lat = response.coord.lat;
        let lon = response.coord.lon;
        // attach info to html
        $(".city-date").text(response.name + " (" + currentDateConverted + ")");
        $(".city-date")
            .append($("<img>").attr({
                src: "https://openweathermap.org/img/wn/" +
                    currentWeatherIcon +
                    "@2x.png",
                alt: "icon representation of weather conditions"
            }));
        $(".temperature").text("Temperature: " +
            tempF + "\u00B0F");
        $(".humidity").text("Humidity: " + response.main.humidity + "%");
        // the response returns wind speed in meters/second. convert meters/second to miles/hour with 2.237
        $(".wind-speed").text("Wind Speed: " + ((response.wind.speed) * 2.237).toFixed(1) +
            " MPH");
        // build the URL for the second AJAX call
        let forecastQueryURL = "https://api.openweathermap.org/data/2.5/onecall?lat=" + lat +
            "&lon=" + lon + "&exclude=current,minutely,hourly&appid=" + APIKey;
        // make second AJAX call for the uv index and 5 day weather forecast
        $.ajax({
            url: forecastQueryURL,
            method: "GET"
        }).then(function (responseForecast) {
            // get the uv index
            $(".uv-index").text(responseForecast.daily[0].uvi);
            // call createUVIndexColor function to determine background color depending on uv index 
            createUVIndexColor(responseForecast.daily[0].uvi);
            // clear current forecast information before adding new information 
            $(".forecast").empty();
            // for loop to create 5-day forecast 
            for (let i = 1; i < 6; i++) {
                // get date and append
                $(".forecast-date-" + i).append(new Date(responseForecast.daily[i].dt *
                        1000)
                    .toLocaleDateString("en-US") + "<br>");
                // get icon and append
                $(".forecast-" + i).append($("<img>").attr({
                    src: "https://openweathermap.org/img/wn/" + responseForecast
                        .daily[i].weather[0].icon +
                        "@2x.png",
                    alt: "icon representation of weather conditions"
                }));
                // get temperature and append
                $(".forecast-" + i).append("<br>Temp: " + ((responseForecast.daily[i].temp
                        .day - 273.15) *
                    1.80 + 32).toFixed(2) + " \u00B0F<br>");
                // get humidity and append
                $(".forecast-" + i).append("Humidity: " + responseForecast.daily[i]
                    .humidity + "%<br>");
            }
        });
    });
    // clear input field after createWeatherData function call
    $("#city-input").val("");
}
// this function determines the background color depending on the uv index
function createUVIndexColor(x) {
    //  these if statements determine the background color for the uv index depending on the severity (low: 1-2, moderate: 3-5, high: 6-7, very high: 8-10, extreme: 11+)
    if (x >= 1.00 && x <= 2.99) {
        $("#uvIndexBG").attr("style", "background-color:rgb(67, 185, 30);");
    } else if (x >= 3.00 && x <= 5.99) {
        $("#uvIndexBG").attr("style", "background-color:rgb(252, 199, 33);");
    } else if (x >= 6.00 && x <= 7.99) {
        $("#uvIndexBG").attr("style", "background-color:rgb(251, 116, 27);");
    } else if (x >= 8.00 && x <= 10.99) {
        $("#uvIndexBG").attr("style", "background-color:rgb(248, 17, 22);");
    } else {
        $("#uvIndexBG").attr("style", "background-color:rgb(134, 111, 255);");
    }
}
// create search history list from local storage
function createSearchHistory() {
    $("#search-history").empty();
    let newString = "";
    for (let i = 0; i < localStorage.length; i++) {
        // call capLetters function to properly case the cities
        newString = capLetters(localStorage.getItem(i));
        let cityLi = $("<li>");
        cityLi.attr("data-city", newString);
        cityLi.addClass("list-group-item");
        cityLi.text(newString);
        $("#search-history").append(cityLi);
    }
}
// this function capitalizes the first letter in each word of a string
function capLetters(str) {
    let arrayStr = str.split(" ");
    let capLetter = "";
    let newString = "";
    for (let i = 0; i < arrayStr.length; i++) {
        capLetter = arrayStr[i][0].toUpperCase();
        newString += capLetter + arrayStr[i].slice(1, arrayStr[i].length) + " ";
    }
    return newString.trim();
}
// if the page is refreshed, render the search history list and weather data for the last item in local storage if local storage is not empty 
if (localStorage.length !== 0) {
    createSearchHistory();
    createWeatherData();
}
// check for ajax request errors. if error, alert the user and remove last searched item from local storage because it must be invalid
$(document).ajaxError(function () {
    alert("The city you've searched for is not valid or not in the database!");
    localStorage.removeItem(localStorage.length - 1);
    createSearchHistory();
});