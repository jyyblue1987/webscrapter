const EightyAppBase = require('eighty-app');

var EightyApp = function() {
	var app = this;
	this.processDocument = function(html, url, headers, status, jQuery) {
        
        var $ = jQuery;
        var $html = app.parseHtml(html, $);
        
		var object = {};
		var twitter_list = [];
		var non_twitter_list = [];
		
		function findVal(object, key) {
		    var value;
		    Object.keys(object).some(function(k) {
		        if (k === key) {
		            value = object[k];
		            return true;
		        }
		        if (object[k] && typeof object[k] === 'object') {
		            value = findVal(object[k], key);
		            return value !== undefined;
		        }
		    });
		    return value;
		}
		function getDomainNameOnly(url)
		{
		    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0]
		    return url.replace(/\..*/,'')
		}
		function extractHostname(url) {
			var hostname;
			
			if (url.indexOf("//") > -1) {
				hostname = url.split('/')[2];
			}
			else {
				hostname = url.split('/')[0];
			}

			hostname = hostname.split(':')[0];
			hostname = hostname.split('?')[0];
			var arr = hostname.split('.');
			var l = arr.length;
			if (arr.length > 1) hostname = arr[l-2];
			return hostname;
		}
		
        object.fetchedNumbers = $html.toString().match(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/)
        // gets all links in the html document
        var links = [];
		// get twitter or facebook
		object.twittersite = $html.find("meta[name='twitter:site'], meta[name='TWITTER:SITE'],meta[property='twitter:site'], meta[property='TWITTER:SITE']").attr("content");
		object.twittercreator = $html.find("meta[name='twitter:creator'], meta[name='TWITTER:CREATOR'],meta[property='twitter:creator'], meta[property='TWITTER:CREATOR']").attr("content");
		object.twitterurl = $html.find("meta[name='twitter:url'], meta[name='TWITTER:URL', meta[property='TWITTER:url'],meta[property='twitter:url']").attr("content");
		object.facebookpublisher = $html.find("meta[name='article:publisher'], meta[name='ARTICLE:PUBLISHER']").attr("content");
		object.facebookauthor = $html.find("meta[name='article:author'], meta[name='ARTICLE:AUTHOR']").attr("content");
		object.contact  =$html.find("a:contains('Contact'),a:contains('contact')").attr("href");
		object.about=$html.find("a:contains('About'),a:contains('about')").attr("href");
		
		
		$html.find("a[href^='mailto']").each(function(a){
			var href = $(this).attr("href").replace("mailto:", "");
			
		    if (href.indexOf("@") === 0 || href.length > 50) return;
			if (!object.mailtos) object.mailtos = [];
			if (object.mailtos.includes(href)) return;
			
			object.mailtos.push(href)
		})
		
	    var domainName = getDomainNameOnly(url);
	    object.domainNameTerm = domainName;
	    
	    function onlyUnique(value, index, self) { 
            return self.indexOf(value) === index;
        }
		
		function getTwitterUrls(html, domainName) {
		    var matched = html.match(/(http(?:s)?:\/\/(?:www\.)?twitter\.com)\/([a-zA-Z0-9_]+)/);
		    if( matched == null || matched == undefined )
		        return twitter_list.length;
		    if( matched.length < 3 )
		        return;
		    
		    if( matched[2].toLowerCase().includes(domainName) )
		        return twitter_list.push(matched[0], matched[1] + '/' + domainName);  
		    if( domainName.toLowerCase().includes(matched[2]) )
		        return twitter_list.push(matched[0], matched[1] + '/' + domainName);  
		    else
		        return twitter_list.length;
		}
		
		
		getTwitterUrls(html, domainName);
		twitter_list = twitter_list.map(item => {
		    return item.toLowerCase();
		} );
		twitter_list = twitter_list.filter( onlyUnique );
		
		object.twitter_url = twitter_list;
		
		function getNonTwitterUrls(html, domainName) {
		    var matched = html.match(/(http(?:s)?:\/\/(?:www\.)?twitter\.com)\/([a-zA-Z0-9_]+)/);
		    if( matched == null || matched == undefined )
		        return twitter_list.length;
		    if( matched.length < 3 )
		        return;
		    
		    if( matched[2].toLowerCase().includes(domainName) )
		        return 0;
		    if( domainName.toLowerCase().includes(matched[2]) )
		        return 0;
		    else
		        return non_twitter_list.push(matched[0]);
		}
		
		
		getNonTwitterUrls(html, domainName);
		non_twitter_list = non_twitter_list.map(item => {
		    return item.toLowerCase();
		} );
		non_twitter_list = non_twitter_list.filter( onlyUnique );
		
		object.twitter_url_nonname_match = non_twitter_list;
	
		function addToLinks(href) {
			var obj = {};
			var host = extractHostname(href);
			obj[host] = href
			if (links.some(item => item[host] === href)) return;
			links.push(obj)
		}
		function IsJsonString(str) {
            try {
                 str = JSON.parse(str);
            } catch (e) {
                // failed to parse going for work around
                return JSON.parse("{"+text.substr(text.indexOf("sameAs")-1).replace("{","").replace("}","")+"}");
               
            }
            return str;
        }
        $html.find("a[itemprop='sameAs']").each(function(a){
		    addToLinks($(this).attr("href"));
		})
		$html.find("meta[itemprop='sameAs']").each(function(a){
			addToLinks($(this).attr("content"));
		})
		$html.find("a[rel='me']").each(function(a){
			addToLinks($(this).attr("href"));
		})
		if (links.length > 0) object.links = links;	
		var text="";
		$html.find("script[type='application/ld+json']:contains('sameAs')").each(function(a) {
		   	text = $(this).text();
		});
		   text= text.replace(/“/g, '"');
		   text = text.replace(/”/g, '"');
		console.log("objectRaw",text);
		if (text.length === 0) {
            if (object.length > 0) {
                return ""; //exit if nothing found
            } else {
                return object;
            }
        }
        
        var objectRaw = IsJsonString(text);
	   	
		var urlArray = findVal(objectRaw, 'sameAs');
		if (typeof urlArray !== 'object') urlArray = "";
        for(var index in urlArray){
            var linkObject = {};
	        if(urlArray[index].indexOf("http")!==-1){
	            var property = urlArray[index].slice(urlArray[index].indexOf("://")+3,urlArray[index].indexOf("/",urlArray[index].indexOf("://")+3));
	        }else{
	            var property = urlArray[index].slice(0,urlArray[index].indexOf("/"));
	        }
			if(property.indexOf("wikipedia")!==-1||property.indexOf("apple")!==-1){
		    } 
			else if (property.indexOf("@")!==-1){
				if (property.indexOf("mailto:")!==-1) {
					var hArr = urlArray[index].split(":");
					urlArray[index] = hArr[hArr.length-1];
				}
				property = "email";
				
				
				
	        }else if (property.indexOf(".co.")!==-1||property.indexOf(".com.")!==-1){
	            var x = property.split(".");
	            property = x[x.length-3]
	        }else if(property.indexOf(".com")||property.indexOf(".org")!==-1){
	            var x =property.split(".")
	            property = x[x.length-2];
	        }else{
	            
	        }
	     
			if (urlArray[index].length > 0) {
				linkObject[property] = urlArray[index];
			}
            
	     //check if the url is exist or not
	        if (urlArray[index] !== null && !(links.includes(linkObject))) {
        		links.push(linkObject);
            }

        }
        
		if (links.length > 0) {
			object.links = links;
		}
        
        
        var telephone = findVal(objectRaw, 'telephone');
        if(typeof telephone != 'undefined' && telephone.length > 0){
        	object.telephone = telephone;
        }

        var address = findVal(objectRaw, 'address');
        if(typeof address != 'undefined' && address.length > 0){
        	object.address = address;
        }
		var email = findVal(objectRaw, 'email');
        if(typeof email != 'undefined' && email.length > 0){
        	object.email = email;
        }
		var legalName = findVal(objectRaw, 'legalName');
        if(typeof legalName != 'undefined' && legalName.length > 0){
        	object.legalName = legalName;
        }
		var stype = findVal(objectRaw, '@type');
        if(typeof stype  != 'undefined' && stype .length > 0){
        	object["@type"] = stype ;
        }
        
        return object;
        //return JSON.stringify(object);
	}
	this.parseLinks = function(html, url, headers, status, cheerio, extras) {
		return [];
	}
}

try {
	// Testing
	module.exports = function() {
		EightyApp.prototype = new EightyAppBase();
		return new EightyApp();
	}
} catch(e) {
	// Production
	console.log("Eighty app exists.");
	EightyApp.prototype = new EightyAppBase();
}