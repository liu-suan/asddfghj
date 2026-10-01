/* 轻伴 LightMate — 状态层
 * 持久化 / 领域模型 / 派生指标 / 动态督促引擎 / 演示数据
 */
(function (global) {
  'use strict';
  var LM = (global.LM = global.LM || {});
  var U = LM.util;
  var D = LM.data;

  var STORAGE_KEY = 'lightmate.state.v1';
  var listeners = [];
  var state = null;

  /* ================================================================== *
   * 1. 默认状态
   * ================================================================== */
  function blankState() {
    return {
      version: 1,
      onboarded: false,
      createdAt: new Date().toISOString(),
      user: {
        name: '同学',
        goals: [],            // 控制饮食 / 减少体脂 / 养成健康习惯 / 规律运动
        triggers: [],         // 奶茶 / 零食 / 外卖 / 夜宵 / 聚餐
        hardParts: [],        // 饮食 / 运动 / 睡眠 / 每日记录
        reminder: 'moderate',
        commitment: '接下来的 30 天，我会认真对待自己的每一次选择。'
      },
      body: {
        gender: 'female',
        age: 20,
        height: 165,
        weight: 60,
        targetWeight: 54,
        activity: 'light'     // low / light / mid / high
      },
      plan: {
        startDate: U.today(),
        targetDays: 30,
        kcalGoal: null,        // null = 自动计算
        weightStart: 60
      },
      logs: {},                // dateKey -> day record
      weights: []              // [{date, kg}]
    };
  }

  /* ================================================================== *
   * 2. 读写
   * ================================================================== */
  function load() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        state = normalize(parsed);
        return state;
      }
    } catch (e) {
      console.warn('[轻伴] 读取本地数据失败，使用全新状态', e);
    }
    state = blankState();
    return state;
  }

  function normalize(s) {
    var base = blankState();
    s = s || {};
    var out = Object.assign(base, s);
    out.user = Object.assign(base.user, s.user || {});
    out.body = Object.assign(base.body, s.body || {});
    out.plan = Object.assign(base.plan, s.plan || {});
    out.logs = s.logs && typeof s.logs === 'object' ? s.logs : {};
    out.weights = Array.isArray(s.weights) ? s.weights : [];
    Object.keys(out.logs).forEach(function (k) {
      var d = out.logs[k];
      d.meals = Array.isArray(d.meals) ? d.meals : [];
      d.tasks = d.tasks && typeof d.tasks === 'object' ? d.tasks : {};
      d.checked = !!d.checked;
    });
    return out;
  }

  function save(silent) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[轻伴] 保存失败', e);
    }
    if (!silent) emit();
  }

  function get() { return state; }

  function reset() {
    state = blankState();
    save();
  }

  function subscribe(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(function (fn) { try { fn(state); } catch (e) { console.error(e); } }); }

  /* ================================================================== *
   * 3. 日志访问
   * ================================================================== */
  function day(key) {
    key = key || U.today();
    if (!state.logs[key]) {
      state.logs[key] = { meals: [], tasks: {}, checked: false, note: '', mood: '', checkedAt: null };
    }
    return state.logs[key];
  }

  function hasDay(key) { return !!state.logs[key]; }

  function mealKcal(meal) {
    return (meal.items || []).reduce(function (sum, it) {
      return sum + (Number(it.kcal) || 0) * (Number(it.portion) || 1);
    }, 0);
  }

  function dayKcal(key) {
    var d = state.logs[key];
    if (!d) return 0;
    return d.meals.reduce(function (s, m) { return s + mealKcal(m); }, 0);
  }

  function dayMealCount(key) {
    var d = state.logs[key];
    return d ? d.meals.length : 0;
  }

  function addMeal(meal, key) {
    key = key || U.today();
    var d = day(key);
    meal.id = meal.id || U.uid('meal');
    meal.time = meal.time || U.nowTime();
    meal.mealKey = meal.mealKey || D.mealByHour(new Date().getHours()).key;
    d.meals.push(meal);
    // 记录一餐 → 自动完成「记录」任务
    if (d.tasks.record === undefined || d.tasks.record === false) d.tasks.record = true;
    save();
    return meal;
  }

  function removeMeal(mealId, key) {
    key = key || U.today();
    var d = day(key);
    d.meals = d.meals.filter(function (m) { return m.id !== mealId; });
    save();
  }

  function updateMeal(mealId, patch, key) {
    key = key || U.today();
    var d = day(key);
    d.meals.forEach(function (m) { if (m.id === mealId) Object.assign(m, patch); });
    save();
  }

  function toggleTask(taskKey, key) {
    key = key || U.today();
    var d = day(key);
    d.tasks[taskKey] = !d.tasks[taskKey];
    save();
    return d.tasks[taskKey];
  }

  function setCheckin(checked, key) {
    key = key || U.today();
    var d = day(key);
    d.checked = !!checked;
    d.checkedAt = checked ? Date.now() : null;
    if (checked) {
      // 中断后重新回到计划 → 记一次 comeback
      var prev = U.addDays(key, -1);
      if (hasDay(prev) || stats().streak === 0) { /* noop，comebacks 在 stats 里统一算 */ }
    }
    save();
    return d.checked;
  }

  function setNote(text, key) { day(key).note = text; save(true); }
  function setMood(mood, key) { day(key).mood = mood; save(); }

  /* ================================================================== *
   * 4. 体重
   * ================================================================== */
  function recordWeight(kg, key) {
    key = key || U.today();
    kg = Number(kg);
    if (!kg || kg < 25 || kg > 250) return null;
    state.weights = state.weights.filter(function (w) { return w.date !== key; });
    state.weights.push({ date: key, kg: kg });
    state.weights.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    state.body.weight = kg;
    if (!state.plan.weightStart) state.plan.weightStart = kg;
    save();
    return kg;
  }

  function latestWeight() {
    if (!state.weights.length) return state.body.weight || null;
    return state.weights[state.weights.length - 1].kg;
  }

  /* ================================================================== *
   * 5. 每日任务生成（按用户痛点，确定性）
   * ================================================================== */
  function tasksFor(key) {
    var u = state.user;
    var idx = Math.abs(U.diffDays(state.plan.startDate, key));
    var cands = [D.TASK_LIBRARY.record];

    if (u.goals.indexOf('diet') >= 0 || u.goals.indexOf('fat') >= 0) {
      cands.push(D.TASK_LIBRARY.veg, D.TASK_LIBRARY.protein);
    }
    if (u.goals.indexOf('habit') >= 0 || u.triggers.indexOf('milktea') >= 0) cands.push(D.TASK_LIBRARY.no_sugar);
    if (u.triggers.indexOf('snack') >= 0) cands.push(D.TASK_LIBRARY.no_snack);
    if (u.triggers.indexOf('night') >= 0) cands.push(D.TASK_LIBRARY.no_night);
    if (u.triggers.indexOf('takeout') >= 0) cands.push(D.TASK_LIBRARY.no_takeout);
    if (u.triggers.indexOf('party') >= 0) cands.push(D.TASK_LIBRARY.control);
    if (u.goals.indexOf('sport') >= 0 || u.hardParts.indexOf('sport') >= 0) {
      cands.push(idx % 2 === 0 ? D.TASK_LIBRARY.sport : D.TASK_LIBRARY.walk);
    }
    if (u.hardParts.indexOf('sleep') >= 0 || u.goals.indexOf('habit') >= 0) cands.push(D.TASK_LIBRARY.sleep);
    if (u.hardParts.indexOf('diet') >= 0) cands.push(D.TASK_LIBRARY.water);

    // 去重 + 保底
    var seen = {}, out = [];
    cands.forEach(function (t) { if (t && !seen[t.key]) { seen[t.key] = 1; out.push(t); } });
    if (out.length < 4) {
      [D.TASK_LIBRARY.water, D.TASK_LIBRARY.walk, D.TASK_LIBRARY.veg].forEach(function (t) {
        if (out.length < 4 && !seen[t.key]) { seen[t.key] = 1; out.push(t); }
      });
    }
    return out.slice(0, 5);
  }

  function taskProgress(key) {
    var list = tasksFor(key);
    var d = state.logs[key];
    var done = list.filter(function (t) { return d && d.tasks[t.key]; }).length;
    return { done: done, total: list.length, list: list };
  }

  /* ================================================================== *
   * 6. 热量目标
   * ================================================================== */
  function autoKcalGoal() {
    var b = state.body;
    var w = latestWeight() || b.weight || 60;
    var bmr;
    if (b.gender === 'male') bmr = 10 * w + 6.25 * b.height - 5 * b.age + 5;
    else bmr = 10 * w + 6.25 * b.height - 5 * b.age - 161;
    var factor = { low: 1.2, light: 1.375, mid: 1.55, high: 1.725 }[b.activity] || 1.375;
    var tdee = bmr * factor;
    var goal = tdee - 400;                       // 温和缺口，不极端节食
    var floor = b.gender === 'male' ? 1500 : 1200; // 安全下限
    return Math.round(Math.max(goal, floor) / 10) * 10;
  }

  function kcalGoal() {
    return state.plan.kcalGoal || autoKcalGoal();
  }

  function macroGoals() {
    var g = kcalGoal();
    return { kcal: g, protein: Math.round(latestWeight() * 1.4), water: 8, steps: 6000 };
  }

  /* ================================================================== *
   * 7. 偏离判定 + 动态督促引擎
   * ================================================================== */
  function isDeviant(key) {
    if (key >= U.today()) return false;                          // 今天还没结束，不判定
    if (key < state.plan.startDate) return false;                // 计划还没开始的日子不算偏离
    var d = state.logs[key];
    if (!d || (!d.checked && d.meals.length === 0)) return true;  // 完全没记录 → 偏离
    var kcal = dayKcal(key);
    if (kcal > kcalGoal() * 1.15) return true;                   // 超标 15% 以上 → 偏离
    return false;
  }

  function pastDays(n) {
    var out = [];
    for (var i = n; i >= 1; i--) out.push(U.addDays(U.today(), -i));
    return out;
  }

  function nudge() {
    var last7 = pastDays(7);
    var recent = pastDays(3);
    var devRecent = recent.filter(isDeviant).length;

    // 从昨天开始往前数连续偏离天数
    var run = 0, i = 1;
    while (i <= 30 && isDeviant(U.addDays(U.today(), -i))) { run++; i++; }
    // 昨天没偏离时，看今天是否已经失控（用于即时提醒）
    var todayKcal = dayKcal(U.today());
    var todayOver = todayKcal > kcalGoal() * 1.15;

    var level = 0;
    if (run >= 3) level = 3;
    else if (run === 2) level = 2;
    else if (run === 1 || devRecent >= 2 || todayOver) level = 1;
    if (run >= 2 && todayOver) level = Math.max(level, 2);

    // 提醒频率影响「是否显示 + 强度上限」
    var pref = state.user.reminder || 'moderate';
    if (pref === 'gentle') level = Math.min(level, 1);
    if (pref === 'gentle' && run === 0 && !todayOver) level = 0;

    var base = D.COPY.nudge[level];
    var extra = '';
    if (level >= 1 && run >= 1) extra = '已经连续 ' + run + ' 天偏离计划。';
    if (todayOver) extra = '今天已经记到 ' + U.comma(todayKcal) + ' kcal，超过目标了。';

    return {
      level: level,
      run: run,
      devRecent: devRecent,
      todayOver: todayOver,
      todayKcal: todayKcal,
      level0: base,
      levelName: base.level,
      emoji: base.emoji,
      tone: base.tone,
      head: base.head,
      body: base.body,
      extra: extra,
      gentleLimit: pref === 'gentle' && level >= 2,
      pref: pref
    };
  }

  /* ================================================================== *
   * 8. 统计
   * ================================================================== */
  var statsCache = null;
  function stats(s) {
    s = s || state;
    var t = U.today();
    var checkinDays = 0, mealCount = 0, goodDays = 0, totalKcal = 0, kcalDays = 0;

    Object.keys(s.logs).forEach(function (k) {
      var d = s.logs[k];
      if (d.checked) checkinDays++;
      mealCount += (d.meals || []).length;
      var kc = (d.meals || []).reduce(function (sum, m) {
        return sum + (m.items || []).reduce(function (a, it) { return a + (it.kcal || 0) * (it.portion || 1); }, 0);
      }, 0);
      if (kc > 0) { totalKcal += kc; kcalDays++; }
      if (kc > 0 && kc <= kcalGoal() * 1.02) goodDays++;
    });

    // 当前连续天数：今天未打卡不算断，从昨天起算
    var start = s.logs[t] && s.logs[t].checked ? t : U.addDays(t, -1);
    var streak = 0, cur = start;
    while (s.logs[cur] && s.logs[cur].checked && streak < 400) { streak++; cur = U.addDays(cur, -1); }

    // 历史最长连续
    var keys = Object.keys(s.logs).filter(function (k) { return s.logs[k].checked; }).sort();
    var best = 0, run = 0, prev = null;
    keys.forEach(function (k) {
      run = (prev && U.diffDays(prev, k) === 1) ? run + 1 : 1;
      best = Math.max(best, run);
      prev = k;
    });

    // 中断后回归次数：checked 的前一天不是 checked，且之前有过记录
    var comebacks = 0;
    keys.forEach(function (k, i) {
      var prevKey = U.addDays(k, -1);
      var hadBefore = keys.slice(0, i).some(function (x) { return U.diffDays(x, k) >= 2; });
      if (hadBefore && !(s.logs[prevKey] && s.logs[prevKey].checked)) comebacks++;
    });

    var wStart = s.plan.weightStart || (s.weights[0] && s.weights[0].kg) || s.body.weight;
    var wNow = latestWeight();
    var weightDelta = (wNow && wStart) ? +(wNow - wStart).toFixed(1) : 0;

    var dayIndex = Math.min(U.diffDays(s.plan.startDate, t) + 1, s.plan.targetDays);
    if (dayIndex < 1) dayIndex = 1;

    var elapsed = Math.max(U.diffDays(s.plan.startDate, t) + 1, 0);
    var rate = elapsed > 0 ? Math.round((checkinDays / elapsed) * 100) : 0;

    return {
      checkinDays: checkinDays,
      mealCount: mealCount,
      goodDays: goodDays,
      avgKcal: kcalDays ? Math.round(totalKcal / kcalDays) : 0,
      streak: streak,
      bestStreak: best,
      comebacks: comebacks,
      weightStart: wStart,
      weightNow: wNow,
      weightDelta: weightDelta,
      dayIndex: dayIndex,
      elapsed: elapsed,
      rate: rate,
      totalLoggedDays: Object.keys(s.logs).length
    };
  }

  /* ================================================================== *
   * 9. 30 天网格
   * ================================================================== */
  function grid30() {
    var s = state;
    var t = U.today();
    var out = [];
    for (var i = 0; i < s.plan.targetDays; i++) {
      var key = U.addDays(s.plan.startDate, i);
      var d = s.logs[key];
      var kcal = dayKcal(key);
      var st;
      if (key > t) st = 'future';
      else if (d && d.checked) st = 'done';
      else if (key === t) st = (d && d.meals.length) ? 'today-partial' : 'today';
      else st = (d && d.meals.length) ? 'partial' : 'miss';
      out.push({ key: key, index: i + 1, date: U.fromKey(key), state: st, kcal: kcal, checked: !!(d && d.checked) });
    }
    return out;
  }

  /* ================================================================== *
   * 10. 演示数据
   * ================================================================== */
  function seedDemo(opts) {
    opts = opts || {};
    var rnd = U.mulberry32(opts.seed || 20261001);
    var days = opts.days || 18;                     // 已经走过的天数
    var fresh = blankState();

    fresh.onboarded = true;
    fresh.user = Object.assign(fresh.user, {
      name: opts.name || '小满',
      goals: ['diet', 'fat', 'habit', 'sport'],
      triggers: ['milktea', 'night', 'snack'],
      hardParts: ['diet', 'sleep', 'record'],
      reminder: 'moderate',
      commitment: '接下来的 30 天，我会认真对待自己的每一次选择。'
    });
    fresh.body = { gender: 'female', age: 20, height: 165, weight: 58.6, targetWeight: 52, activity: 'light' };
    fresh.plan.startDate = U.addDays(U.today(), -(days - 1));
    fresh.plan.targetDays = 30;
    fresh.plan.kcalGoal = null;
    fresh.plan.weightStart = 60.4;

    state = fresh;

    // —— 体重曲线：缓慢下降，有平台期
    var w = 60.4;
    fresh.weights = [];
    for (var i = 0; i < days; i++) {
      var key = U.addDays(fresh.plan.startDate, i);
      var drop = 0.10 + rnd() * 0.14;
      if (i % 7 === 3) drop = -0.05 - rnd() * 0.15;    // 偶尔回弹（聚餐/聚餐后）
      w = +(w - drop + (rnd() - 0.5) * 0.12).toFixed(1);
      if (i % 3 === 0 || i === days - 1) fresh.weights.push({ date: key, kg: w });
    }
    fresh.body.weight = +w.toFixed(1);

    // —— 每日记录
    var goal = kcalGoal();
    for (var j = 0; j < days; j++) {
      var dk = U.addDays(fresh.plan.startDate, j);
      var d = day(dk);

      // 90% 的日子有记录；中间安排一次 3 天中断（用来演示失败恢复）
      var brokenRun = (j >= 11 && j <= 13);
      var skip = brokenRun || rnd() < 0.08;

      if (!skip) {
        var meals = ['breakfast', 'lunch', 'dinner'];
        if (rnd() < 0.5) meals.push('snack');
        meals.forEach(function (mk) {
          var meal = buildDemoMeal(mk, goal, rnd, j);
          d.meals.push(meal);
        });
      }

      var tp = tasksFor(dk);
      var doneRatio = skip ? 0 : (0.55 + rnd() * 0.5);
      tp.forEach(function (t, ti) {
        d.tasks[t.key] = skip ? false : (ti / tp.length < doneRatio);
      });
      d.tasks.record = !skip && d.meals.length > 0;
      d.checked = !skip && (d.meals.length > 0) && (doneRatio > 0.6);
      d.checkedAt = d.checked ? U.fromKey(dk).getTime() + 22 * 3600 * 1000 : null;
      if (rnd() < 0.3) {
        d.mood = U.pick(['🙂', '😌', '😐', '😴', '💪'], rnd);
        d.note = U.pick([
          '今天食堂吃了两份菜，还行。',
          '舍友点奶茶，我换了无糖茶。',
          '晚上有点饿，喝了很多水。',
          '今天有体育课，动得挺多。',
          '昨天熬夜了，今天有点想吃甜的。'
        ], rnd);
      }
    }

    // —— 今天：留一半没做，方便现场演示
    var td = day(U.today());
    if (!td.meals.length) {
      td.meals.push(buildDemoMeal('breakfast', goal, rnd, days));
    }
    var ttp = tasksFor(U.today());
    ttp.forEach(function (t, ti) { td.tasks[t.key] = ti < 2; });
    td.checked = false;

    save();
    return state;
  }

  function buildDemoMeal(mealKey, goal, rnd, dayIdx) {
    var meta = D.MEALS.filter(function (m) { return m.key === mealKey; })[0] || D.MEALS[0];
    var budget = goal * meta.share;
    var pool = D.FOODS.filter(function (f) {
      if (mealKey === 'breakfast') return f.tags.indexOf('早餐') >= 0 || f.cat === '健康';
      if (mealKey === 'snack') return f.cat === '奶茶' || f.cat === '零食' || f.cat === '夜宵';
      return f.cat === '食堂' || f.cat === '外卖' || f.cat === '健康';
    });
    var items = [], sum = 0, guard = 0;
    while (sum < budget * 0.78 && items.length < 4 && guard++ < 24) {
      var f = U.pick(pool, rnd);
      if (items.some(function (x) { return x.fid === f.id; })) continue;
      var portion = f.portion || 1;
      if (sum + f.kcal * portion > budget * 1.25) continue;
      items.push({ fid: f.id, name: f.name, emoji: f.emoji, unit: f.unit, kcal: f.kcal, portion: portion, grams: Math.round(f.kcal * 1.6) });
      sum += f.kcal * portion;
    }
    if (!items.length) {
      var fb = D.FOOD_MAP.rice;
      items.push({ fid: fb.id, name: fb.name, emoji: fb.emoji, unit: fb.unit, kcal: fb.kcal, portion: 1, grams: 200 });
    }
    // 演示用的“高风险日”：多一杯奶茶
    if (mealKey === 'snack' && rnd() < 0.35) {
      var mt = D.FOOD_MAP.zhenzhu_naicha;
      items.push({ fid: mt.id, name: mt.name, emoji: mt.emoji, unit: mt.unit, kcal: mt.kcal, portion: 1, grams: 700 });
    }
    var hh = { breakfast: 8, lunch: 12, dinner: 18, snack: 21 }[mealKey] || 12;
    return {
      id: U.uid('meal'),
      mealKey: mealKey,
      time: U.pad(hh) + ':' + U.pad(Math.floor(rnd() * 55)),
      items: items,
      photo: null,
      source: 'demo',
      note: ''
    };
  }

  /* ================================================================== *
   * 11. 首次使用 / 计划相关
   * ================================================================== */
  function completeOnboarding(patch) {
    Object.assign(state.user, patch.user || {});
    Object.assign(state.body, patch.body || {});
    Object.assign(state.plan, patch.plan || {});
    state.onboarded = true;
    if (!state.weights.length) {
      state.weights.push({ date: U.today(), kg: state.body.weight });
    }
    state.plan.weightStart = state.body.weight;
    save();
  }

  function restartPlan(days) {
    state.plan.startDate = U.today();
    state.plan.targetDays = days || 30;
    save();
  }

  function unlockedBadges() {
    return D.BADGES.map(function (b) {
      var ok = false;
      try { ok = !!b.check(state); } catch (e) { ok = false; }
      return Object.assign({}, b, { unlocked: ok });
    });
  }

  function exportJSON() { return JSON.stringify(state, null, 2); }

  function importJSON(text) {
    try {
      state = normalize(JSON.parse(text));
      save();
      return true;
    } catch (e) { return false; }
  }

  LM.store = {
    STORAGE_KEY: STORAGE_KEY,
    blankState: blankState,
    load: load, save: save, get: get, reset: reset, subscribe: subscribe, emit: emit,
    day: day, hasDay: hasDay,
    mealKcal: mealKcal, dayKcal: dayKcal, dayMealCount: dayMealCount,
    addMeal: addMeal, removeMeal: removeMeal, updateMeal: updateMeal,
    toggleTask: toggleTask, setCheckin: setCheckin, setNote: setNote, setMood: setMood,
    recordWeight: recordWeight, latestWeight: latestWeight,
    tasksFor: tasksFor, taskProgress: taskProgress,
    autoKcalGoal: autoKcalGoal, kcalGoal: kcalGoal, macroGoals: macroGoals,
    isDeviant: isDeviant, nudge: nudge, stats: stats, grid30: grid30,
    seedDemo: seedDemo,
    completeOnboarding: completeOnboarding, restartPlan: restartPlan,
    unlockedBadges: unlockedBadges, exportJSON: exportJSON, importJSON: importJSON
  };
})(window);
