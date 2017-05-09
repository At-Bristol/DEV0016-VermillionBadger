import App from './App2'

var helpBox = document.getElementById("help-box");

var showHelpBox = function(show) {
    if (show) {
        helpBox.classList.remove("hidden");
    }
    else {
        helpBox.classList.add("hidden");
    }
};


// start app
var app = new App();
