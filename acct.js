'use strict'

const floatify = function (data) {
    let equip = data['equip'];
    let acct_detail = JSON.parse(equip['equip_desc']);
    let mitama_list = acct_detail['inventory'];
    let hero_list = acct_detail['heroes'];

    try {
        var message = {
            name: equip.seller_name,
            roleid: equip.seller_roleid,
            ordersn: equip.game_ordersn,
            mitama_list
        };
        var event = new CustomEvent("SaveLastAccount", { detail: message });
        window.dispatchEvent(event);
    } catch (error) {}

    Object.entries(mitama_list).forEach(([key, value]) => {
        mitama_list[key] = floatify_mitama(value)
    });
    Object.entries(hero_list).forEach(([key, value]) => {
        hero_list[key] = floatify_hero(value, mitama_list)
    });
    acct_detail['inventory'] = mitama_list
    equip['equip_desc'] = JSON.stringify(acct_detail)
    data['equip'] = equip;

    return data
}

function getPropValue(mitama_set, mitama_list, propName) {
    let res = 0;
    for (let mitama_id of mitama_set) {
        var { attrs } = mitama_list[mitama_id];
        for (let [p, v] of attrs) {
            if (p === propName) {
                res += parseFloat(v);
            }
        }
    }
    return res.toFixed(5)
}

function floatify_hero(hero_data, mitama_list) {
    var { attrs, equips } = hero_data
    Object.keys(attrs).forEach(propName => {
        if (propName === '速度' && parseFloat(attrs[propName].add_val) > 0) {
            attrs[propName].add_val = getPropValue(equips, mitama_list, propName);
        }
    })

    return hero_data;
}

function floatify_mitama(mitama) {
    var { rattr, attrs } = mitama;
    mitama["attrs"] = [attrs[0], ...calAttrs(rattr)];
    return mitama;
}

function calAttrs(rattrs, format = true) {
    var enAttrNames = ['attackAdditionRate',
        'attackAdditionVal',
        'critPowerAdditionVal',
        'critRateAdditionVal',
        'debuffEnhance',
        'debuffResist',
        'defenseAdditionRate',
        'defenseAdditionVal',
        'maxHpAdditionRate',
        'maxHpAdditionVal',
        'speedAdditionVal']

    var cnAttrNames = ['攻击加成', '攻击', '暴击伤害', '暴击',
        '效果命中', '效果抵抗', '防御加成',
        '防御', '生命加成', '生命', '速度']

    var basePropValue = {
        '攻击加成': 3, '攻击': 27, '暴击伤害': 4, '暴击': 3,
        '效果抵抗': 4, '效果命中': 4, '防御加成': 3,
        '防御': 5, '生命加成': 3, '生命': 114, '速度': 3
    }

    var percentProp = {
        '攻击加成': true, '攻击': false, '暴击伤害': true, '暴击': true,
        '效果抵抗': true, '效果命中': true, '防御加成': true,
        '防御': false, '生命加成': true, '生命': false, '速度': false
    }

    var e2cNameMap = Object.assign({}, ...enAttrNames.map((n, index) => ({ [n]: cnAttrNames[index] })));
    var res = Object();
    for (let rattr of rattrs) {
        var [prop, v] = rattr;
        prop = e2cNameMap[prop];
        if (prop in res) {
            res[prop] += v;
        } else {
            res[prop] = v;
        }
    }

    return Object.keys(res).sort().map(p => {
        var v = res[p] * basePropValue[p]
        if (format) {
            v = v.toFixed(5);
            if (percentProp[p]) {
                v += "%";
            }
        }

        return [p, v];
    })
}

function soulToJson(soulItem) {
    const { attrs, level, qua, rattr, uuid, name, pos, single_attr = [] } = soulItem;
    var born = parseInt(uuid.substring(0, 8), 16);
    let soulDict = {
        '固有属性': single_attr.length ? single_attr[0] : null,
        '生成时间': born,
        '御魂等级': level,
        '御魂星级': qua,
        '御魂ID': uuid,
        '御魂类型': name,
        '位置': pos
    };
    let PROPNAMES = ['攻击', '攻击加成', '防御',
        '防御加成', '暴击', '暴击伤害', '生命', '生命加成', '效果命中',
        '效果抵抗', '速度'];
    PROPNAMES.map(function (e, i) {
        soulDict[e] = 0;
    });

    let percent = ['攻击加成', '防御加成', '暴击', '暴击伤害', '生命加成', '效果命中', '效果抵抗'];
    for (let [p, v] of [attrs[0], ...calAttrs(rattr, false)]) {
        v = parseFloat(v)
        if (percent.includes(p)) {
            v = v / 100;
        }
        soulDict[p] += v;
    }
    if (single_attr.length) {
        const [p, v] = single_attr;
        soulDict[p] += parseFloat(v) / 100;
    }

    return soulDict;
}

function saveToJson(soulLists) {
    var fileContent = 'data:text/json;charset=utf-8,'
    let soulListJson = Object.values(soulLists).map(soulToJson);
    soulListJson.unshift('yuhun_ocr2.0');
    fileContent += JSON.stringify(soulListJson);

    var encodedUri = encodeURI(fileContent);
    var link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'yuhun.json');
    link.innerHTML = 'Click Here to download your data';
    document.body.appendChild(link); // Required for FF

    link.click();
    link.parentNode.removeChild(link);
}

function saveToJsonHelper() {
    var event = new CustomEvent("LoadLastAccount", {});
    window.dispatchEvent(event);
    console.log("Account data requested!");
}

window.addEventListener("LastAccountResult", function (evt) {
    console.log("Account data received!");
    saveToJson(evt.detail);
}, false);

export {
    floatify,
    saveToJsonHelper
};