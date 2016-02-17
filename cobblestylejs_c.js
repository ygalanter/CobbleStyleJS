// options
var OPT = { // having full URLs here
    IMG_URL: location.href.substring(0, location.href.lastIndexOf("/")) + "/resources/images/",
    FONT_URL: location.href.substring(0, location.href.lastIndexOf("/")) + "/resources/fonts/",
    TRIG_MAX_ANGLE: Math.PI * 2,
    CANVAS: {x:0, y:0, w:144, h:168} // screen size
}

//flags
var flag_main_clock, flag_second_hand, flag_bluetooth_alert, flag_locationService, flag_weatherInterval, flag_secondary_info_type;
var flag_time_separator, flag_js_timezone_offset, flag_sidebar_location, flag_color_selection, flag_bluetooth_icon;
var flag_main_bg_color, flag_main_color, flag_sidebar_bg_color, flag_sidebar_color, flag_temperature_format, flag_woeid;

//variables
var is_bluetooth_buzz_enabled = false, flag_messaging_is_busy = false, flag_js_is_ready = false;
var s_timezone_name = '', s_city_name = '', s_ampm_text = '';
var color_battery_minor, color_battery_major;
var s_temp, s_time, battery_state_charge_percent = 0;

//bitmaps
var meteoicons_all, meteoicon_current, bluetooth_sprite = null;

//fonts
var font_18, font_24, font_27, font_90;

// "layers" - wil lbe using objects with coordinates instead
var s_hands_layer, s_info_layer;

//context & interval
var rocky, tick_interval; 


// opens config page
function open_config() {
    window.open("http://codecorner.galanter.net/pebble/pebstyle_config.html?version=2.12&platform=basalt&return_to=" + encodeURIComponent(location.href + "?config=true&json="), "config", "width=350, height=600, scrollbars=1");
}

// saves new config settings and updates watchface
function save_config(json_string) {

    //getting settings
    var settings = JSON.parse(decodeURIComponent(json_string));

    //storing them
    flag_main_clock = settings.mainClock; persist_write_int(KEY_MAIN_CLOCK, flag_main_clock);
    flag_second_hand = settings.secondHand; persist_write_int(KEY_SECOND_HAND,flag_second_hand);
    flag_bluetooth_alert = settings.bluetoothAlert; persist_write_int(KEY_BLUETOOTH_ALERT,flag_bluetooth_alert);
    flag_bluetooth_icon = settings.bluetoothIcon; persist_write_int(KEY_BLUETOOTH_ICON, flag_bluetooth_icon);
    flag_locationService = settings.locationService; persist_write_int(KEY_LOCATION_SERVICE, flag_locationService);
    flag_woeid = settings.woeid; persist_write_int(KEY_WOEID, flag_woeid);
    flag_weatherInterval = settings.weatherInterval; persist_write_int(KEY_WEATHER_INTERVAL, flag_weatherInterval);
    flag_secondary_info_type = settings.secondaryInfoType; persist_write_int(KEY_SECONDARY_INFO_TYPE, flag_secondary_info_type);
    s_timezone_name = settings.timeZoneName; persist_write_string(KEY_TIMEZONE_NAME, s_timezone_name);
    s_ampm_text = settings.ampmText; persist_write_string(KEY_AMPM_TEXT, s_ampm_text);
    flag_time_separator = settings.timeSeparator; persist_write_int(KEY_TIME_SEPARATOR, flag_time_separator);
    flag_js_timezone_offset = new Date().getTimezoneOffset(); persist_write_int(KEY_JS_TIMEZONE_OFFSET, flag_js_timezone_offset);
    flag_sidebar_location = settings.sidebarLocation; persist_write_int(KEY_SIDEBAR_LOCATION, flag_sidebar_location);
    flag_main_bg_color = settings.mainBgColor; persist_write_int(KEY_MAIN_BG_COLOR, flag_main_bg_color);
    flag_main_color = settings.mainColor; persist_write_int(KEY_MAIN_COLOR, flag_main_color);
    flag_sidebar_bg_color = settings.sidebarBgColor; persist_write_int(KEY_SIDEBAR_BG_COLOR, flag_sidebar_bg_color);
    flag_sidebar_color = settings.sidebarColor; persist_write_int(KEY_SIDEBAR_COLOR, flag_sidebar_color);
    flag_color_selection = settings.colorSelection; persist_write_int(KEY_COLOR_SELECTION, flag_color_selection);
    flag_temperature_format = settings.temperatureFormat; persist_write_int(KEY_TEMPERATURE_FORMAT, flag_temperature_format);


    // ************** Color update
    if (flag_color_selection == COLOR_SELECTION_CUSTOM) {
        color_battery_major = flag_sidebar_bg_color;
        color_battery_minor = flag_sidebar_bg_color;  
    } else { // otherwise assigning default colors
         
        //** TODO: See how to do ths
        //replace_gbitmap_color(flag_sidebar_color, GColorBlack, meteoicons_all, NULL);

        flag_main_bg_color = GColorBlack;
        flag_main_color = GColorWhite;
        flag_sidebar_bg_color = GColorJaegerGreen;
        flag_sidebar_color = GColorBlack;

        //updating colors based on battery
        change_battery_color();
    }

    // ************* Sidebar & time update
    set_sidebar_location(flag_sidebar_location);
    change_time_tick_inteval();

    // *********** weather update
    update_weather();

    //************ bluetooth update
    bluetooth_handler(true);

    rocky.mark_dirty();

}



function bluetooth_handler(connected) {
  
  if (connected){ // on bluetooth reconnect - update weather
    update_weather();
  } 
  
    if (bluetooth_sprite != null) {
        gbitmap_destroy(bluetooth_sprite);
        bluetooth_sprite = null;
    }
  
    // if Bluetooth alert is totally disabled - exit from here
    if (flag_bluetooth_alert == BLUETOOTH_ALERT_DISABLED) return;  
  
    if (connected) {
    
        if (flag_bluetooth_icon == BLUETOOTH_ICON_ALWAYS_VISIBLE)  { // only display "connected" icon if it's not "hide when coonected" or "always hide"
            bluetooth_sprite = gbitmap_create(OPT.IMG_URL + "bw_bluetooth-24-connected.png");
            if (flag_color_selection == COLOR_SELECTION_CUSTOM) { // in custom color mode colorin bitmaps as well
                // TODO: HOW TO DO THIS??
                //replace_gbitmap_color(GColorWhite, flag_main_color, bluetooth_sprite, NULL);
            }
        }  
    } else {
        if (flag_bluetooth_icon != BLUETOOTH_ICON_ALWAYS_HIDDEN)  { // only display "disconnected" icon if it's either "always visible" or "hide when conected"
            bluetooth_sprite = gbitmap_create(OPT.IMG_URL + "bw_bluetooth-24-disconnected~color.png");
        }  
    }
  
    rocky.mark_dirty();
  
    // if this is initial load OR bluetooth alert is silent return without buzz
    if (flag_bluetooth_alert == BLUETOOTH_ALERT_SILENT || is_bluetooth_buzz_enabled == false) return;
    
    switch (flag_bluetooth_alert){
        case BLUETOOTH_ALERT_WEAK:
            navigator.vibrate(VIBE_PATTERN_WEAK);
            break;
        case BLUETOOTH_ALERT_NORMAL:
            navigator.vibrate(VIBE_PATTERN_NORMAL);
            break;
        case BLUETOOTH_ALERT_STRONG:
            navigator.vibrate(VIBE_PATTERN_STRONG);
            break;
        case BLUETOOTH_ALERT_DOUBLE:
            navigator.vibrate(VIBE_PATTERN_DOUBLE);
            break;    
    }
  
  
}  



function getWeather(woeid) {  
  
    var temperature;
    var icon;
    var city;
  
    var query = 'select item.condition, location.city from weather.forecast where woeid =  ' + woeid + ' and u="' + (flag_temperature_format === 0? 'f' : 'c') + '"';
    var url = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + '&format=json&env=store://datatables.org/alltableswithkeys';

    // Send request to Yahoo
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {

        // getting weathe results
        var json = JSON.parse(this.responseText);
        temperature = json.query.results.channel.item.condition.temp;
        icon = json.query.results.channel.item.condition.code;
        city = json.query.results.channel.location.city;

        persist_write_int(KEY_WEATHER_TEMP, temperature);
        set_temperature(temperature);

        persist_write_int(KEY_WEATHER_CODE, icon);
        set_weather_icon(icon);

        persist_write_string(KEY_CITY_NAME, city);
        s_city_name = city;

        rocky.mark_dirty();
           
    

    };
    xhr.open('GET', url);
    xhr.send();
}




// on location success querying woeid and getting weather
function locationSuccess(pos) {
    // We neeed to get the Yahoo woeid first
    var woeid;

    var query = 'select locality1 from geo.places where text="(' + pos.coords.latitude + ',' + pos.coords.longitude + ')" limit 1';
    var url = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + '&format=json';

    // Send request to Yahoo
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        var json = JSON.parse(this.responseText);
        woeid = json.query.results.place.locality1.woeid;
        getWeather(woeid);
    };
    xhr.open('GET', url);
    xhr.send();
}




function locationError(err) {
    //console.log ("\n++++ I am inside of 'locationError: Error requesting location!");
}




// Get Location lat+lon
function getLocation() {
    navigator.geolocation.getCurrentPosition(
      locationSuccess,
      locationError,
      {timeout: 15000, maximumAge: 60000}
    );
}



// calling for weather update
function update_weather() {

    if (flag_locationService != LOCATION_DISABLED) {

        if (flag_locationService == LOCATION_MANUAL) { // for manual location - request weather right away
            getWeather(flag_woeid);
        } else {
            getLocation();  // for automatic location - get location
        }

    }

}

// changing color according to battery
function change_battery_color() {

    // don't color according to battery level if colors are set to custom
    if (flag_color_selection == COLOR_SELECTION_CUSTOM) return;

    switch (battery_state_charge_percent) {
        case 100:
        case 90:
        case 80:
        case 70:
        case 60:
        case 50: color_battery_major = GColorJaegerGreen; color_battery_minor = GColorDarkGreen; break;
        case 40:
        case 30:
        case 20: color_battery_major = GColorOrange; color_battery_minor = GColorDarkCandyAppleRed; break;
        case 10:
        case 0: color_battery_major = GColorDarkCandyAppleRed; color_battery_minor = GColorBulgarianRose; break;
    }

    rocky.mark_dirty();

}


// updating battery status
function battery_handler(evt) {

    // update battery percentage from change event
    battery_state_charge_percent = Math.floor(evt.currentTarget.level * 100);

    // and chage color according to battery
    change_battery_color();

}


// showing temp
function set_temperature(w_current) {
    s_temp = w_current + "\u00B0";
    rocky.mark_dirty();
}

//showing weather icon
function set_weather_icon(w_icon) {

   if (w_icon < 0 || w_icon > 47) {w_icon = 48;}  // in case icon not available - show "N/A" icon
  
   if (meteoicon_current)  gbitmap_destroy(meteoicon_current);

    // *** TODO: Find substitution for "gbitmap_create_as_sub_bitmap"
    // meteoicon_current = gbitmap_create_as_sub_bitmap(meteoicons_all, GRect(0, ICON_HEIGHT * w_icon, ICON_WIDTH, ICON_HEIGHT));
    // meawhile use individual split icons
   meteoicon_current = gbitmap_create(OPT.IMG_URL + "meteo_icon_" + w_icon + ".png");
    
   rocky.mark_dirty();
}



// sets location of the sidebar (
function set_sidebar_location(sidebar_location) {
    if (sidebar_location == SIDEBAR_LOCATION_RIGHT) {
        s_hands_layer = { x: OPT.CANVAS.x, y: OPT.CANVAS.y, w: OPT.CANVAS.w - 32, h: OPT.CANVAS.h };
        s_info_layer = { x: OPT.CANVAS.w - 32, y: OPT.CANVAS.y, w: 32, h: OPT.CANVAS.h };
    } else {
        s_hands_layer = { x: OPT.CANVAS.x + 32, y: OPT.CANVAS.y, w: OPT.CANVAS.w - 32, h: OPT.CANVAS.h };
        s_info_layer = { x: OPT.CANVAS.x, y: OPT.CANVAS.y, w: 32, h: OPT.CANVAS.h };
    }
}


// changes tick inteval to second or minute, depending on flags
function change_time_tick_inteval() {
  
    clearInterval(tick_interval); // unsubscribing from old interval

    //TODO: If interval is set to minute - make sure it ticks on real-time minute change!
  
    if (flag_main_clock == MAIN_CLOCK_DIGITAL || flag_second_hand == SECOND_HAND_DISABLED) { // if digital face is hidden or second hand disabled
        tick_interval = setInterval(function () { rocky.mark_dirty(); }, 60*1000); // setting interval to minute
    } else { // otherwise setting interval to second
        tick_interval = setInterval(function () { rocky.mark_dirty(); }, 1000); // setting interval to second
    }
  
    rocky.mark_dirty();
  
}

// redraws sidebar
function info_update_proc(ctx) {

    var bounds = s_info_layer; if (typeof (bounds) == 'undefined') return;

    {//***************************** setting background *****************************
        graphics_context_set_fill_color(ctx, color_battery_major);
        graphics_fill_rect(ctx, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 4 : 0), bounds.y, 28, bounds.h), 0, GCornerNone);

        graphics_context_set_fill_color(ctx, color_battery_minor);
        graphics_fill_rect(ctx, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 2 : 28), bounds.y, 2, bounds.h), 0, GCornerNone);

        graphics_context_set_fill_color(ctx, flag_main_color);
        graphics_fill_rect(ctx, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 0 : 30), bounds.y, 2, bounds.h), 0, GCornerNone);
    }//***************************** setting background *****************************

    {// *************************displaying date ********************
        graphics_context_set_text_color(ctx, flag_sidebar_color);

        // day of the week
        graphics_draw_text(ctx, moment().format("ddd"), font_18, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 4 : 1), bounds.y, 28, 20), GTextOverflowModeFill, GTextAlignmentCenter, null);

        // day of the month    
        graphics_draw_text(ctx, moment().format("DD"), font_27, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 4 : 1), bounds.y + 16, 28, 25), GTextOverflowModeFill, GTextAlignmentCenter, null);

        // month  
        graphics_draw_text(ctx, moment().format("MMM"), font_18, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 4 : 1), bounds.y + 16 + 28, 28, 20), GTextOverflowModeFill, GTextAlignmentCenter, null);

    }//************************* displaying date ********************

    {//***************************** displaying battery *****************************
        graphics_context_set_fill_color(ctx, flag_sidebar_color);
        graphics_fill_rect(ctx, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 6 : 2), bounds.h / 2 - 7, 24, 14), 1, GCornersAll);

        graphics_context_set_fill_color(ctx, color_battery_major);
        graphics_fill_rect(ctx, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 6 : 2) + 2, bounds.h / 2 - 7 + 1, 24 - 4, 14 - 2), 0, GCornerNone);

        graphics_context_set_fill_color(ctx, flag_sidebar_color);
        graphics_fill_rect(ctx, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 6 : 2) + 2 + 1, bounds.h / 2 - 7 + 1 + 1, (24 - 4 - 2) * battery_state_charge_percent / 100, 14 - 2 - 2), 0, GCornerNone);

        // battery text
        graphics_draw_text(ctx, battery_state_charge_percent.toString(), font_24, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 4 : 1), bounds.h / 2 + 8, 28, 20), GTextOverflowModeFill, GTextAlignmentCenter, null);


      }//***************************** displaying battery *****************************  

        {//***************************** displaying weather *****************************
            if (flag_locationService != LOCATION_DISABLED) {

                graphics_draw_text(ctx, s_temp, font_18, GRect(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 5 : 2), bounds.h - 20, 28, 20), GTextOverflowModeWordWrap, GTextAlignmentCenter, null);
                graphics_context_set_compositing_mode(ctx, GCompOpSet);

                if (meteoicon_current) graphics_draw_bitmap_in_rect(ctx, meteoicon_current, GRect(bounds.x + (flag_sidebar_location ==  SIDEBAR_LOCATION_RIGHT? 5 : 2), bounds.h - 41, ICON_WIDTH, ICON_HEIGHT));

            }
        }//***************************** displaying weather *****************************

        {//***************************** drawing separators *****************************
            graphics_context_set_stroke_color(ctx, flag_sidebar_color);
            graphics_draw_line(ctx, GPoint(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 6 : 2), bounds.y + 69), GPoint(bounds.x + bounds.w - (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 3 : 7), bounds.y + 69));
            graphics_draw_line(ctx, GPoint(bounds.x + (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 6 : 2), bounds.y + 123), GPoint(bounds.x + bounds.w - (flag_sidebar_location == SIDEBAR_LOCATION_RIGHT ? 3 : 7), bounds.y + 123));


        }//***************************** drawing separators *****************************  


    }




    // redraws main screen - analog & digital time
    function hands_update_proc(ctx) {

        var bounds = s_hands_layer; if (typeof (bounds) == 'undefined') return;
        var center = grect_center_point(bounds);

        graphics_context_set_fill_color(ctx, flag_main_bg_color);
        graphics_fill_rect(ctx, bounds, 0, GCornerNone);

        var max_hand_length = bounds.w / 2 - 2;

        var now = new Date();
        var tm_hour = now.getHours();
        var tm_min = now.getMinutes();
        var tm_sec = now.getSeconds();


        if ((!(tm_min % flag_weatherInterval)) && (tm_sec == 0)) { // on configured weather interval change - update the weather
            update_weather();
        } 


        if (flag_main_clock == MAIN_CLOCK_ANALOG) { // only displaying analog time if large digial is not enabled
            {//************************ drawing hands ****************************

                // ******************* hour hand
                var angle = (OPT.TRIG_MAX_ANGLE * (((tm_hour % 12) * 6) + (tm_min / 10))) / (12 * 6);


                var hand_endpoint = {
                    x: (Math.sin(angle) * (max_hand_length - 15)) + center.x,
                    y: (-Math.cos(angle) * (max_hand_length - 15)) + center.y,
                };

                //color under hand
                graphics_context_set_stroke_color(ctx, flag_main_bg_color);
                graphics_context_set_stroke_width(ctx, 4);
                graphics_draw_line(ctx, center, hand_endpoint);

                graphics_context_set_stroke_color(ctx, flag_main_color);
                graphics_context_set_stroke_width(ctx, 2);
                graphics_draw_line(ctx, center, hand_endpoint);

                // ******************** minute hand
                angle = OPT.TRIG_MAX_ANGLE * tm_min / 60;

                hand_endpoint.x = (Math.sin(angle) * max_hand_length) + center.x;
                hand_endpoint.y = (-Math.cos(angle) * max_hand_length) + center.y;

                //color under hand
                graphics_context_set_stroke_color(ctx, flag_main_bg_color);
                graphics_context_set_stroke_width(ctx, 4);
                graphics_draw_line(ctx, center, hand_endpoint);

                graphics_context_set_stroke_color(ctx, flag_main_color);
                graphics_context_set_stroke_width(ctx, 2);
                graphics_draw_line(ctx, center, hand_endpoint);

                graphics_context_set_stroke_width(ctx, 1); //resetting for second hand and inner circle

                // ***************** second hand
                if (flag_second_hand == SECOND_HAND_ENABLED) {
                    angle = OPT.TRIG_MAX_ANGLE * tm_sec / 60;

                    hand_endpoint.x = (Math.sin(angle) * max_hand_length) + center.x;
                    hand_endpoint.y = (-Math.cos(angle) * max_hand_length) + center.y;

                    graphics_context_set_stroke_color(ctx, color_battery_major);
                    graphics_draw_line(ctx, center, hand_endpoint);
                }

                // first circle in the middle
                graphics_context_set_fill_color(ctx, flag_main_color);
                graphics_fill_circle(ctx, center, 5);

                // second circle in the middle
                graphics_context_set_stroke_color(ctx, color_battery_minor);
                graphics_draw_circle(ctx, center, 3);
            }//************************ drawing hands **************************** 
        }


        var format;
        var large_ampm;

        graphics_context_set_text_color(ctx, flag_main_color);

        {//************************ drawing large text time **************************** 
            if (flag_main_clock == MAIN_CLOCK_DIGITAL) { // only displaying large text time if main mode is digital

                // if custom am/pm text is passed - draw it instead of am/pm
                if (s_ampm_text != '') {

                    if (s_ampm_text.length > 13) {
                        graphics_draw_text(ctx, s_ampm_text, font_18, GRect(bounds.x, bounds.h - (bluetooth_sprite === null ? 150 : 140), bounds.w, 30), GTextOverflowModeWordWrap, GTextAlignmentCenter, null);
                    } else {
                        graphics_draw_text(ctx, s_ampm_text, font_24, GRect(bounds.x, bounds.h - (bluetooth_sprite === null ? 150 : 130), bounds.w, 30), GTextOverflowModeFill, GTextAlignmentCenter, null);
                    }

                }


                // building format 12h/24h
                if (clock_is_24h_style()) {
                    format = flag_time_separator == TIME_SEPARATOR_DOT ? "HH.mm" : "HH:mm"; // e.g "14:46"
                } else {
                    format = flag_time_separator == TIME_SEPARATOR_DOT ? "h.mm" : "h:mm"; // e.g " 2:46" -- with leading space
                    // only draw am/pm if there's no custom am/pm text
                    if (s_ampm_text == '') {
                        large_ampm = moment().format("A");
                        graphics_draw_text(ctx, large_ampm, font_24, GRect(bounds.x, bounds.h - 130, bounds.w, 30), GTextOverflowModeFill, GTextAlignmentCenter, null);
                    }

                }

                s_time = moment().format(format);

                graphics_draw_text(ctx, s_time, font_90, GRect(bounds.x, bounds.y + 55, bounds.w, 70), GTextOverflowModeWordWrap, GTextAlignmentCenter, null);
            }
        }//************************ drawing large text time ****************************  


        {//************************ drawing secondary info line **************************** 

            switch (flag_secondary_info_type) {
                case SECONDARY_INFO_DISABLED:
                    break;
                case SECONDARY_INFO_CURRENT_LOCATION:
                    graphics_draw_text(ctx, s_city_name, font_24, GRect(bounds.x, bounds.h - 27, bounds.w, 30), GTextOverflowModeFill, GTextAlignmentCenter, null);
                    break;
                case SECONDARY_INFO_CURRENT_MILITARY_TIME:
                case SECONDARY_INFO_CURRENT_TIME:
                    // building format 12h/24h/military
                    if (clock_is_24h_style() || flag_secondary_info_type == SECONDARY_INFO_CURRENT_MILITARY_TIME) {
                        format = flag_time_separator == TIME_SEPARATOR_DOT ? "HH.mm" : "HH:mm"; // e.g "14:46"
                    } else {
                        format = flag_time_separator == TIME_SEPARATOR_DOT ? "h.mm A" : "h:mm A"; // e.g " 2:46" -- with leading space
                    }

                    s_time = moment().format(format);

                    graphics_draw_text(ctx, s_time, font_24, GRect(bounds.x, bounds.h - 27, bounds.w, 30), GTextOverflowModeFill, GTextAlignmentCenter, null);
                    break;
                default: // displaying time in different timezone

                    // building format 12h/24h
                    if (clock_is_24h_style()) {
                        format = flag_time_separator == TIME_SEPARATOR_DOT ? "HH.mm" : "HH:mm"; // e.g "14:46"
                    } else {
                        format = flag_time_separator == TIME_SEPARATOR_DOT ? "h.mm A" : "h:mm A"; // e.g " 2:46" -- with leading space
                    }


                    s_city_name = s_timezone_name + ' ' + moment.utc().add(flag_secondary_info_type, "minutes").format(format); //adding timezone time

                    graphics_draw_text(ctx, s_city_name, font_24, GRect(bounds.x, bounds.h - 27, bounds.w, 30), GTextOverflowModeFill, GTextAlignmentCenter, null);
                    break;

            }
        }//************************ drawing secondary info line ****************************   



        {//************************ drawing bluetooth **************************** 
            if (bluetooth_sprite != null) {
                graphics_context_set_compositing_mode(ctx, GCompOpSet);
                graphics_draw_bitmap_in_rect(ctx, bluetooth_sprite, GRect(bounds.w/2 - 8, 3, 16, 22));
            }  
        }//************************ drawing bluetooth ****************************   



    }



    // main update procs - called to redraw everything
    main_update_proc = function (ctx, bounds) {

        hands_update_proc(ctx); // updating main screen - analog & digital time
        info_update_proc(ctx); // updating sidebar

    };


    // intializing clock
    function init() {

        // initializing context
        rocky = Rocky.bindCanvas(document.getElementById("pebble"));
        rocky.export_global_c_symbols();
        
        //loading custom fonts

        if (location.href.indexOf("http://localhost") == 0) { // system fonts for local testing
            font_18 = fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);
            font_24 = fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD);
            font_27 = fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD);
            font_90 = fonts_get_system_font(FONT_KEY_BITHAM_42_BOLD);

        } else { //real fonts for remote deploy
            font_18 = fonts_load_custom_font({ height: 18, url: OPT.FONT_URL + 'Big_Noodle_Titling_Cyr.ttf' });
            font_24 = fonts_load_custom_font({ height: 24, url: OPT.FONT_URL + 'Big_Noodle_Titling_Cyr.ttf' });
            font_27 = fonts_load_custom_font({ height: 27, url: OPT.FONT_URL + 'Big_Noodle_Titling_Cyr.ttf' });
            font_90 = fonts_load_custom_font({ height: 50, url: OPT.FONT_URL + 'Big_Noodle_Titling_Cyr.ttf' }); /*WANT 65*/
        }
        

        //loading presets
        flag_main_clock = persist_exists(KEY_MAIN_CLOCK) ? persist_read_int(KEY_MAIN_CLOCK) : MAIN_CLOCK_ANALOG;
        flag_second_hand = persist_exists(KEY_SECOND_HAND) ? persist_read_int(KEY_SECOND_HAND) : SECOND_HAND_ENABLED;
        flag_bluetooth_alert = persist_exists(KEY_BLUETOOTH_ALERT) ? persist_read_int(KEY_BLUETOOTH_ALERT) : BLUETOOTH_ALERT_WEAK;
        flag_bluetooth_icon = persist_exists(KEY_BLUETOOTH_ICON) ? persist_read_int(KEY_BLUETOOTH_ICON) : BLUETOOTH_ICON_ALWAYS_VISIBLE;
        flag_locationService = persist_exists(KEY_LOCATION_SERVICE) ? persist_read_int(KEY_LOCATION_SERVICE) : LOCATION_AUTOMATIC;
        flag_woeid = persist_exists(KEY_WOEID) ? persist_read_int(KEY_WOEID) : 0;
        flag_weatherInterval = persist_exists(KEY_WEATHER_INTERVAL) ? persist_read_int(KEY_WEATHER_INTERVAL) : 60; // default weather update is 1 hour
        flag_secondary_info_type = persist_exists(KEY_SECONDARY_INFO_TYPE) ? persist_read_int(KEY_SECONDARY_INFO_TYPE) : SECONDARY_INFO_CURRENT_TIME;
        flag_time_separator = persist_exists(KEY_TIME_SEPARATOR) ? persist_read_int(KEY_TIME_SEPARATOR) : TIME_SEPARATOR_COLON;
        flag_js_timezone_offset = persist_exists(KEY_JS_TIMEZONE_OFFSET) ? persist_read_int(KEY_JS_TIMEZONE_OFFSET) : 0;
        flag_sidebar_location = persist_exists(KEY_SIDEBAR_LOCATION) ? persist_read_int(KEY_SIDEBAR_LOCATION) : SIDEBAR_LOCATION_RIGHT;
        s_city_name = persist_exists(KEY_CITY_NAME) ? persist_read_string(KEY_CITY_NAME) : "";
        s_timezone_name = persist_exists(KEY_TIMEZONE_NAME) ? persist_read_string(KEY_TIMEZONE_NAME) : "";
        s_ampm_text = persist_exists(KEY_AMPM_TEXT) ? persist_read_string(KEY_AMPM_TEXT) : "";
        flag_temperature_format = persist_exists(KEY_TEMPERATURE_FORMAT) ? persist_read_int(KEY_TEMPERATURE_FORMAT) : 0;

        //loading custom colors
        flag_color_selection = persist_exists(KEY_COLOR_SELECTION) ? persist_read_int(KEY_COLOR_SELECTION) : COLOR_SELECTION_AUTOMATIC;
        flag_main_bg_color = persist_exists(KEY_MAIN_BG_COLOR) ? persist_read_int(KEY_MAIN_BG_COLOR) : GColorBlack;
        flag_main_color = persist_exists(KEY_MAIN_COLOR) ? persist_read_int(KEY_MAIN_COLOR) : GColorWhite;
        flag_sidebar_bg_color = persist_exists(KEY_SIDEBAR_BG_COLOR) ? persist_read_int(KEY_SIDEBAR_BG_COLOR) : GColorJaegerGreen;
        flag_sidebar_color = persist_exists(KEY_SIDEBAR_COLOR) ? persist_read_int(KEY_SIDEBAR_COLOR) : GColorBlack;

        // if it's a manual color selection - setting battery/second hand to manual
        if (flag_color_selection == COLOR_SELECTION_CUSTOM) {
            color_battery_major = flag_sidebar_bg_color;
            color_battery_minor = flag_sidebar_bg_color;
        } else { // otherwise assigning default colors
            flag_main_bg_color = GColorBlack;
            flag_main_color = GColorWhite;
            flag_sidebar_bg_color = GColorJaegerGreen;
            flag_sidebar_color = GColorBlack;

            color_battery_minor = GColorDarkGreen;
            color_battery_major = GColorJaegerGreen;
        }


        //// ** TODO: Implement bluetooth? 
        //is_bluetooth_buzz_enabled = false;
        //bluetooth_connection_service_subscribe(bluetooth_handler);
        //bluetooth_handler(bluetooth_connection_service_peek());
        //is_bluetooth_buzz_enabled = true;  
        ////*** for now just display CONNECTED icon
        bluetooth_handler(true);

        meteoicons_all = gbitmap_create(OPT.IMG_URL + "meteocons_Yahoo_Order_V3-25x20px-12-23-2015.png");

        // ** TODO: See how to do this!
        //if (flag_color_selection == COLOR_SELECTION_CUSTOM) { // in custom color mode colorin bitmaps as well
        //    replace_gbitmap_color(GColorBlack, flag_sidebar_color, meteoicons_all, NULL);
        //}

       
        // showing previously saved weather without waiting for update
        if (flag_locationService != LOCATION_DISABLED) {
            // reading stored value
            if (persist_exists(KEY_WEATHER_CODE)) set_weather_icon(persist_read_int(KEY_WEATHER_CODE));
            if (persist_exists(KEY_WEATHER_TEMP)) set_temperature(persist_read_int(KEY_WEATHER_TEMP));
        }

        // Get battery status as soon as it's available
        Battery.getStatus(function (state, error) {
            if (error) {
                console.error('Battery status is not supported');
                return;
            }

            // getting current battery percentage and setting colors accordingly
            battery_state_charge_percent = Math.floor(state.level * 100);
            change_battery_color()
            
        });

        // Register a handler to get notified when battery status changes
        Battery.onUpdate(battery_handler);

        
        //doing initial weather update
        update_weather();


        //setting sidebar location and kicking off timer
        set_sidebar_location(flag_sidebar_location);
        change_time_tick_inteval();

        rocky.update_proc = main_update_proc;

    }




    // start it all
    init();


 
 

 