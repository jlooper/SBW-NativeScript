
var observable = require("data/observable");
var http = require("http");
var moment = require("moment");
var dialogs = require("ui/dialogs");
var forecast_key = 'c9002942b156fa5d0583934e2b1eced8';
var platformModule = require("platform");
var locationModule = require("location");
var locationManager = require("location").LocationManager;
var appSettings = require("application-settings");
var frameModule = require("ui/frame");

var WeatherModel = new observable.Observable();

if (platformModule.device.os == 'iOS'){

    frameModule.topmost().ios.navBarVisibility = "never";

    var ll;


    ll = (function (_super) {
        __extends(ll, _super);
        function ll() {
            _super.apply(this, arguments);
        }
        ll.new = function () {
            return _super.new.call(this);
        };
     
        ll.prototype.locationManagerDidChangeAuthorizationStatus = function (manager, status) {
            var s = WeatherModel.getStatus(status);
            console.log(s)
            if(s == "AuthorizationStatusAuthorizedWhenInUse" || s == "AuthorizationStatusAuthorized" || s == "AuthorizationStatusRestricted"){
                //get the stuff!
                WeatherModel.getLocation();
            }
        };
     
        ll.ObjCProtocols = [CLLocationManagerDelegate];
        return ll;
    })(NSObject);
   
    var locationDelegate = ll.new();

}

WeatherModel.getStatus = function(status){
    var statusString = "";
    switch (status) {
        case CLAuthorizationStatus.kCLAuthorizationStatusNotDetermined:
            statusString = "AuthorizationStatusNotDetermined";
            break;
        case CLAuthorizationStatus.kCLAuthorizationStatusRestricted:
            statusString = "AuthorizationStatusRestricted";
            break;
        case CLAuthorizationStatus.kCLAuthorizationStatusDenied:
            statusString = "AuthorizationStatusDenied";
            break;
        case CLAuthorizationStatus.kCLAuthorizationStatusAuthorized:
            statusString = "AuthorizationStatusAuthorized";
            break;
        case CLAuthorizationStatus.kCLAuthorizationStatusAuthorizedAlways:
            statusString = "AuthorizationStatusAuthorizedAlways";
            break;
        case CLAuthorizationStatus.kCLAuthorizationStatusAuthorizedWhenInUse:
            statusString = "AuthorizationStatusAuthorizedWhenInUse";
            break;
    }
    
    return statusString;

}   


WeatherModel.getLocation = function(){

    

    var isEnabled = locationManager.isEnabled();
    console.log("locationManager is enabled? ",isEnabled)
        if(isEnabled){

        locationModule.getLocation({ maximumAge: 30000, timeout: 1000 }).then(function (location) {                     
                appSettings.setNumber("lat", location.latitude);
                appSettings.setNumber("long", location.longitude);                
                lat = parseFloat(appSettings.getNumber("lat"));
                long = parseFloat(appSettings.getNumber("long"));
                WeatherModel.getTodaysWeather(lat,long);
                WeatherModel.getDepartureWeather();
            }, function (error) {
                console.log("there was an error ",error)
                var message = 'There was an error finding your location. Please check your settings and refresh this page!';
                dialogs.alert({title: "Sorry!", message: message, okButtonText: "OK!",});
            });
            
        }
        else {
            
            dialogs.alert("To get your weather forecast, we need your location!").then(function() {
                
                if (platformModule.device.os == 'iOS'){

                    var iosLocationManager = CLLocationManager.alloc().init(); 
                    iosLocationManager.delegate = locationDelegate;         
                    iosLocationManager.requestWhenInUseAuthorization();
                    
               }

               if (platformModule.device.os == 'Android') {
                 //(<android.app.Activity>appModule.android.currentContext).startActivityForResult(new android.content.Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS), 0);
               }

            });
        }
}

/*WeatherModel.setLocation = function(){
    
    locationManager.startLocationMonitoring(function (location) {
        
        appSettings.setNumber("lat", location.latitude);
        appSettings.setNumber("long", location.longitude);
        
        lat = parseFloat(appSettings.getNumber("lat"));
        long = parseFloat(appSettings.getNumber("long"));
                
        WeatherModel.getTodaysWeather(lat,long);
        WeatherModel.getDepartureWeather();
        

            }, function (error) {
                var message = error;
                dialogs.alert({title: "Sorry!", message: message, okButtonText: "OK!",});                
            });
}*/

WeatherModel.setTransportation = function(trans){
    appSettings.setString("transportation",'res://'+trans+'')
    WeatherModel.set("transportation", 'res://'+trans+'');
}

WeatherModel.getFahrenheitImage = function(temp,icon){
    if(temp >= 70){
        if(icon == 'rain'){
            //rain
            WeatherModel.set("catImg", 'res://rainbg');
        }
        else{
            //hot
            WeatherModel.set("catImg", 'res://hotbg');
        } 
    }
    else if(temp >= 50 && temp < 70){
        if(icon == 'rain'){
            //rain
            WeatherModel.set("catImg", 'res://rainbg');
        }
        else{
            //warm
            WeatherModel.set("catImg", 'res://warmbg');
        } 
    }
    else if(temp >= 32 && temp < 50){
        if(icon == 'rain'){
            //rain
            WeatherModel.set("catImg", 'res://rainbg');
        }
        else{
            //cold
            WeatherModel.set("catImg", 'res://coldbg');
        }
    }
    else if(temp < 32){
        //snow
        WeatherModel.set("catImg", 'res://snowbg');
    }
}
WeatherModel.getCelsiusImage = function(temp,icon){
    if(temp >= 21){
        if(icon == 'iconrain'){
            //rain
            WeatherModel.set("catImg", 'res://rainbg');
        }
        else{
            //hot
            WeatherModel.set("catImg", 'res://hotbg');
        } 
    }
    else if(temp >= 10 && temp < 21){
        if(icon == 'iconrain'){
            //rain
            WeatherModel.set("catImg", 'res://rainbg');
        }
        else{
            //warm
            WeatherModel.set("catImg", 'res://warmbg');
        } 
    }
    else if(temp >= 0 && temp < 10){
        if(icon == 'iconrain'){
            //rain
            WeatherModel.set("catImg", 'res://rainbg'); 
        }
        else{
            //cold
            WeatherModel.set("catImg", 'res://coldbg');
        }
    }
    else if(temp < 0){
        //snow
        WeatherModel.set("catImg", 'res://snowbg');
    }
}
WeatherModel.getTodaysWeather = function(lat,long) {

    //check whether we need celsius or fahrenheit
    
    var url = 'https://api.forecast.io/forecast/' + forecast_key + '/' + lat + ',' + long + '';

    mode = appSettings.getString("mode"); 
    

    if(mode=="C"){
        url = url + "?units=si";
    }
    else{
        url = url + "?units=us";
    }

        http.request({ url: url, method: "GET" }).then(function (response) {

            WeatherModel.set("isLoading",true);
            
            var obj = response.content.toJSON();
            var tmpCurrTemp = JSON.stringify(obj.currently.temperature).toString().split('.');
            var tmp_split = tmpCurrTemp[0]
            var tmpIcon = eval(JSON.stringify(obj.currently.icon))

            //get the zone offset
            var zone = obj.timezone;
            
            //replace all occurrences of '-'
            var tmpNowIcon = tmpIcon.split("-").join("");

            var five_day_summary = JSON.stringify(obj.daily.summary);
            WeatherModel.set("weeklySummary",JSON.parse(five_day_summary));            
            
            for (i = 0; i < obj.daily.data.length; i++) { 
                WeatherModel.set("day"+i+"time",moment.utc(obj.daily.data[i].time, 'X').format('dddd'));
                WeatherModel.set("day"+i+"summary",obj.daily.data[i].summary);
                var ni = obj.daily.data[i].icon;
                var nowIcon = ni.split("-").join("");
                WeatherModel.set("day"+i+"icon",'res://'+nowIcon+'');
                var tmin = JSON.stringify(obj.daily.data[i].temperatureMin).toString().split('.');
                var tmax = JSON.stringify(obj.daily.data[i].temperatureMax).toString().split('.');
                var min = tmin[0];
                var max = tmax[0];
                WeatherModel.set("day"+i+"minmax",'Temperatures between ' +min+ ' and '  +max+  ' ' + mode);                             
            }
            //hourly forecast
            var ten_hour_summary = JSON.stringify(obj.hourly.summary);
            WeatherModel.set("hourlySummary",JSON.parse(ten_hour_summary));
            for (j = 0; j < obj.hourly.data.length; j++) { 
                var d = moment.unix(obj.hourly.data[j].time).format('h:ss a');
                WeatherModel.set("hour"+j+"time",d);
                var hi = obj.hourly.data[j].icon;
                var hourIcon = hi.split("-").join("");
                WeatherModel.set("hour"+j+"icon",'res://'+hourIcon+'');
                var thour = JSON.stringify(obj.hourly.data[j].temperature).toString().split('.');
                var temp = thour[0];
                WeatherModel.set("hour"+j+"temp",temp);
                WeatherModel.set("hour"+j+"summary",obj.hourly.data[j].summary);
            }
            WeatherModel.set("currentTemp", tmp_split + ' ' + mode);
            WeatherModel.set("nowIcon", 'res://'+tmpNowIcon+'');
            //dialogs.alert('We got your weather! You may need to refresh the page.');
            WeatherModel.set("isLoading",false);           
        }, function (e) {
            WeatherModel.set("isLoading",false);
            done(e);
        });
}
WeatherModel.getDepartureWeather = function(){


    //timed departure
    lat = appSettings.getNumber("lat");
    long = appSettings.getNumber("long");
    mode = appSettings.getString("mode");
    hour = appSettings.getString("hour");
    minute = appSettings.getString("minute");
    
    if (hour<10) hour = "0" + hour;
    if (minute > 0 && minute < 10) minute = "0" + minute;
    var todays_date = moment().format('YYYY-MM-DD').toString();
    var departure_time = todays_date+'T'+hour+':'+minute+':00';
    
    console.log("ending departure time is" + departure_time)
    
    var url = 'https://api.forecast.io/forecast/' + forecast_key + '/' + lat + ',' + long + ',' + departure_time + '';
    if(mode=="C"){
        url = url + "?units=si";
    }
    else{
        url = url + "?units=us";
    }
    http.request({ url: url, method: "GET" }).then(function (response) {
            WeatherModel.set("isLoading",true);            
            var obj = response.content.toJSON();

            
            var tmpDepTemp = JSON.stringify(obj.currently.temperature).toString().split('.');
            var tmp_split = tmpDepTemp[0];
            var di = obj.currently.icon;
            var tmpDepIcon = di.split("-").join("");
            WeatherModel.set("departureTemp", tmp_split + ' ' + mode);
            WeatherModel.set("departureIcon", 'res://'+tmpDepIcon+'');

           
            //get the departure background
            if(mode == "F"){
                WeatherModel.getFahrenheitImage(tmp_split,tmpDepIcon);
            }
            else{
                WeatherModel.getCelsiusImage(tmp_split,tmpDepIcon);
            }         
            WeatherModel.set("isLoading",false);           
        }, function (e) {
            // if there is a problem
                WeatherModel.set("isLoading",false);
                //var message = "There was a problem finding your departure weather forecast. Please make sure you are online and have enabled location services.";
                //dialogs.alert({title: "Sorry!", message: message, okButtonText: "OK!",});
            
            done(e);
        });

}

exports.mainViewModel = WeatherModel;
