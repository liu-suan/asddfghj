/* 轻伴 LightMate — 页面六：30 天成长记录 */
(function (global) {
  'use strict';
  var LM = (global.LM = global.LM || {});
  var U = LM.util, D = LM.data, S = LM.store;

  function render(root) {
    var s = S.get();
    var st = S.stats();
    var g = S.grid30();
    var stage = D.stageOf(st.dayIndex);
    var badges = S.unlockedBadges();
    var unlocked = badges.filter(function (b) { return b.unlocked; }).length;
    var r = LM.advice.weeklyReport();

    root.innerHTML =
      '<div class="page-head">' +
        '<div class="row-between wrap gap-12">' +
          '<div>' +
            '<h1 class="page-title">📊 30 天成长</h1>' +
            '<p class="page-sub">这里不看单日数字，只看一件事：你是不是还在往前走。</p>' +
          '</div>' +
          '<span class="chip chip-info">' + stage.emoji + ' ' + stage.name + ' · 第 ' + st.dayIndex + ' / ' + s.plan.targetDays + ' 天</span>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid-4 mb-16">' +
        stat('🔥', '连续坚持', st.streak, '天', '最长 ' + st.bestStreak + ' 天') +
        stat('✅', '累计打卡', st.checkinDays, '天', '坚持率 ' + st.rate + '%') +
        stat('🍽', '累计记录', st.mealCount, '餐', '日均 ' + U.comma(st.avgKcal) + ' kcal') +
        stat('⚖️', '体重变化', (st.weightDelta > 0 ? '+' : '') + st.weightDelta, 'kg', '目标 ' + s.body.targetWeight + ' kg') +
      '</div>' +

      '<div class="grid grid-dash" style="gap:18px">' +
        '<div class="stack gap-16">' +
          gridCard(g, st) +
          weightCard(st) +
          stageCard(st) +
        '</div>' +
        '<div class="stack gap-16">' +
          badgeCard(badges, unlocked) +
          reportCard(r) +
          insightCard(st, r) +
        '</div>' +
      '</div>';

    bind(root);
  }

  function stat(emoji, label, value, unit, sub) {
    return '<div class="stat">' +
      '<div class="stat-label">' + emoji + ' ' + label + '</div>' +
      '<div class="stat-value">' + value + '<small>' + unit + '</small></div>' +
      '<div class="tiny muted">' + sub + '</div>' +
    '</div>';
  }

  /* ---------------------------- 30 天热力图 ---------------------------- */
  function gridCard(g, st) {
    var done = g.filter(function (c) { return c.state === 'done'; }).length;
    var miss = g.filter(function (c) { return c.state === 'miss'; }).length;
    var partial = g.filter(function (c) { return c.state === 'partial' || c.state === 'today-partial'; }).length;
    var future = g.filter(function (c) { return c.state === 'future'; }).length;

    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🗓</span>30 天完整记录</div>' +
        '<span class="card-note">打卡 ' + done + ' · 有记录 ' + partial + ' · 中断 ' + miss + ' · 未到 ' + future + '</span>' +
      '</div>' +
      '<div class="grid30" style="grid-template-columns:repeat(10,1fr);gap:9px">' +
        g.map(function (c) {
          var label = { done: '✓', miss: '✕', partial: '·', 'today-partial': '·' }[c.state] || '';
          return '<div class="cell30 ' + c.state + '" title="第 ' + c.index + ' 天 · ' + U.fmtMDW(c.key) +
            (c.kcal ? ' · ' + U.comma(c.kcal) + ' kcal' : ' · 无记录') + '">' +
            '<span class="cell-day">' + c.index + '</span>' + label +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="legend mt-16">' +
        '<span><i style="background:linear-gradient(135deg,var(--mint-400),var(--mint-600))"></i>完成打卡</span>' +
        '<span><i style="background:var(--mint-100);border:1px solid var(--mint-200)"></i>有记录未打卡</span>' +
        '<span><i style="background:var(--bad-bg);border:1px solid #F3D3CC"></i>中断</span>' +
        '<span><i style="background:#fff;border:1px dashed var(--line-2)"></i>还没到</span>' +
      '</div>' +
      (miss > 0 ? '<div class="advice-act mt-16"><span class="mark">🌿</span><span>' +
        '<b>有 ' + miss + ' 天中断过。</b><br><span class="small">这在 30 天里很正常。真正决定结果的，是你在中断之后有没有回来——你回来了 ' +
        st.comebacks + ' 次。</span></span></div>' : '') +
    '</div>';
  }

  /* ---------------------------- 体重曲线 ---------------------------- */
  function weightCard(st) {
    var s = S.get();
    var pts = s.weights.map(function (w) { return { label: U.fmtMD(w.date), value: w.kg }; });
    var togo = Math.max(0, +(st.weightNow - s.body.targetWeight).toFixed(1));
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">📉</span>体重趋势</div>' +
        '<button class="btn btn-ghost btn-sm" id="g-weight">＋ 记录体重</button>' +
      '</div>' +
      '<div class="grid grid-3 mb-16">' +
        stat('', '起始', st.weightStart, 'kg', U.fmtMD(s.weights[0] ? s.weights[0].date : U.today())) +
        stat('', '当前', st.weightNow, 'kg', '已记录 ' + s.weights.length + ' 次') +
        stat('', '距目标', togo, 'kg', '目标 ' + s.body.targetWeight + ' kg') +
      '</div>' +
      U.lineChart(pts, { height: 220 }) +
      '<div class="tiny muted mt-12">提示：体重每天会自然波动 0.5～1kg，看趋势线，不要看单日数字。</div>' +
    '</div>';
  }

  /* ---------------------------- 阶段成长 ---------------------------- */
  function stageCard(st) {
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🌱</span>阶段成长</div>' +
        '<span class="card-note">当前：第 ' + st.dayIndex + ' 天</span>' +
      '</div>' +
      '<div class="stage-list">' +
        D.STAGES.map(function (sg) {
          var on = st.dayIndex >= sg.from + 1 && st.dayIndex <= sg.to;
          var passed = st.dayIndex > sg.to;
          return '<div class="stage' + (on ? ' on' : '') + '">' +
            '<span class="stage-emoji">' + (passed ? '✅' : sg.emoji) + '</span>' +
            '<span class="grow"><div class="row gap-8"><span class="stage-name">' + sg.name + '</span>' +
              '<span class="stage-range">第 ' + (sg.from + 1) + '～' + sg.to + ' 天</span>' +
              (on ? '<span class="chip chip-ok">进行中</span>' : passed ? '<span class="chip">已完成</span>' : '') +
            '</div>' +
            '<div class="stage-desc">' + sg.desc + '</div></span>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 徽章 ---------------------------- */
  function badgeCard(badges, unlocked) {
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🏅</span>徽章墙</div>' +
        '<span class="card-note">已解锁 ' + unlocked + ' / ' + badges.length + '</span>' +
      '</div>' +
      '<div class="badges">' +
        badges.map(function (b) {
          return '<div class="badge' + (b.unlocked ? ' on' : '') + '">' +
            '<div class="badge-emoji">' + b.emoji + '</div>' +
            '<div class="badge-name">' + b.name + '</div>' +
            '<div class="badge-desc">' + b.desc + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 本周小结 ---------------------------- */
  function reportCard(r) {
    var goal = S.kcalGoal();
    var max = Math.max.apply(null, r.days.map(function (k) { return S.dayKcal(k); }).concat([goal]));
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">📝</span>本周小结</div>' +
        '<span class="card-note">日均 ' + U.comma(r.avgKcal) + ' kcal</span>' +
      '</div>' +
      '<div class="row" style="align-items:flex-end;gap:5px;height:88px">' +
        r.days.map(function (k) {
          var kc = S.dayKcal(k);
          var h = max > 0 ? Math.max(5, Math.round((kc / max) * 76)) : 5;
          var over = kc > goal * 1.15;
          return '<div class="grow center" title="' + U.fmtMDW(k) + ' · ' + U.comma(kc) + ' kcal">' +
            '<div style="height:' + h + 'px;border-radius:6px 6px 3px 3px;background:' +
              (kc === 0 ? 'var(--bg-2)' : over ? 'linear-gradient(180deg,#EE9A8C,#DD6B5C)' : 'linear-gradient(180deg,var(--mint-400),var(--mint-600))') +
              '"></div>' +
            '<div class="tiny muted mt-4">' + U.weekdayCN(k).slice(1) + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="stack gap-8 mt-16 small">' +
        '<div class="advice-line"><span class="mark">·</span><span>记录了 <b>' + r.logged + ' / 7</b> 天，打卡 <b>' + r.checked + ' / 7</b> 天。</span></div>' +
        '<div class="advice-line"><span class="mark">·</span><span>超出目标 <b>' + r.over + '</b> 天，平均每天 <b>' + U.comma(r.avgKcal) + '</b> kcal。</span></div>' +
      '</div>' +
      '<div class="advice-act mt-12"><span class="mark">🌿</span><span><b>' + U.esc(r.head) + '</b><br>' +
        '<span class="small">' + U.esc(r.body) + '</span></span></div>' +
    '</div>';
  }

  /* ---------------------------- 一句话洞察 ---------------------------- */
  function insightCard(st, r) {
    var s = S.get();
    var lines = [];

    if (st.mealCount === 0) {
      lines.push('还没有任何记录。先去记一餐，哪怕只是一杯奶茶。');
    } else {
      if (r.trend === 'down') lines.push('这一周的热量比目标略低，节奏是健康的，不要减得更狠。');
      if (r.trend === 'up') lines.push('这一周整体偏高。下周只改一件事：把最容易失控的那一项换掉。');
      if (st.comebacks > 0) lines.push('你在中断之后回来了 ' + st.comebacks + ' 次——这是 30 天里最有价值的数据。');
      if (st.streak >= 7) lines.push('连续 ' + st.streak + ' 天。这个阶段的关键不是更严格，是不要断。');
      if (s.user.hardParts.indexOf('sleep') >= 0) lines.push('你写了「睡眠最难坚持」。熬夜会直接推高第二天的食欲，先睡够比少吃更有用。');
      if (s.user.triggers.indexOf('milktea') >= 0) lines.push('奶茶是你的高频项。建议固定一个替代方案，比如无糖茶，别每次都硬扛。');
    }

    return '<div class="card" style="background:linear-gradient(160deg,#fff,var(--mint-50));border-color:var(--mint-200)">' +
      '<div class="card-title mb-12"><span class="emoji">🔎</span>轻伴看到的三件事</div>' +
      '<div class="stack gap-10 small">' +
        lines.slice(0, 4).map(function (l) {
          return '<div class="advice-line"><span class="mark">·</span><span>' + U.esc(l) + '</span></div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 事件 ---------------------------- */
  function bind(root) {
    var w = U.$('#g-weight', root);
    if (w) w.addEventListener('click', function () {
      var cur = S.latestWeight() || S.get().body.weight;
      var input = U.el('input', { class: 'input', type: 'number', step: '0.1', min: '25', max: '250' });
      input.value = cur;
      U.modal({
        title: '记录体重',
        body: '<div class="small muted mb-12">固定在同一条件下称重（建议早上空腹），数据才有比较意义。</div>',
        actions: [
          { label: '取消', kind: 'btn-ghost' },
          {
            label: '保存', kind: 'btn-primary', onClick: function () {
              var v = Number(input.value);
              if (!v || v < 25 || v > 250) { U.toast('请输入 25～250 之间的数字', 'bad'); return; }
              S.recordWeight(v);
              U.toast('已记录：' + v + ' kg', 'ok');
              LM.app.render();
            }
          }
        ]
      });
      setTimeout(function () {
        var mask = document.querySelector('.modal-mask');
        if (mask) { mask.querySelector('.modal-body').appendChild(input); input.focus(); input.select(); }
      }, 10);
    });
  }

  LM.views = LM.views || {};
  LM.views.growth = { render: render };
})(window);
