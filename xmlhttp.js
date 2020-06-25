import {floatify, saveToJsonHelper} from './acct.js';

var url_match = "api/get_equip_detail";
var _open = XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function (method, URL) {
    var _onreadystatechange = this.onreadystatechange,
        _this = this;

    _this.onreadystatechange = function () {
        // catch only completed 'api/search/universal' requests
        if (_this.readyState === 4 && _this.status === 200 && ~URL.indexOf(url_match)) {
            try {
                //////////////////////////////////////
                // THIS IS ACTIONS FOR YOUR REQUEST //
                //             EXAMPLE:             //
                //////////////////////////////////////
                var data = JSON.parse(_this.responseText); // {"fields": ["a","b"]}

                data = floatify(data)

                // rewrite responseText
                Object.defineProperty(_this, 'responseText', {value: JSON.stringify(data)});
                Object.defineProperty(_this, 'response', {value: JSON.stringify(data)});
                /////////////// END //////////////////
            } catch (e) {}

            console.log('Caught! :)', method, URL/*, _this.responseText*/);
        }
        // call original callback
        if (_onreadystatechange) _onreadystatechange.apply(this, arguments);
    };

    // detect any onreadystatechange changing
    Object.defineProperty(this, "onreadystatechange", {
        get: function () {
            return _onreadystatechange;
        },
        set: function (value) {
            _onreadystatechange = value;
        }
    });

    return _open.apply(_this, arguments);
};

function addDownloadBtn() {
    if(document.getElementById('cbghelper_download')) {
        return;
    }
    var b = document.createElement('a');
    b.innerText = "(💾保存为JSON)";
    b.onclick = function () {
        console.log("To save data!");
        saveToJsonHelper();
    }
    b.id = "cbghelper_download"
    b.style.cursor = "pointer";
    var yuhun_list = document.getElementsByClassName('yuhun-list')[0];
    yuhun_list.parentNode.childNodes[1].append(b)
}

var checkExist = setInterval(function () {
    if (!document.getElementById('cbghelper_download')) {
        var ready = setInterval(function () {
            if (document.getElementsByClassName('yuhun-list').length) {
                console.log("Exists!");
                clearInterval(ready);
                addDownloadBtn()
            }
        }, 100)
    }
}, 100);