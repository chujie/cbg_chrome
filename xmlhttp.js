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


function floatify(data) {
    let equip = data['equip'];
    let acct_detail = JSON.parse(equip['equip_desc']);
    let mitama_list = acct_detail['inventory'];
    let hero_list = acct_detail['heroes'];

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
        var {attrs} = mitama_list[mitama_id];
        for (let [p, v] of attrs) {
            if (p === propName) {
                res += parseFloat(v);
            }
        }
    }
    return res.toFixed(5)
}

function floatify_hero(hero_data, mitama_list) {
    var {attrs, equips} = hero_data
    Object.keys(attrs).forEach( propName => {
        if(propName === '速度' && parseFloat(attrs[propName].add_val) > 0) {
            attrs[propName].add_val = getPropValue(equips, mitama_list, propName)
        }
    })
    
    return hero_data
}

function floatify_mitama(mitama) {
    var {rattr, attrs} = mitama
    mitama["attrs"] = [attrs[0], ...calAttrs(rattr)]
    return mitama
}

function calAttrs(rattrs) {
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

    var basePropValue = {'攻击加成': 3, '攻击': 27, '暴击伤害': 4, '暴击': 3,
                         '效果抵抗': 4,  '效果命中': 4, '防御加成': 3,
                         '防御': 5, '生命加成': 3, '生命': 114, '速度': 3}

    var percentProp = {'攻击加成': true, '攻击': false, '暴击伤害': true, '暴击': true,
    '效果抵抗': true,  '效果命中': true, '防御加成': true,
    '防御': false, '生命加成': true, '生命': false, '速度': false}
    
    var e2cNameMap = Object.assign({}, ...enAttrNames.map((n, index) => ({[n]: cnAttrNames[index]})))
    res = Object()
    for(let rattr of rattrs) {
        var [prop, v] = rattr
        prop = e2cNameMap[prop]
        if(prop in res) {
            res[prop] += v
        } else {
            res[prop] = v
        }
    }

    return Object.keys(res).sort().map(p => {
        var v = res[p]*basePropValue[p]
        v = v.toFixed(5)
        if (percentProp[p]) {
            v += "%"
        }
        return [p, v]
    })
}