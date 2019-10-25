var EightyApp = require('./13');

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);


var app = new EightyApp();
var obj = app.processDocument("http://www.cbc.com", "", "", "", jQuery);

console.log(obj);