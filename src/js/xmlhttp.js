//chrome-only{
import { floatify, saveToJsonHelper } from './acct.js';
//}chrome-only-ends

let acct_info = { ready: false };
let FRAC_N = 5;
let url_match = "api/get_equip_detail";
let suit_imp = ["散件", "招财猫", "火灵", "蚌精", "共潜", '遗念火'];
let suit_by_props = {
    '暴击': ["针女","三味","网切","伤魂鸟","破势","镇墓兽","青女房","海月火玉"],
    '攻击加成': ["蝠翼", "轮入道", "狰", "鸣屋", "心眼", "阴摩罗", "狂骨", "兵主部", "贝吹坊"],
    '防御加成': ["珍珠","魅妖","雪幽魂","招财猫","反枕","日女巳时","木魅","出世螺"],
    '生命加成': ["地藏像","涅槃之火","被服","镜姬","钟灵","薙魂","树妖","涂佛","恶楼"],
    '效果抵抗':["骰子鬼", "返魂香","魍魉之匣","幽谷响","共潜"],
    '效果命中':["蚌精","火灵","飞缘魔","遗念火"],
    '首领御魂': ["土蜘蛛", "胧车", "荒骷髅", "地震鲶", "蜃气楼", "鬼灵歌伎"]
}

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

function nowrapText(textLabel) {
    return `<span class="cbghelper_nowrap">${textLabel}</span>`
}

function addExtendedHighlight() {
    if (document.getElementById('cbghelper_exthighlight') || !acct_info.hasOwnProperty("summary")) {
        return;
    }
    let { fastest, heads, feet, hero_info } = acct_info.summary;
    let itms = [];
    let build_item = function (label, id) {
        let li = document.createElement('li');
        li.innerText = label;
        return li
    };
    //collection of heros
    let total = hero_info['ssr']['all'] + hero_info['sp']['all'];
    let got_total = hero_info['ssr']['got'] + hero_info['sp']['got'];
    if (total === got_total) {
        itms.push(build_item('SSR/SP全收集'));
    } else if (hero_info['ssr']['all'] === hero_info['ssr']['got']) {
        itms.push(build_item('SSR全收集'));
    }
    if (hero_info['x']['all'] === hero_info['x']['got']) {
        itms.push(build_item('联动全收集'));
    }
    //number of heads and feet
    if(heads.length > 0 || feet.length > 0) {
        let x = heads.length > 0 ? heads.length : '无';
        let y = feet.length > 0? feet.length : '无';
        let label = `${x}头${y}脚`;
        itms.push(build_item(label))
    }
    //fastest speed
    let fastest_spd_label = `最快一速${[1, 2, 3, 4, 5, 6].reduce((total, p) => total + fastest[p]['散件'], 0).toFixed(2)}`;
    let fastest_spd = build_item(fastest_spd_label)
    fastest_spd.id = 'cbghelper_exthighlight';
    itms.push(fastest_spd);
    //fastest zhaocai speed
    let zc_spd_val = [1, 2, 3, 4, 5, 6].reduce((total, p) => total + fastest[p]['招财猫'], 0);
    let spd_inc = [1, 2, 3, 4, 5, 6].map(p => fastest[p]['散件'] - fastest[p]['招财猫'], 0);
    spd_inc.sort((a, b) => b - a);
    zc_spd_val += spd_inc[0] + spd_inc[1];
    let zc_spd_label = `招财一速${zc_spd_val.toFixed(2)}`;
    itms.push(build_item(zc_spd_label));

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
    let fullspd_suit = Object.fromEntries(suit_imp.map(name => [name, 0]));
    fastest = JSON.parse(JSON.stringify(fastest)); // make a deep copy
    let suit_stats = {};
    for (let p of [1,2,3,4,5,6]) {
        for (let name in fullspd_cnt[p]) {
            if(fullspd_suit[name] === 0) {
                continue;
            }
            if(name in suit_stats) {
                suit_stats[name].push(p);
            } else {
                suit_stats[name] = [p];
            }
        }
    }
    for (let name in suit_stats) {
        if (suit_stats[name].length >= 4) {
            if (name in fullspd_suit) {
                continue;
            } else {
                fullspd_suit[name] = 0;
            }
        }
    }
    let fast_suit_speed = function(name) {
        let suit_fastest = Object.fromEntries([1, 2, 3, 4, 5, 6].map(p => [p, name in fastest[p]? fastest[p][name]: 0]));
        let suit_spd_val = [1, 2, 3, 4, 5, 6].reduce((total, p) => total + suit_fastest[p], 0);
        let spd_inc = [1, 2, 3, 4, 5, 6].map(p => fastest[p]['散件'] - suit_fastest[p]);
        spd_inc.sort((a, b) => b - a);
        suit_spd_val += spd_inc[0] + spd_inc[1];
        return suit_spd_val;
    }
    Object.keys(fullspd_suit).forEach(name => {
        fullspd_suit[name] = fast_suit_speed(name);
    })

    let sortByValue = function (a, b) { return b.value - a.value}
    let headStr = heads.length > 0 ? heads.sort(sortByValue).map(itm => `<span class="data-value">${itm.name}: ${(itm.value).toFixed(decimal)}</span>`.trim()).join(", ") : "无";
    let feetStr = feet.length > 0 ? feet.sort(sortByValue).map(itm => `<span class="data-value">${itm.name}: ${(itm.value).toFixed(decimal)}</span>`.trim()).join(", ") : "无";
    let td_val = function (pos, name) {
        let fullspd = fullspd_cnt[pos][name] > 0;
        let spd = name in fastest[pos]? fastest[pos][name].toFixed(decimal): 0;
        let res = `<span${fullspd? "":" class=disabled"}>${spd}</span> `
        if (fullspd) {
            res += nowrapText(`(${fullspd_cnt[pos][name]})`)
        }
        return res;
    }
    Object.keys(fastest[2]).forEach(k => fastest[2][k] = fastest[2][k]-57 > 0 ? fastest[2][k] - 57 : 0)
    let speed_summary = function (name) {
        return `<tr> <td>${name}</td> ${[1, 2, 3, 4, 5, 6, 7].map(i => `<td>${td_val(i, name)}</td>`)} </tr>`;
    }
    let fastest_tbl = `<table width="100%">
        <tr> <th>位置</th> ${[1, 2, 3, 4, 5, 6].map(i => `<th>${i}</th>`)} <th>4${nowrapText("(命中)")}</th> </tr>
        ${ Object.keys(fullspd_suit).map(name => speed_summary(name)).join(" ") }
    </table>`;
    let suit_table = `<table width="100%">
        <tr> <th>御魂名称</th> <th>套装一速</th></tr>
        ${ Object.keys(fullspd_suit).map(name => `<tr> <th>${name}</th> <td>${fullspd_suit[name].toFixed(5)}</td></tr>\n`).join("") }
    </table>`;

    let title = document.createElement('h3')
    title.innerText = "御魂亮点"
    let spd = document.createElement('section')
    spd.innerHTML = `<div><span class="data-name">头:</span> ${headStr} </div>
    <div><span class="data-name">脚:</span> ${feetStr} </div>`;

    
    let title2 = document.createElement('h3');
    title2.innerText = "套装一速(非独立)";
    let suit = document.createElement('section');
    suit.innerHTML = suit_table;

    let title3 = document.createElement('h3');
    title3.innerText = "各位置一速(满速个数)";

    let fastest_sec = document.createElement('section');
    fastest_sec.innerHTML = fastest_tbl;
    if(fastest_sec.firstChild.nodeType === Node.TEXT_NODE) {
        fastest_sec.firstChild.textContent = '';
    }

    wrapper.appendChild(title);
    wrapper.appendChild(spd);
    wrapper.appendChild(title2);
    wrapper.appendChild(suit);
    wrapper.appendChild(title3);
    wrapper.appendChild(fastest_sec);
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
    let yuhun_list = document.getElementsByClassName('content-top-left')[0];
    yuhun_list.getElementsByTagName('h3')[1].appendChild(b);
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

//chrome-only{
export {
    FRAC_N,
    acct_info,
    suit_imp,
    suit_by_props
}
//}chrome-only-ends