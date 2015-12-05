var frameModule = require("ui/frame");
var imageModule = require("ui/image");


var _delay = 500;

exports.load = function(args) {

	var item = new imageModule.Image();
	item.src = "res://sun";
	item.translateY = 500;
	item.opacity = 0;
	item.on("loaded", function (args) {
	    args.object.animate({ translate: { x: 0, y: 0 }, opacity: 1, duration: 2000 })
		    //.then(function () { return args.object.animate({ scale: { x: 5, y: 5 }, duration: 1000 }); })
		    //.then(function () { return args.object.animate({ opacity: 0 }); })
		    .then(function () {
		    	frameModule.topmost().navigate("main-page");
		})
		    .catch(function (e) {
		});
	});
	
	page = args.object; 
    
	var grid = page.getViewById("grid");
	grid.addChild(item);
	
};
