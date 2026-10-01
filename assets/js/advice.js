/* 轻伴 LightMate — AI 分析引擎（Demo 版）
 * 1) 饮食识别：基于文件名/餐次/痛点的加权模拟识别（无需联网，可复现）
 * 2) 建议生成：严格遵循「不批评但指出问题 / 允许失败但要求行动」的四条原则
 */
(function (global) {
  'use strict';
  var LM = (global.LM = global.LM || {});
  var U = LM.util;
  var D = LM.data;

  /* ================================================================== *
   * 一、模拟识别
   * ================================================================== */
  function matchByText(text) {
    if (!text) return [];
    var lower = String(text).toLowerCase();
    var hits = [];
    D.KEYWORDS.forEach(function (k) {
      var hit = k.kw.some(function (w) { return lower.indexOf(String(w).toLowerCase()) >= 0; });
      if (hit) hits = hits.concat(k.ids);
    });
    return hits;
  }

  function poolForMeal(mealKey) {
    if (mealKey === 'breakfast') {
      return D.FOODS.filter(function (f) { return f.tags.indexOf('早餐') >= 0 || f.cat === '健康'; });
    }
    if (mealKey === 'snack') {
      return D.FOODS.filter(function (f) { return f.cat === '奶茶' || f.cat === '零食' || f.cat === '夜宵'; });
    }
    return D.FOODS.filter(function (f) { return f.cat === '食堂' || f.cat === '外卖' || f.cat === '健康'; });
  }

  /**
   * 识别一餐
   * @param {string} fileName 图片文件名（命中关键词会显著提升准确度）
   * @param {string} mealKey  餐次
   * @param {string} seed     去重种子（同一张图结果稳定）
   */
  function recognize(fileName, mealKey, seed) {
    var store = LM.store;
    var s = store.get();
    var rnd = U.mulberry32(U.hashStr(String(seed || fileName || 'lightmate') + mealKey));

    var meal = D.MEALS.filter(function (m) { return m.key === mealKey; })[0] || D.MEALS[1];
    var goal = store.kcalGoal();
    var budget = goal * meal.share;

    var hits = matchByText(fileName);
    var chosen = [];
    var confBase = fileName ? 0.86 : 0.78;

    // 用户最容易失控的项，有更高概率被识别出来（贴近真实使用场景）
    var triggerFood = {
      milktea: ['zhenzhu_naicha', 'naicha', 'guocha'],
      snack: ['shupian', 'latiao', 'binggan', 'dangao', 'qiaokeli'],
      takeout: ['fried_chicken', 'hamburger', 'xiangguo', 'gaijiaofan'],
      night: ['paomian', 'shaokao', 'chaofan', 'zhachuan'],
      party: ['xiangguo', 'shaokao', 'pizza', 'xiaolongxia']
    };

    // 先做「餐次合理性」过滤：文件名里的关键词不一定属于这一餐
    // （例如宵夜照片里不该出现盖浇饭），避免识别结果与场景不符。
    var pool = poolForMeal(mealKey);
    var poolIds = {};
    pool.forEach(function (f) { poolIds[f.id] = 1; });
    var hitsFit = hits.filter(function (id) { return poolIds[id]; });
    var useHits = hitsFit.length ? hitsFit : (mealKey === 'snack' ? [] : hits.slice(0, 1));

    // —— 组餐约束：一顿饭里主食最多 1 份、甜点零食最多 1 份 ——
    var SWEET_IDS = { dangao: 1, qiaokeli: 1, bingqilin: 1, binggan: 1, zhenzhu_naicha: 1, naicha: 1, guocha: 1, natie: 1 };
    var countStaple = 0, countSweet = 0;
    function tryPush(f) {
      if (!f) return false;
      if (chosen.length >= 4) return false;
      if (chosen.some(function (c) { return c.id === f.id; })) return false;
      var isStaple = (f.tags || []).indexOf('主食') >= 0;
      var isSweet = !!SWEET_IDS[f.id] || (f.tags || []).indexOf('零食') >= 0;
      if (isStaple && countStaple >= 1) return false;
      if (isSweet && countSweet >= 1) return false;
      if (isStaple) countStaple++;
      if (isSweet) countSweet++;
      chosen.push(f);
      return true;
    }

    // 1) 文本命中优先
    useHits.slice(0, 3).forEach(function (id) {
      if (tryPush(D.FOOD_MAP[id])) confBase += 0.04;
    });

    // 2) 痛点食物（只加一份，避免一顿饭出现三个"高危"项）
    var triggerPool = [];
    s.user.triggers.forEach(function (t) {
      (triggerFood[t] || []).forEach(function (id) {
        var f = D.FOOD_MAP[id];
        if (f && poolIds[f.id]) triggerPool.push(f);
      });
    });
    if (triggerPool.length && rnd() < 0.75) tryPush(U.pick(triggerPool, rnd));

    // 3) 主餐主体：主食 + 菜
    var main = pool.filter(function (f) { return f.tags.indexOf('主食') >= 0 || f.cat === '食堂'; });
    var side = pool.filter(function (f) { return f.tags.indexOf('低卡') >= 0 || f.tags.indexOf('高蛋白') >= 0; });

    if (main.length && countStaple === 0) tryPush(U.pick(main, rnd));
    if (side.length && chosen.length < 3 && rnd() < 0.85) tryPush(U.pick(side, rnd));

    // 4) 补足到 2～4 项
    var guard = 0;
    while (chosen.length < (mealKey === 'snack' ? 2 : 3) && guard++ < 24) {
      tryPush(U.pick(pool, rnd));
    }

    // 5) 主食排在最前，符合真实的一餐顺序
    chosen.sort(function (a, b) {
      var as = (a.tags || []).indexOf('主食') >= 0 ? 0 : 1;
      var bs = (b.tags || []).indexOf('主食') >= 0 ? 0 : 1;
      return as - bs;
    });

    var items = chosen.slice(0, 4).map(function (f) {
      var portion = f.portion || 1;
      // 份量微扰，让每次识别看起来"真的在估"
      if (f.unit === '份' || f.unit === '碗' || f.unit === '杯') {
        portion = Math.max(0.5, +(portion * (0.85 + rnd() * 0.4)).toFixed(1));
      }
      return {
        fid: f.id,
        name: f.name,
        emoji: f.emoji,
        unit: f.unit,
        kcal: f.kcal,
        portion: portion,
        grams: Math.round(f.kcal * 1.6 * portion),
        confidence: +(U.clamp(confBase - rnd() * 0.12, 0.62, 0.97)).toFixed(2),
        tags: f.tags || [],
        cat: f.cat
      };
    });

    var total = items.reduce(function (sum, it) { return sum + it.kcal * it.portion; }, 0);
    var avgConf = items.reduce(function (sum, it) { return sum + it.confidence; }, 0) / (items.length || 1);

    return {
      items: items,
      total: Math.round(total),
      confidence: +avgConf.toFixed(2),
      budget: Math.round(budget),
      mealKey: mealKey,
      mealName: meal.name,
      mealEmoji: meal.emoji
    };
  }

  /* ================================================================== *
   * 二、单餐分析建议
   * ================================================================== */
  var VERDICT = {
    light:   { label: '很轻',     tone: 'calm' },
    ok:      { label: '合适',     tone: 'calm' },
    heavy:   { label: '偏重',     tone: 'aware' },
    over:    { label: '超标',     tone: 'push' },
    extreme: { label: '明显超标', tone: 'firm' }
  };

  function riskTags(items) {
    var tags = {};
    items.forEach(function (it) {
      (it.tags || []).forEach(function (t) { tags[t] = (tags[t] || 0) + 1; });
    });
    return tags;
  }

  /**
   * @param {Array}  items    本餐食物
   * @param {string} mealKey  餐次
   * @param {string} dateKey  日期
   * @param {Object} [opts]   { alreadyLogged: true } 表示这一餐已经在 store 里了
   */
  function analyzeMeal(items, mealKey, dateKey, opts) {
    var store = LM.store;
    var s = store.get();
    var meal = D.MEALS.filter(function (m) { return m.key === mealKey; })[0] || D.MEALS[1];
    var goal = store.kcalGoal();
    var mealKcal = Math.round(items.reduce(function (sum, it) { return sum + it.kcal * it.portion; }, 0));
    var budget = Math.round(goal * meal.share);
    var ratio = budget > 0 ? mealKcal / budget : 0;

    var alreadyLogged = !!(opts && opts.alreadyLogged);
    var todayTotal = store.dayKcal(dateKey) + (alreadyLogged ? 0 : mealKcal);
    var remaining = goal - todayTotal;
    var overToday = todayTotal > goal;
    var overRatio = goal > 0 ? todayTotal / goal : 0;

    var verdictKey = 'ok';
    if (ratio <= 0.75) verdictKey = 'light';
    else if (ratio <= 1.1) verdictKey = 'ok';
    else if (ratio <= 1.4) verdictKey = 'heavy';
    else if (ratio <= 1.8) verdictKey = 'over';
    else verdictKey = 'extreme';
    if (overRatio > 1.25) verdictKey = 'extreme';
    else if (overRatio > 1.1 && ratio > 1.1) verdictKey = 'over';

    var verdict = VERDICT[verdictKey];
    var tags = riskTags(items);

    var lines = [];   // { type: 'fact' | 'issue' | 'act' | 'ok', text }
    var actions = [];

    /* —— 1. 先说事实，不说评价 —— */
    lines.push({ type: 'fact', text: '这一餐大约 ' + U.comma(mealKcal) + ' kcal，' + meal.name + '的参考区间是 ' + U.comma(budget) + ' kcal。' });

    /* —— 2. 指出问题（不批评） —— */
    if (tags['奶茶']) {
      lines.push({ type: 'issue', text: '含糖饮料是这一天里最容易被忽略的部分：一杯奶茶差不多等于一顿正餐的一半。' });
      actions.push('把下一杯换成无糖茶或者美式，先把「甜」这一项减掉。');
    }
    if (tags['高油']) {
      lines.push({ type: 'issue', text: '这一餐的油脂偏多，油炸类会让饱腹感来得慢、热量来得快。' });
      actions.push('今天剩下的那一餐，选清炒或者水煮的做法。');
    }
    if (mealKey === 'snack' && new Date().getHours() >= 21) {
      lines.push({ type: 'issue', text: '这个时间点吃进去的东西，基本不会在睡前消耗掉。' });
      actions.push('今晚就到这里。如果还饿，先喝一杯水，等 20 分钟再说。');
    }
    if (tags['零食']) {
      lines.push({ type: 'issue', text: '零食的热量密度很高，饱腹感却很低，吃了容易还想吃。' });
      actions.push('把零食从桌上收进柜子里，看不见就不太会想起来。');
    }
    if (!tags['低卡'] && !tags['高蛋白']) {
      lines.push({ type: 'issue', text: '这一餐缺少蔬菜和蛋白质，饱得快、饿得也快。' });
      actions.push('下一餐加一份青菜，或者加一个鸡蛋。');
    }
    if (overToday) {
      lines.push({ type: 'issue', text: '今天累计 ' + U.comma(todayTotal) + ' kcal，已经超过目标 ' + U.comma(todayTotal - goal) + ' kcal。' });
      actions.push('不用补回来，也不要从明天开始节食。今天剩下的时间把选择做好就行。');
    }

    /* —— 3. 稳定时给肯定，但不下结论 —— */
    if (verdictKey === 'light' || verdictKey === 'ok') {
      if (!overToday) {
        lines.push({ type: 'ok', text: '这一餐在计划里，热量和结构都合适。' });
      }
    }

    /* —— 4. 必须有行动 —— */
    if (!actions.length) {
      if (remaining > 0) actions.push('剩下的 ' + U.comma(remaining) + ' kcal 留给下一餐，正常吃就好。');
      else actions.push('今天已经吃够了，剩下的时间只喝水和无糖茶。');
    }

    var action = actions[0];

    // 状态化语气：连续偏离时更坚定（产品原则 4.3）
    var nd = store.nudge();
    var tone = verdict.tone;
    if (nd.level >= 2 && tone === 'calm') tone = 'aware';
    if (nd.level >= 3) tone = 'firm';

    var head = headFor(verdictKey, tone, nd, overToday);

    return {
      kcal: mealKcal,
      budget: budget,
      ratio: +ratio.toFixed(2),
      verdict: verdict.label,
      verdictKey: verdictKey,
      tone: tone,
      head: head,
      lines: lines,
      action: action,
      actions: actions,
      todayTotal: Math.round(todayTotal),
      remaining: Math.round(remaining),
      goal: Math.round(goal),
      overToday: overToday,
      tags: Object.keys(tags)
    };
  }

  function headFor(verdictKey, tone, nd, overToday) {
    if (overToday && nd.level >= 2) return '今天的摄入确实偏高了，我们看看接下来还能怎么调整。';
    if (overToday) return '这一餐记下了。今天剩下的时间，我们把选择做好。';
    switch (verdictKey) {
      case 'light': return '这一餐很轻，记下来就完成了今天最重要的一件事。';
      case 'ok': return '不错，这一餐基本在计划里。';
      case 'heavy': return '这一餐偏重了一点，问题不大，接下来调整就好。';
      case 'over': return '这一餐比计划多了一些，不用自责，我们看后面怎么补回来。';
      default: return '这一餐明显超出计划了。没关系，先从今天剩下的时间开始控制。';
    }
  }

  /* ================================================================== *
   * 三、今日总览建议（Dashboard）
   * ================================================================== */
  function dailyAdvice(dateKey) {
    var store = LM.store;
    var s = store.get();
    var key = dateKey || U.today();
    var goal = store.kcalGoal();
    var total = store.dayKcal(key);
    var remaining = goal - total;
    var tp = store.taskProgress(key);
    var nd = store.nudge();
    var h = new Date().getHours();

    var out = { tone: 'calm', title: '', body: '', action: null, chips: [] };

    if (total === 0) {
      out.tone = 'calm';
      out.title = h < 11 ? '今天还没有开始记录' : '今天还没记录任何一餐';
      out.body = '不需要一次记住全部。先把刚吃过的那一餐拍下来，30 秒就够了。';
      out.action = { label: '去记录一餐', route: '#/diet' };
      return out;
    }

    var ratio = total / goal;
    if (ratio <= 0.85) {
      out.tone = 'calm';
      out.title = '今天节奏很好';
      out.body = '已经记录 ' + U.comma(total) + ' kcal，还剩 ' + U.comma(remaining) + ' kcal 的空间。正常吃，别刻意省。';
      out.chips.push({ label: '已记录 ' + U.comma(total) + ' kcal', kind: 'ok' });
      out.chips.push({ label: '剩余 ' + U.comma(remaining) + ' kcal', kind: 'ok' });
    } else if (ratio <= 1.05) {
      out.tone = 'aware';
      out.title = '差不多到今天的量了';
      out.body = '现在 ' + U.comma(total) + ' kcal，基本贴着目标线。剩下的时间用无糖饮料和水替代就好。';
      out.chips.push({ label: '已接近目标', kind: 'warn' });
    } else {
      out.tone = nd.level >= 3 ? 'firm' : 'push';
      out.title = '今天已经超出目标了';
      out.body = '超了 ' + U.comma(total - goal) + ' kcal。不用明天节食补回来，那不是好办法。今天剩下的时间，只做一件事：不再加餐。';
      out.action = { label: '我今晚不加餐了', route: '#/checkin' };
      out.chips.push({ label: '超出 ' + U.comma(total - goal) + ' kcal', kind: 'bad' });
    }

    if (tp.done < tp.total && h >= 18) {
      out.body += ' 今天的任务还剩 ' + (tp.total - tp.done) + ' 项，睡前完成就行。';
    }

    return out;
  }

  /* ================================================================== *
   * 四、周报
   * ================================================================== */
  function weeklyReport() {
    var store = LM.store;
    var days = [];
    for (var i = 6; i >= 0; i--) days.push(U.addDays(U.today(), -i));

    var logged = 0, kcalSum = 0, kcalDays = 0, checked = 0, over = 0;
    days.forEach(function (k) {
      var kc = store.dayKcal(k);
      var d = store.get().logs[k];
      if (d && d.meals.length) logged++;
      if (kc > 0) { kcalSum += kc; kcalDays++; }
      if (d && d.checked) checked++;
      if (kc > store.kcalGoal() * 1.15) over++;
    });

    var avg = kcalDays ? Math.round(kcalSum / kcalDays) : 0;
    var trend = 'flat';
    if (avg && avg < store.kcalGoal() * 0.95) trend = 'down';
    else if (avg > store.kcalGoal() * 1.08) trend = 'up';

    var head, body;
    if (logged >= 6) {
      head = '这一周你记录了 ' + logged + ' 天';
      body = '平均每天 ' + U.comma(avg) + ' kcal。稳定性比单日的数字更重要，这一点你做对了。';
    } else if (logged >= 3) {
      head = '这一周记录了 ' + logged + ' 天';
      body = '有几天断掉了，很正常。下周的目标不是"每天都记"，是把断掉的那天补回来。';
    } else {
      head = '这一周只有 ' + logged + ' 天有记录';
      body = '先别管吃多少，下周只要求一件事：每天记下任意一餐。';
    }

    return {
      days: days,
      logged: logged,
      avgKcal: avg,
      checked: checked,
      over: over,
      trend: trend,
      head: head,
      body: body
    };
  }

  LM.advice = {
    recognize: recognize,
    analyzeMeal: analyzeMeal,
    dailyAdvice: dailyAdvice,
    weeklyReport: weeklyReport,
    matchByText: matchByText
  };
})(window);
