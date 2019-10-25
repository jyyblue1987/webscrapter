var EightyApp = require('./13');
var request = require("request");

// var jsdom = require('jsdom');
// const { JSDOM } = jsdom;
// const { window } = new JSDOM();
// const { document } = (new JSDOM('')).window;
// global.document = document;

var jQuery = require('jquery');

var app = new EightyApp();

request({
    uri: "https://www.cbs.com",
}, function(error, response, body) {
    console.log(body);
});

var obj = app.processDocument("http://www.cbc.com", "", "", "", jQuery);

console.log(obj);