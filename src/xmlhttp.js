import { floatify, saveToJsonHelper } from './acct.js';

let acct_info = { ready: false };
let FRAC_N = 5;
let url_match = "api/get_equip_detail";
let _open = XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open = function (method, URL) {
    let _onreadystatechange = this.onreadystatechange,
        _this = this;

    _this.onreadystatechange = function () {
        // catch only completed 'api/search/universal' requests
        if (_this.readyState === 4 && _this.status === 200 && ~URL.indexOf(url_match)) {
            try {
                //////////////////////////////////////
                // THIS IS ACTIONS FOR YOUR REQUEST //
                //             EXAMPLE:             //
                //////////////////////////////////////
                let data = JSON.parse(_this.responseText); // {"fields": ["a","b"]}

                data = floatify(data)

                // rewrite responseText
                Object.defineProperty(_this, 'responseText', { value: JSON.stringify(data) });
                Object.defineProperty(_this, 'response', { value: JSON.stringify(data) });
                /////////////// END //////////////////
            } catch (e) { }

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

function addExtendedHighlight() {
    if (document.getElementById('cbghelper_exthighlight') || !acct_info.hasOwnProperty("summary")) {
        return;
    }
    let itms = [];
    let { fastest, heads, feet } = acct_info.summary;
    if(heads.length > 0 || feet.length > 0) {
        let li = document.createElement('li');
        let x = heads.length > 0 ? heads.length : '无';
        let y = feet.length > 0? feet.length : '无';
        li.innerText = `${x}头${y}脚`;
        itms.push(li)
    }
    let fastest_spd = document.createElement('li');
    fastest_spd.innerText = `最快一速${[1, 2, 3, 4, 5, 6].reduce((total, p) => total + fastest[p]['散件'], 0).toFixed(2)}`;
    fastest_spd.id = 'cbghelper_exthighlight';
    itms.push(fastest_spd);

    let zc_spd = document.createElement('li');
    let zc_spd_val = [1, 2, 3, 4, 5, 6].reduce((total, p) => total + fastest[p]['招财猫'], 0);
    let spd_inc = [1, 2, 3, 4, 5, 6].map(p => fastest[p]['散件'] - fastest[p]['招财猫'], 0);
    spd_inc.sort((a, b) => b - a);
    zc_spd_val += spd_inc[0] + spd_inc[1];
    zc_spd.innerText = `招财一速${zc_spd_val.toFixed(2)}`;
    itms.push(zc_spd);

    let highlight = document.getElementsByClassName('highlight')[0];
    for (let li of itms) {
        highlight.appendChild(li);
    }
}

function summaryPage() {
    let wrapper = document.createElement('div');
    if (!acct_info.hasOwnProperty('summary')) {
        wrapper.appendChild(document.createTextNode("数据加载出错，请尝试刷新页面"))
        return wrapper;
    }
    let decimal = 2;
    let { fastest, heads, feet, fullspd_cnt } = acct_info.summary;
    fastest = JSON.parse(JSON.stringify(fastest)); // make a deep copy
    
    let title = document.createElement('h3')
    title.innerText = "御魂亮点"
    let spd = document.createElement('section')
    let sortByValue = function (a, b) { return b.value - a.value}
    let headStr = heads.length > 0 ? heads.sort(sortByValue).map(itm => `<span class="data-value">${itm.name}: ${(itm.value).toFixed(decimal)}</span>`.trim()).join(", ") : "无";
    let feetStr = feet.length > 0 ? feet.sort(sortByValue).map(itm => `<span class="data-value">${itm.name}: ${(itm.value).toFixed(decimal)}</span>`.trim()).join(", ") : "无";
    let fastest_spd = [1, 2, 3, 4, 5, 6].reduce((total, p) => total + fastest[p]['散件'], 0);
    let zc_spd_val = [1, 2, 3, 4, 5, 6].reduce((total, p) => total + fastest[p]['招财猫'], 0);
    let spd_inc = [1, 2, 3, 4, 5, 6].map(p => fastest[p]['散件'] - fastest[p]['招财猫'], 0);
    spd_inc.sort((a, b) => b - a);
    zc_spd_val += spd_inc[0] + spd_inc[1];
    let td_val = function (pos, name) {
        let res = `${fastest[pos][name].toFixed(decimal)}`
        if (fullspd_cnt[pos][name] > 0) {
            res += `(${fullspd_cnt[pos][name]})`
        }
        return res;
    }
    Object.keys(fastest[2]).forEach(k => fastest[2][k] = fastest[2][k]-57 > 0 ? fastest[2][k] - 57 : 0)
    let fastest_tbl = `<table width="100%">
        <tr> <td>位置</td> ${[1, 2, 3, 4, 5, 6].map(i => `<td>${i}</td>`)} <td>4(命中)</td> </tr>
        <tr> <td>散件</td> ${[1, 2, 3, 4, 5, 6, 7].map(i => `<td>${td_val(i, '散件')}</td>`)} </tr>
        <tr> <td>招财猫</td> ${[1, 2, 3, 4, 5, 6, 7].map(i => `<td>${td_val(i, '招财猫')}</td>`)} </tr>
        <tr> <td>火灵</td> ${[1, 2, 3, 4, 5, 6, 7].map(i => `<td>${td_val(i, '火灵')}</td>`)} </tr>
        <tr> <td>蚌精</td> ${[1, 2, 3, 4, 5, 6, 7].map(i => `<td>${td_val(i, '蚌精')}</td>`)} </tr>
    </table>`;
    spd.innerHTML = `<div><span class="data-name">头:</span> ${headStr} </div>
    <div><span class="data-name">脚:</span> ${feetStr} </div>
    <div><span class="data-name">散件一速:</span> <span class="data-value">${fastest_spd.toFixed(5)}</span></div>
    <div><span class="data-name">招财一速:</span> <span class="data-value">${zc_spd_val.toFixed(5)}</span></div>`

    let title2 = document.createElement('h3')
    title2.innerText = "各位置一速(满速个数)"

    let fastest_sec = document.createElement('section')
    fastest_sec.innerHTML = fastest_tbl
    if(fastest_sec.firstChild.nodeType === Node.TEXT_NODE) {
        fastest_sec.firstChild.textContent = '';
    }

    wrapper.appendChild(title)
    wrapper.appendChild(spd)
    wrapper.appendChild(title2)
    wrapper.appendChild(fastest_sec)
    return wrapper;
}

function addHighlightView() {
    if (document.getElementById('cbghelper_highlight')) {
        return;
    }
    let div = document.createElement('div');
    div.id = 'cbghelper_highlight';
    div.appendChild(summaryPage());
    let wrapper = document.getElementsByClassName('content-pvp')[0];
    wrapper.appendChild(div)
}

function addDownloadBtn() {
    if (document.getElementById('cbghelper_download')) {
        return;
    }
    let b = document.createElement('a');
    b.innerText = "(💾保存为JSON)";
    b.onclick = function () {
        console.log("To save data!");
        saveToJsonHelper();
    }
    b.id = "cbghelper_download"
    b.style.cursor = "pointer";
    let yuhun_list = document.getElementsByClassName('yuhun-list')[0];
    yuhun_list.parentNode.childNodes[1].append(b)
}

function addDownloadBtnWrapper () {
    if (document.getElementsByClassName('yuhun-list').length) {
        addDownloadBtn();
    }
}
function addExtHighlightWrapper () {
    if (document.getElementsByClassName('highlight').length) {
        addExtendedHighlight();
    }
}
function addHighlightViewWrapper() {
    if (document.getElementsByClassName('content-pvp').length && acct_info.ready) {
        addHighlightView();
    }
}

function init() {
    let checkfn_list = {
        'cbghelper_download': addDownloadBtnWrapper,
        'cbghelper_exthighlight': addExtHighlightWrapper,
        'cbghelper_highlight': addHighlightViewWrapper
    };  
    let handlers = {};

    let checkExist = setInterval(function () {
        if (!document.URL.startsWith("https://yys.cbg.163.com/cgi/mweb/equip")) {
            return;
        }
        for (let eid of Object.keys(checkfn_list)) {
            if (document.getElementById(eid) && eid in handlers) {
                clearInterval(handlers[eid]);
                delete handlers[eid];
            } else if (document.getElementById(eid) || eid in handlers) {
                continue;
            } else {
                handlers[eid] = setInterval(checkfn_list[eid], 200);
            }
        }
    }, 100);
};

init();

export {
    FRAC_N,
    acct_info
}