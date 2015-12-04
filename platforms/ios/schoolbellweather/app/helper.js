exports.toIcon = function(value){
   
    switch(value) {
      case "partly-cloudy-day":
        return String.fromCharCode(parseInt('e621', 16));
        break;
      case "partly-cloudy-night":
        return String.fromCharCode(parseInt('e620', 16));        
        break;
      case "clear-day":
        return String.fromCharCode(parseInt('e627', 16));        
        break;
      case "sleet":
        return String.fromCharCode(parseInt('e612', 16));        
        break;
      case "snow":
        return String.fromCharCode(parseInt('e613', 16));        
        break;
      case "wind":
        return String.fromCharCode(parseInt('e617', 16));        
        break;
      case "rain":
        return String.fromCharCode(parseInt('e618', 16));        
        break;
      case "lightning":
        return String.fromCharCode(parseInt('e61a', 16));        
        break;
      case "cloudy":
        return String.fromCharCode(parseInt('e61c', 16));        
        break;
      case "fog":
        return String.fromCharCode(parseInt('e624', 16));        
        break;
      case "clear-night":
        return String.fromCharCode(parseInt('e626', 16));        
        break;
                
    }
}