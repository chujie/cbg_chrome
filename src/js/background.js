//chrome-only{
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-124590695-2']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// Inject content script when URL manipulated with history API
const urlFilter = "http.?:\/\/yys.cbg.163.com\/cgi\/mweb\/equip\/.*"

chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
  chrome.tabs.executeScript(null,{file:"js/content.js"});
}, {url: [{urlMatches: urlFilter}]});
//}chrome-only-ends