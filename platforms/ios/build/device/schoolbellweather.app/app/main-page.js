var vmModule = require("./main-view-model");
var dialogs = require("ui/dialogs");
//var helpers = require('./helper');
var appModule = require("application");
var imageModule = require("ui/image");
var gesturesModule = require("ui/gestures");
var view = require("ui/core/view");
var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var observable = require("data/observable");

var page;
var hour;
var minute;
var latitude;
var longitude;
var mode;
var transportation;

function pageLoaded(args) {
    page = args.object; 

    /*var toIcon = {
        toView: function (value) {
            return helpers.toIcon(value);
        }
    }
    
    appModule.resources["toIcon"] = toIcon;*/
    
    page.bindingContext = vmModule.mainViewModel;    
    getSettings();                  
}

function getSettings(){

    hour = appSettings.getString("hour"); 
    minute = appSettings.getString("minute");
    latitude = parseFloat(appSettings.getNumber("latitude"));
    longitude = parseFloat(appSettings.getNumber("longitude"));
    mode = appSettings.getString("mode");
    transportation = appSettings.getString("transportation");

    console.log("settings" + hour,minute,latitude,longitude,mode,transportation)
 
    
    if(!hour){
        hour = appSettings.setString("hour","7"); 
    }
    if(!minute){
        minute = appSettings.setString("minute","00"); 
    }
    if(!mode){
        mode = appSettings.setString("mode","F"); 
    }
    if(!transportation){
        transportation = appSettings.setString("transportation","res://walk");
    }
    
}

function navigatedTo(args){

    
    vmModule.mainViewModel.getLocation();

    

    //listen for changed segmentedBar

    var sBar = page.getViewById("sBar");
    var mode = appSettings.getString("mode");

    if(mode == 'C'){
        sBar.selectedIndex = 0;
    }
    else{
        sBar.selectedIndex = 1;
    }
        
    sBar.addEventListener(observable.Observable.propertyChangeEvent, function (e) {

        if(e.value == 1){
            appSettings.setString("mode","F");
            
        }
        else{
            appSettings.setString("mode","C");
        } 

        vmModule.mainViewModel.getLocation(); 

                   
    });

    //listen for changes to timePicker
    var timePicker = page.getViewById("time");
    timePicker.hour = appSettings.getString("hour");
    timePicker.minute = appSettings.getString("minute");

    timePicker.addEventListener(observable.Observable.propertyChangeEvent, function (e) {

        console.log("timepicker says" + timePicker.hour,timePicker.minute)
        var hour = timePicker.hour;
        if(!hour){
            hour = "7"
        }
        var minute = timePicker.minute;
        if(!minute){
            minute = "00"
        }
        //bug, timePicker returns 0 instead of 00
        if(minute == "0"){
            minute = "00"
        }
        hour = hour.toString();
        minute = minute.toString();

        appSettings.setString("hour", hour);
        appSettings.setString("minute", minute);
        
        vmModule.mainViewModel.getDepartureWeather();
        //var message = 'You have set your departure time.';
        //dialogs.alert({title: "Departure time set!", message: message, okButtonText: "OK!"});
    });
    
    var busContainer = page.getViewById("busContainer");
    var carContainer = page.getViewById("carContainer");
    var bikeContainer = page.getViewById("bikeContainer");
    var footContainer = page.getViewById("footContainer");

    var busImage = new imageModule.Image();
    busImage.src = "res://bus";
    busImage.cssClass="icon";
    busImage.observe(gesturesModule.GestureTypes.tap, function (args) {
        vmModule.mainViewModel.setTransportation("bus");
        alertUser("bus")
    });

    var carImage = new imageModule.Image();
    carImage.src = "res://car";
    carImage.observe(gesturesModule.GestureTypes.tap, function (args) {
        vmModule.mainViewModel.setTransportation("car");
        alertUser("car")
    }); 

    var bikeImage = new imageModule.Image();
    bikeImage.src = "res://bike";
    bikeImage.observe(gesturesModule.GestureTypes.tap, function (args) {
        vmModule.mainViewModel.setTransportation("bike");
        alertUser("bike")
    }); 

    var footImage = new imageModule.Image();
    footImage.src = "res://foot";
    footImage.observe(gesturesModule.GestureTypes.tap, function (args) {
        vmModule.mainViewModel.setTransportation("foot");
        alertUser("walking")
    }); 

    busContainer.addChild(busImage) 
    carContainer.addChild(carImage) 
    bikeContainer.addChild(bikeImage) 
    footContainer.addChild(footImage)


}
function openInfo(){

    var message = "You can tell what the weather will be and what you should wear to get to school. Set your preferences in 'Settings' in the tab below. Choose how you get to school and use the time picker to set the time that you leave for school. Tap 'My Weather' to view the weather now (on the left) and the weather at your departure time (on the right). View hourly forecasts, tomorrow's weather and a five-day forecast as well. The weather cat shows you what to wear when you leave."; 
    dialogs.alert({title: "Welcome to School Bell Weather!", message: message, okButtonText: "OK!",});
}
function refresh(){
    vmModule.mainViewModel.getLocation();
    var message = "You have refreshed the weather!";
    dialogs.alert({title: "Refreshed!", message: message, okButtonText: "OK!",});
}

function alertUser(trans){
    var message = 'You have set your transportation mode to ' + trans + '.'
    dialogs.alert({title: "Transportation mode set!", message: message, okButtonText: "OK!"});
}
function alertMode(mode){
    var message = 'You have set your temperature preference to ' + mode + '.'
    dialogs.alert({title: "Temperature mode set!", message: message, okButtonText: "OK!"});
}

exports.pageLoaded = pageLoaded;
exports.navigatedTo = navigatedTo;
exports.refresh = refresh;
exports.getSettings = getSettings;
exports.openInfo = openInfo;

