
module.exports = {

    // string explode
    explode: function(text, max) {    
        text = text.replace(/  +/g, " ").replace(/^ /, "").replace(/ $/, "");    
        if (typeof text === "undefined") return "";
        
        // if max hasn't been defined, max = 30
        if (typeof max === "undefined") max = 30;    
        if (text.length <= max) return text;
        
        var exploded = text.substring(0, max);    
        text = text.substring(max);    
        if (text.charAt(0) !== " ") {        
            while (exploded.charAt(exploded.length - 1) !== " " && exploded.length > 0) {            
                text = exploded.charAt(exploded.length - 1) + text;            
                exploded = exploded.substring(0, exploded.length - 1);
            }        
            if (exploded.length == 0) {            
                exploded = text.substring(0, max);
                text = text.substring(max);        
            } else {            
                exploded = exploded.substring(0, exploded.length - 1);
            }    
        } else {        
            text = text.substring(1);
        }    
        return exploded + "\n" + this.explode(text,max);
    },

    // process URL params
    getParameterByName: function(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }


}
