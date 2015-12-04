
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
        
        if(isEnabled){

        locationModule.getLocation({ maximumAge: 30000, timeout: 20000 }).then(function (location) {                     
                appSettings.setNumber("latitude", location.latitude);
                appSettings.setNumber("longitude", location.longitude);                
                latitude = parseFloat(appSettings.getNumber("latitude"));
                longitude = parseFloat(appSettings.getNumber("longitude"));
                console.log("latitude, longitude", latitude,longitude)
                WeatherModel.getTodaysWeather(latitude,longitude);
                WeatherModel.getDepartureWeather();
            }, function (error) {
                WeatherModel.set("isLoading",false);
                var message = 'There was an error finding your location. Please check your settings and refresh this page!';
                dialogs.alert({title: "Sorry!", message: message, okButtonText: "OK!",});
            });
            
        }
        else {

            if (platformModule.device.os == 'iOS'){
            
                dialogs.alert("To get your weather forecast, we need your location!").then(function() {
                var iosLocationManager = CLLocationManager.alloc().init(); 
                iosLocationManager.delegate = locationDelegate;         
                iosLocationManager.requestWhenInUseAuthorization();                                

            });
        }
}

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
        if(icon == 'snow'){
            //rain
            WeatherModel.set("catImg", 'res://snowbg'); 
        }
        else{
            WeatherModel.set("catImg", 'res://coldbg');
        }
    }
}
WeatherModel.getCelsiusImage = function(temp,icon){
    if(temp >= 21){
        if(icon == 'rain'){
            //rain
            WeatherModel.set("catImg", 'res://rainbg');
        }
        else{
            //hot
            WeatherModel.set("catImg", 'res://hotbg');
        } 
    }
    else if(temp >= 10 && temp < 21){
        if(icon == 'rain'){
            //rain
            WeatherModel.set("catImg", 'res://rainbg');
        }
        else{
            //warm
            WeatherModel.set("catImg", 'res://warmbg');
        } 
    }
    else if(temp >= 0 && temp < 10){
        if(icon == 'rain'){
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
        if(icon == 'snow'){
            //rain
            WeatherModel.set("catImg", 'res://snowbg'); 
        }
        else{
            WeatherModel.set("catImg", 'res://coldbg');
        }
    }
}
WeatherModel.getTodaysWeather = function(latitude,longitude) {



    //check whether we need celsius or fahrenheit
    
    var url = 'https://api.forecast.io/forecast/' + forecast_key + '/' + latitude + ',' + longitude + '';

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
            var tmp_split = tmpCurrTemp[0];
            var nowIcon = eval(JSON.stringify(obj.currently.icon));
            
            var five_day_summary = JSON.stringify(obj.daily.summary);
            WeatherModel.set("weeklySummary",JSON.parse(five_day_summary));            
            
            for (i = 0; i < obj.daily.data.length; i++) { 
                WeatherModel.set("day"+i+"time",moment.utc(obj.daily.data[i].time, 'X').format('dddd'));
                WeatherModel.set("day"+i+"summary",obj.daily.data[i].summary);
                var ni = obj.daily.data[i].icon;
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
                var hourIcon = obj.hourly.data[j].icon;
                WeatherModel.set("hour"+j+"icon",hourIcon);
                var thour = JSON.stringify(obj.hourly.data[j].temperature).toString().split('.');
                var temp = thour[0];
                WeatherModel.set("hour"+j+"temp",temp);
                WeatherModel.set("hour"+j+"summary",obj.hourly.data[j].summary);
            }
            WeatherModel.set("currentTemp", tmp_split + ' ' + mode);
            WeatherModel.set("nowIcon", nowIcon);
            WeatherModel.set("isLoading",false);           
        }, function (e) {
            WeatherModel.set("isLoading",false);
            done(e);
        });
}
WeatherModel.getDepartureWeather = function(){


    //timed departure
    latitude = appSettings.getNumber("latitude");
    longitude = appSettings.getNumber("longitude");
    mode = appSettings.getString("mode");
    hour = appSettings.getString("hour");
    minute = appSettings.getString("minute");
    
    if (hour<10) hour = "0" + hour;
    if (minute > 0 && minute < 10) minute = "0" + minute;
    var todays_date = moment().format('YYYY-MM-DD').toString();
    var departure_time = todays_date+'T'+hour+':'+minute+':00';
    
    console.log("ending departure time is" + departure_time)
    
    var url = 'https://api.forecast.io/forecast/' + forecast_key + '/' + latitude + ',' + longitude + ',' + departure_time + '';
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
            var depIcon = eval(JSON.stringify(obj.currently.icon))
            WeatherModel.set("departureTemp", tmp_split + ' ' + mode);
            WeatherModel.set("departureIcon", depIcon);

            //get the departure background
            if(mode == "F"){
                WeatherModel.getFahrenheitImage(tmp_split,depIcon);
            }
            else{
                WeatherModel.getCelsiusImage(tmp_split,depIcon);
            }         
            WeatherModel.set("isLoading",false);           
        }, function (e) {
            // if there is a problem
                WeatherModel.set("isLoading",false);
            
            done(e);
        });

}

exports.mainViewModel = WeatherModel;
