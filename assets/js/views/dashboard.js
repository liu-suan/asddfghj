/* 轻伴 LightMate — 页面三：首页 Dashboard */
(function (global) {
  'use strict';
  var LM = (global.LM = global.LM || {});
  var U = LM.util, D = LM.data, S = LM.store;

  function render(root) {
    var s = S.get();
    var t = U.today();
    var st = S.stats();
    var goal = S.kcalGoal();
    var kcal = S.dayKcal(t);
    var nd = S.nudge();
    var tp = S.taskProgress(t);
    var adv = LM.advice.dailyAdvice(t);
    var g = S.grid30();
    var gk = U.greetingKey();
    var greet = D.COPY.greeting[gk];
    var stage = D.stageOf(st.dayIndex);

    var over = kcal > goal;
    var ringPct = U.pct(kcal, goal);

    root.innerHTML =
      '<div class="grid grid-dash" style="gap:18px">' +
        '<div class="stack gap-16">' +
          heroCard(s, greet, st, stage, goal) +
          recoveryCard(s, t, st) +
          streakStrip(st) +
          kcalCard(kcal, goal, t, tp) +
          nudgeCard(nd) +
          adviceCard(adv) +
          tasksCard(t, tp) +
          mealsCard(t) +
        '</div>' +
        '<div class="stack gap-16">' +
          gridCard(g, st) +
          weeklyCard() +
          weightCard(st) +
          quickCard() +
        '</div>' +
      '</div>';

    bind(root);
  }

  /* ---------------------------- 顶部问候 ---------------------------- */
  function heroCard(s, greet, st, stage, goal) {
    return '<div class="hero-card">' +
      '<div class="row-between wrap gap-16">' +
        '<div style="position:relative;z-index:1">' +
          '<div class="hero-greet">' + greet.emoji + ' ' + greet.text + '，' + U.esc(s.user.name || '同学') + '</div>' +
          '<div class="hero-sub">' + greet.sub + '</div>' +
          '<div class="hero-chips">' +
            '<span class="chip chip-ok">🔥 连续 ' + st.streak + ' 天</span>' +
            '<span class="chip chip-info">📅 30 天计划 · 第 ' + st.dayIndex + ' 天</span>' +
            '<span class="chip">' + stage.emoji + ' ' + stage.name + '</span>' +
            '<span class="chip">🎯 今日目标 ' + U.comma(goal) + ' kcal</span>' +
          '</div>' +
        '</div>' +
        '<div class="row gap-12" style="position:relative;z-index:1">' +
          '<button class="btn btn-ghost" data-go="#/checkin">✅ 去打卡</button>' +
          '<button class="btn btn-primary" data-go="#/diet">📷 记录这一餐</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 失败恢复卡 ---------------------------- */
  function recoveryCard(s, t, st) {
    // 找最近一次「完全没记录」的过去日期（7 天内，且不早于计划开始日）
    var missKey = null;
    for (var i = 1; i <= 7; i++) {
      var k = U.addDays(t, -i);
      if (k < s.plan.startDate) break;
      var d = s.logs[k];
      if (!d || d.meals.length === 0) { missKey = k; break; }
    }
    var today = s.logs[t];
    var todayChecked = today && today.checked;
    var todayMeals = today ? today.meals.length : 0;

    // 场景 A：昨天断了，今天还没开始 → 温柔恢复引导（产品原则 4.3）
    if (missKey && !todayChecked && todayMeals === 0) {
      return '<div class="nudge nudge-aware" id="recover-card">' +
        '<div class="nudge-top"><span class="nudge-level">恢复提醒</span><span class="nudge-head">' +
          U.esc(D.COPY.recover.title.replace('{date}', U.fmtMD(missKey))) + '</span></div>' +
        '<div class="nudge-body">' + D.COPY.recover.body + '</div>' +
        '<div class="row gap-8 mt-12 wrap">' +
          '<button class="btn btn-primary btn-sm" data-go="#/diet">' + D.COPY.recover.action + '</button>' +
          '<button class="btn btn-ghost btn-sm" id="recover-dismiss">今天先跳过</button>' +
        '</div>' +
      '</div>';
    }

    // 场景 B：中断后今天已经重新开始 → 明确肯定（不说"你失败了"）
    if (missKey && (todayChecked || todayMeals > 0)) {
      return '<div class="nudge nudge-calm">' +
        '<div class="nudge-top"><span class="nudge-level">欢迎回来</span><span class="nudge-head">你在中断之后又回到计划里了 💪</span></div>' +
        '<div class="nudge-body">这是最难的一步。断掉一天不会毁掉 30 天，继续走就行。</div>' +
      '</div>';
    }
    return '';
  }

  /* ---------------------------- 连续坚持 ---------------------------- */
  function streakStrip(st) {
    var s = S.get();
    var txt = D.COPY.streak[Math.min(st.streak, D.COPY.streak.length - 1)].replace('{n}', st.streak);
    if (st.streak === 0) txt = '今天开始了，就是好的一天。';
    var pct = U.pct(st.dayIndex, s.plan.targetDays);
    return '<div class="streak-strip">' +
      '<div class="streak-flame">🔥</div>' +
      '<div class="grow">' +
        '<div class="row gap-8" style="align-items:baseline">' +
          '<span class="streak-num">' + st.streak + '<small>天</small></span>' +
          '<span class="small muted streak-msg">' + U.esc(txt) + '</span>' +
        '</div>' +
        '<div class="bar bar-mint mt-8"><i style="width:' + pct + '%"></i></div>' +
        '<div class="tiny muted mt-4">30 天约定已完成 ' + st.dayIndex + ' / ' + s.plan.targetDays + ' 天 · 累计打卡 ' + st.checkinDays + ' 天</div>' +
      '</div>' +
      '<div class="center" style="min-width:88px">' +
        '<div class="stat-label">坚持率</div>' +
        '<div class="stat-value" style="color:var(--mint-700)">' + st.rate + '<small>%</small></div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 热量环 ---------------------------- */
  function kcalCard(kcal, goal, t, tp) {
    var over = kcal > goal;
    var remain = goal - kcal;
    var pct = U.pct(kcal, goal);
    var ring = U.ringSVG(Math.min(pct, 100), {
      size: 172, stroke: 15,
      from: over ? '#EE9A8C' : '#7DD3A8',
      to: over ? '#DD6B5C' : '#3FA97A'
    });
    var mealCount = S.dayMealCount(t);
    var meals = S.get().logs[t] ? S.get().logs[t].meals : [];

    var byMeal = D.MEALS.map(function (m) {
      var kk = meals.filter(function (x) { return x.mealKey === m.key; })
        .reduce(function (a, x) { return a + S.mealKcal(x); }, 0);
      return { m: m, kcal: kk };
    });

    return '<div class="card kcal-card">' +
      '<div class="ring-wrap">' + ring +
        '<div class="ring-center">' +
          '<div class="ring-value" style="color:' + (over ? 'var(--bad)' : 'var(--ink)') + '">' + U.comma(kcal) + '</div>' +
          '<div class="ring-label">已记录 kcal</div>' +
          '<div class="ring-label" style="margin-top:4px">目标 ' + U.comma(goal) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="kcal-side">' +
        '<div class="row-between mb-8">' +
          '<div class="card-title"><span class="emoji">🍽</span>今日摄入</div>' +
          '<span class="chip ' + (over ? 'chip-bad' : 'chip-ok') + '">' +
            (over ? '超出 ' + U.comma(kcal - goal) + ' kcal' : '剩余 ' + U.comma(remain) + ' kcal') + '</span>' +
        '</div>' +
        byMeal.map(function (x) {
          var p = x.m.share * 100;
          return '<div class="row-between small" style="padding:5px 0">' +
            '<span class="muted">' + x.m.emoji + ' ' + x.m.name + '</span>' +
            '<b class="num">' + (x.kcal ? U.comma(x.kcal) : '—') + '</b>' +
          '</div>';
        }).join('') +
        '<div class="bar ' + (over ? 'bar-bad' : pct > 80 ? 'bar-warn' : 'bar-mint') + ' mt-8"><i style="width:' + Math.min(pct, 100) + '%"></i></div>' +
        '<div class="tiny muted mt-8">已记录 ' + mealCount + ' 餐 · 剩 ' + (4 - mealCount > 0 ? 4 - mealCount : 0) + ' 餐的空间</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 动态督促 ---------------------------- */
  function nudgeCard(nd) {
    var bars = '';
    for (var i = 0; i < 4; i++) bars += '<i class="' + (i <= nd.level ? 'on' : '') + '"></i>';
    return '<div class="nudge nudge-' + nd.tone + '" style="color:' + toneColor(nd.tone) + '">' +
      '<div class="nudge-top">' +
        '<span style="font-size:19px">' + nd.emoji + '</span>' +
        '<span class="nudge-level">' + nd.levelName + '</span>' +
        '<span class="tiny muted" style="margin-left:auto">督促强度</span>' +
      '</div>' +
      '<div class="nudge-head" style="color:var(--ink)">' + U.esc(nd.head) + '</div>' +
      '<div class="nudge-body">' + U.esc(nd.body) + '</div>' +
      (nd.extra ? '<div class="nudge-extra">' + U.esc(nd.extra) + '</div>' : '') +
      '<div class="nudge-meter">' + bars + '</div>' +
    '</div>';
  }

  function toneColor(tone) {
    return { calm: 'var(--mint-500)', aware: 'var(--warn)', push: '#E08A78', firm: 'var(--bad)' }[tone] || 'var(--mint-500)';
  }

  /* ---------------------------- 今日建议 ---------------------------- */
  function adviceCard(adv) {
    return '<div class="advice">' +
      '<div class="advice-head tone-' + adv.tone + '">' +
        '<div class="advice-title">💡 ' + U.esc(adv.title) + '</div>' +
      '</div>' +
      '<div class="advice-body">' +
        '<div class="advice-line"><span class="mark">—</span><span>' + U.esc(adv.body) + '</span></div>' +
        (adv.chips.length ? '<div class="row gap-8 wrap">' + adv.chips.map(function (c) {
          return '<span class="chip chip-' + c.kind + '">' + U.esc(c.label) + '</span>';
        }).join('') + '</div>' : '') +
        (adv.action ? '<div class="advice-act"><span class="mark">→</span><span>下一步：<b>' + U.esc(adv.action.label) + '</b></span></div>' : '') +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 今日任务 ---------------------------- */
  function tasksCard(t, tp) {
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">✅</span>今天要做的 <span class="tag">' + tp.done + ' / ' + tp.total + '</span></div>' +
        '<button class="btn btn-ghost btn-sm" data-go="#/checkin">去打卡</button>' +
      '</div>' +
      '<div class="stack gap-8" id="dash-tasks">' +
        tp.list.map(function (task) {
          var on = !!(S.get().logs[t] && S.get().logs[t].tasks[task.key]);
          return '<div class="task' + (on ? ' done' : '') + '" data-task="' + task.key + '">' +
            '<span class="tick">✓</span>' +
            '<span class="grow"><span class="task-label">' + task.emoji + ' ' + U.esc(task.label) + '</span>' +
              '<div class="task-note">' + U.esc(task.note) + '</div></span>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 今日饮食 ---------------------------- */
  function mealsCard(t) {
    var d = S.get().logs[t];
    var meals = (d && d.meals) || [];
    var inner;
    if (!meals.length) {
      inner = '<div class="empty"><div class="empty-emoji">📷</div>' +
        '<div class="empty-title">今天还没有记录</div>' +
        '<div class="empty-desc">拍一张照片，30 秒就能完成今天最重要的一件事。</div>' +
        '<button class="btn btn-primary mt-16" data-go="#/diet">去记录一餐</button></div>';
    } else {
      inner = meals.map(function (m) {
        var meta = D.MEALS.filter(function (x) { return x.key === m.mealKey; })[0] || D.MEALS[1];
        var kk = Math.round(S.mealKcal(m));
        return '<div class="log-item">' +
          '<span style="font-size:20px">' + meta.emoji + '</span>' +
          '<span class="grow" style="min-width:0">' +
            '<div class="row gap-8"><b class="small">' + meta.name + '</b>' +
              '<span class="tiny muted">' + U.esc(m.time || '') + '</span></div>' +
            '<div class="tiny muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
              m.items.map(function (i) { return i.emoji + i.name; }).join(' · ') + '</div>' +
          '</span>' +
          '<b class="num small">' + U.comma(kk) + '</b>' +
          '<span class="tiny muted">kcal</span>' +
        '</div>';
      }).join('');
      inner = '<div class="stack gap-8">' + inner + '</div>' +
        '<button class="btn btn-soft btn-block mt-12" data-go="#/diet">＋ 再记录一餐</button>';
    }
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">📋</span>今天的饮食</div>' +
        '<span class="card-note">' + U.fmtMDW(t) + '</span>' +
      '</div>' + inner +
    '</div>';
  }

  /* ---------------------------- 30 天进度 ---------------------------- */
  function gridCard(g, st) {
    var s = S.get();
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">📊</span>30 天进度</div>' +
        '<button class="btn btn-ghost btn-sm" data-go="#/growth">查看成长</button>' +
      '</div>' +
      '<div class="grid30">' +
        g.map(function (c) {
          return '<div class="cell30 ' + c.state + '" title="' + U.fmtMDW(c.key) + (c.kcal ? ' · ' + U.comma(c.kcal) + ' kcal' : '') + '">' +
            '<span class="cell-day">' + c.index + '</span>' +
            (c.state === 'done' ? '✓' : '') +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="legend mt-12">' +
        '<span><i style="background:linear-gradient(135deg,var(--mint-400),var(--mint-600))"></i>已完成打卡</span>' +
        '<span><i style="background:var(--mint-100);border:1px solid var(--mint-200)"></i>有记录未打卡</span>' +
        '<span><i style="background:var(--bad-bg);border:1px solid #F3D3CC"></i>中断</span>' +
        '<span><i style="background:#fff;border:1px dashed var(--line-2)"></i>还没到</span>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 本周小结 ---------------------------- */
  function weeklyCard() {
    var r = LM.advice.weeklyReport();
    var kcalGoal = S.kcalGoal();
    var max = Math.max.apply(null, r.days.map(function (k) { return S.dayKcal(k); }).concat([kcalGoal]));
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🗓</span>最近 7 天</div>' +
        '<span class="card-note">日均 ' + U.comma(r.avgKcal) + ' kcal</span>' +
      '</div>' +
      '<div class="row" style="align-items:flex-end;gap:6px;height:96px">' +
        r.days.map(function (k) {
          var kc = S.dayKcal(k);
          var h = max > 0 ? Math.max(6, Math.round((kc / max) * 84)) : 6;
          var over = kc > kcalGoal * 1.15;
          var isToday = k === U.today();
          return '<div class="grow center" title="' + U.fmtMDW(k) + ' · ' + U.comma(kc) + ' kcal">' +
            '<div style="height:' + h + 'px;border-radius:6px 6px 3px 3px;background:' +
              (kc === 0 ? 'var(--bg-2)' : over ? 'linear-gradient(180deg,#EE9A8C,#DD6B5C)' : 'linear-gradient(180deg,var(--mint-400),var(--mint-600))') +
              (isToday ? ';outline:2px solid var(--mint-500);outline-offset:2px' : '') + '"></div>' +
            '<div class="tiny muted mt-4">' + U.weekdayCN(k).slice(1) + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="advice-act mt-16"><span class="mark">🌿</span><span><b>' + U.esc(r.head) + '</b><br>' +
        '<span class="small">' + U.esc(r.body) + '</span></span></div>' +
    '</div>';
  }

  /* ---------------------------- 体重 ---------------------------- */
  function weightCard(st) {
    var s = S.get();
    var pts = s.weights.map(function (w) { return { label: U.fmtMD(w.date), value: w.kg }; });
    var delta = st.weightDelta;
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">⚖️</span>体重变化</div>' +
        '<button class="btn btn-ghost btn-sm" id="dash-weight">记录体重</button>' +
      '</div>' +
      '<div class="row gap-16 mb-12">' +
        '<div><div class="stat-label">当前</div><div class="stat-value">' + (st.weightNow || '—') + '<small>kg</small></div></div>' +
        '<div><div class="stat-label">累计变化</div><div class="stat-value ' + (delta < 0 ? 'down' : delta > 0 ? 'up' : '') + '">' +
          (delta > 0 ? '+' : '') + delta + '<small>kg</small></div></div>' +
      '</div>' +
      (pts.length >= 2 ? U.lineChart(pts, { height: 170 }) :
        '<div class="empty-chart">再记录一次体重，这里就会画出曲线。</div>') +
    '</div>';
  }

  /* ---------------------------- 快捷入口 ---------------------------- */
  function quickCard() {
    return '<div class="card">' +
      '<div class="card-title mb-12"><span class="emoji">⚡</span>快捷记录</div>' +
      '<div class="stack gap-8">' +
        ['🍚 主食', '🥬 蔬菜', '🥤 奶茶', '🍗 高蛋白'].map(function (label, i) {
          return '<button class="log-item" style="width:100%;text-align:left" data-quick="' +
            ['rice', 'qingcai', 'zhenzhu_naicha', 'jixiong'][i] + '">' +
            '<span class="grow small">' + label + '</span><span class="tiny muted">一键加入当前餐次</span></button>';
        }).join('') +
      '</div>' +
      '<div class="tiny muted mt-12">演示用快捷入口：把常见食物一键加进今天的记录。</div>' +
    '</div>';
  }

  /* ---------------------------- 事件 ---------------------------- */
  function bind(root) {
    // 通用跳转
    U.$$('[data-go]', root).forEach(function (n) {
      n.addEventListener('click', function () { location.hash = n.getAttribute('data-go'); });
    });

    // 任务勾选（原地更新，不重绘，避免滚动跳动）
    U.$$('#dash-tasks .task', root).forEach(function (node) {
      node.addEventListener('click', function () {
        var key = node.getAttribute('data-task');
        var on = S.toggleTask(key);
        node.classList.toggle('done', on);
        U.toast(on ? '记下了 ✓' : '已取消', on ? 'ok' : 'warn');
      });
    });

    var dismiss = U.$('#recover-dismiss', root);
    if (dismiss) dismiss.addEventListener('click', function () {
      var c = U.$('#recover-card', root);
      if (c) c.remove();
      U.toast('好，那我们今天轻一点。想开始时随时叫我 🌿', 'ok');
    });

    var wBtn = U.$('#dash-weight', root);
    if (wBtn) wBtn.addEventListener('click', function () { weightDialog(); });

    U.$$('[data-quick]', root).forEach(function (n) {
      n.addEventListener('click', function () {
        var fid = n.getAttribute('data-quick');
        var f = D.FOOD_MAP[fid];
        var meal = D.mealByHour(new Date().getHours());
        S.addMeal({
          mealKey: meal.key,
          items: [{ fid: f.id, name: f.name, emoji: f.emoji, unit: f.unit, kcal: f.kcal, portion: f.portion || 1 }]
        });
        U.toast('已加入' + meal.name + '：' + f.emoji + f.name, 'ok');
        LM.app.render();
      });
    });
  }

  function weightDialog() {
    var cur = S.latestWeight() || S.get().body.weight;
    var input = U.el('input', { class: 'input', type: 'number', step: '0.1', min: '25', max: '250' });
    input.value = cur;
    U.modal({
      title: '记录今天的体重',
      body: '<div class="small muted mb-12">建议固定在早上空腹、同一条件下称重，数字才有比较意义。</div>',
      actions: [
        { label: '取消', kind: 'btn-ghost' },
        {
          label: '保存', kind: 'btn-primary', onClick: function () {
            var v = Number(input.value);
            if (!v || v < 25 || v > 250) { U.toast('请输入 25～250 之间的数字', 'bad'); return; }
            S.recordWeight(v);
            U.toast('体重已记录：' + v + ' kg', 'ok');
            LM.app.render();
          }
        }
      ]
    });
    setTimeout(function () {
      var mask = document.querySelector('.modal-mask');
      if (mask) {
        var body = mask.querySelector('.modal-body');
        body.appendChild(input);
        input.focus(); input.select();
      }
    }, 10);
  }

  LM.views = LM.views || {};
  LM.views.dashboard = { render: render };
})(window);
