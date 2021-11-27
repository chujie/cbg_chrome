(function () {
    if (window.hasRun === true)
        return true;  // Will ultimately be passed back to executeScript
    window.hasRun = true;
    var s = document.createElement("script");
    s.type = "module"
    s.src = chrome.extension.getURL("js/xmlhttp.js");
    s.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);


    window.addEventListener("SaveLastAccount", function (evt) {
        chrome.storage.local.set({ "last_acct": evt.detail }, function () {
            console.log("Account data saved!");
        });
    }, false);

    window.addEventListener("LoadLastAccount", function (evt) {
        chrome.storage.local.get(['last_acct'], function (result) {
            const { last_acct: {mitama_list} } = result
            var event = new CustomEvent("LastAccountResult", { detail: mitama_list });
            window.dispatchEvent(event);
            console.log("Account data sent!");
        });
    }, false); 
})();
