
// Digital time
var KEY_MAIN_CLOCK = 0;

var MAIN_CLOCK_ANALOG = 0;
var MAIN_CLOCK_DIGITAL = 1;

// Second hand
var KEY_SECOND_HAND = 1;

var SECOND_HAND_DISABLED = 0;
var SECOND_HAND_ENABLED = 1;

// Bluetooth
var KEY_BLUETOOTH_ALERT = 2;

var BLUETOOTH_ALERT_DISABLED = 0;  
var BLUETOOTH_ALERT_SILENT = 1;
var BLUETOOTH_ALERT_WEAK = 2;
var BLUETOOTH_ALERT_NORMAL = 3;
var BLUETOOTH_ALERT_STRONG = 4;
var BLUETOOTH_ALERT_DOUBLE = 5;

// weather
var KEY_WEATHER_CODE = 3;
var KEY_WEATHER_TEMP = 4;
var KEY_WEATHER_INTERVAL = 5;
var KEY_JSREADY = 6; 
var KEY_LOCATION_SERVICE = 7;

var LOCATION_AUTOMATIC = 0; 
var LOCATION_MANUAL =  1;
var LOCATION_DISABLED = 2;

var KEY_TEMPERATURE_FORMAT = 8;
var KEY_CITY_NAME = 9;
var KEY_SECONDARY_INFO_TYPE = 10;
var KEY_TIMEZONE_NAME = 11;

var SECONDARY_INFO_DISABLED = 3;
var SECONDARY_INFO_CURRENT_TIME = 1;
var SECONDARY_INFO_CURRENT_LOCATION = 2;
var SECONDARY_INFO_CURRENT_MILITARY_TIME = 4;
//otherwise - timezone offset

var KEY_TIME_SEPARATOR = 12;
  
var TIME_SEPARATOR_COLON = 0;
var TIME_SEPARATOR_DOT = 1;

var KEY_JS_TIMEZONE_OFFSET = 13;

var KEY_SIDEBAR_LOCATION = 14;
  
var SIDEBAR_LOCATION_RIGHT = 0;
var SIDEBAR_LOCATION_LEFT = 1;

var KEY_COLOR_SELECTION = 15;

var COLOR_SELECTION_AUTOMATIC = 0;
var COLOR_SELECTION_CUSTOM = 1;

var KEY_MAIN_BG_COLOR = 16;
var KEY_MAIN_COLOR = 17;
var KEY_SIDEBAR_BG_COLOR = 18;
var KEY_SIDEBAR_COLOR = 19;

var KEY_BLUETOOTH_ICON = 20;

var BLUETOOTH_ICON_ALWAYS_VISIBLE = 0;
var BLUETOOTH_ICON_HIDDEN_WHEN_CONNECTED = 1;
var BLUETOOTH_ICON_ALWAYS_HIDDEN = 2;

var KEY_AMPM_TEXT = 21;
var KEY_WOEID = 22;

// bluetooth vibe patterns
var VIBE_PATTERN_WEAK = [100];
var VIBE_PATTERN_NORMAL = [300];
var VIBE_PATTERN_STRONG = [500];
var VIBE_PATTERN_DOUBLE = [500, 100, 500];

//weather icon size
var ICON_WIDTH = 25;
var ICON_HEIGHT = 20;

// {***************** polyfill for Persitant storage with local storage
function persist_write_int(key, value) {
    localStorage.setItem(key, parseInt(value));
}

function persist_write_string(key, value) {
    localStorage.setItem(key, value);
}

function persist_read_int(key) {
    return parseInt(localStorage.getItem(key));
}

function persist_read_string(key) {
    return localStorage.getItem(key);
}

function persist_exists(key) {
    return (localStorage.getItem(key) !== null);
}

// ***************** polyfill for Persitant storage with local storage }



//polyfill for clock_is_24h_style()

function clock_is_24h_style() {
    var sd = (new Date()).toLocaleString();
    return (sd.indexOf('am') == -1) && (sd.indexOf('AM') == -1) && (sd.indexOf('pm') == -1) && (sd.indexOf('PM') == -1);
}

