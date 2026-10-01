/* 轻伴 LightMate — 应用入口：路由 + 骨架 */
(function (global) {
  'use strict';
  var LM = (global.LM = global.LM || {});
  var U = LM.util, D = LM.data, S = LM.store;

  var NAV = [
    { hash: '#/today',   emoji: '🏠', label: '今日',     title: '今日' },
    { hash: '#/diet',    emoji: '📷', label: '饮食',     title: 'AI 饮食分析' },
    { hash: '#/checkin', emoji: '✅', label: '打卡',     title: '每日打卡' },
    { hash: '#/growth',  emoji: '📊', label: '成长',     title: '30 天成长' },
    { hash: '#/plan',    emoji: '🌱', label: '我的计划', title: '我的计划' }
  ];

  // 路由名 → 视图注册名（'today' 对应的视图是 dashboard）
  var VIEW_OF = {
    welcome: 'welcome',
    onboarding: 'onboarding',
    today: 'dashboard',
    diet: 'diet',
    checkin: 'checkin',
    growth: 'growth',
    plan: 'plan'
  };

  var FULL_PAGE = { welcome: 'welcome', onboarding: 'onboarding' };
  var rendering = false;
  var dirty = false;
  var shellBuilt = false;

  function viewOf(routeName) { return LM.views[VIEW_OF[routeName] || routeName]; }

  /* ================================================================== *
   * 路由
   * ================================================================== */
  function currentRoute() {
    var raw = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    if (!raw) return 'today';
    if (FULL_PAGE[raw]) return raw;
    if (NAV.some(function (n) { return n.hash === '#/' + raw; })) return raw;
    return 'today';
  }

  /**
   * 同步渲染（可重入）。
   * 不用 requestAnimationFrame 合并：HEADLESS / 后台标签页里 rAF 可能被冻结，
   * 一旦 pending 标志卡住，后续所有渲染都会被静默丢弃。
   */
  function render() {
    if (rendering) { dirty = true; return; }
    rendering = true;
    var guard = 0;
    do {
      dirty = false;
      doRender();
    } while (dirty && ++guard < 5);
    rendering = false;
  }

  function doRender() {
    var name = currentRoute();
    var onboarded = S.get().onboarded;
    var app = U.$('#app');
    var scrollY = global.scrollY;

    // 首次使用：直接进欢迎页
    if (!onboarded && name !== 'welcome' && name !== 'onboarding') {
      location.hash = '#/welcome';
      return;
    }
    if (onboarded && name === 'welcome') {
      location.hash = '#/today';
      return;
    }

    // 全屏页（欢迎 / 引导）
    if (FULL_PAGE[name]) {
      shellBuilt = false;
      app.innerHTML = '<div id="view"></div>';
      var fv = viewOf(name);
      if (typeof fv === 'function') fv(U.$('#view', app));
      else if (fv && fv.render) fv.render(U.$('#view', app));
      global.scrollTo(0, 0);
      return;
    }

    // 应用骨架
    if (!shellBuilt || !U.$('#view', app)) {
      buildShell(app);
      shellBuilt = true;
      scrollY = 0;
    }
    syncShell(name);
    var view = U.$('#view', app);
    var v = viewOf(name);
    if (typeof v === 'function') v(view);
    else if (v && v.render) v.render(view);
    else { console.warn('[轻伴] 未找到路由对应的视图:', name); }

    if (scrollY) global.scrollTo(0, scrollY);
  }

  /* ================================================================== *
   * 骨架
   * ================================================================== */
  function buildShell(app) {
    app.innerHTML =
      '<div class="shell">' +
        '<aside class="sidebar">' +
          '<div class="brand">' +
            '<div class="brand-logo">🌿</div>' +
            '<div><div class="brand-name">轻伴</div><div class="brand-sub">LightMate</div></div>' +
          '</div>' +
          '<nav class="nav" id="nav">' +
            NAV.map(function (n) {
              return '<a class="nav-item" href="' + n.hash + '" data-nav="' + n.hash + '">' +
                '<span class="nav-emoji">' + n.emoji + '</span><span>' + n.label + '</span>' +
                (n.hash === '#/checkin' ? '<span class="nav-badge hide" id="nav-badge">0</span>' : '') +
              '</a>';
            }).join('') +
          '</nav>' +
          '<div class="sidebar-foot">' +
            '<div class="mini-plan" id="mini-plan"></div>' +
          '</div>' +
        '</aside>' +
        '<div class="main">' +
          '<header class="topbar">' +
            '<div>' +
              '<div class="topbar-title" id="top-title">今日</div>' +
              '<div class="topbar-date" id="top-date"></div>' +
            '</div>' +
            '<div class="topbar-right">' +
              '<button class="btn btn-ghost btn-sm" id="top-demo">🎬 演示数据</button>' +
              '<div class="avatar" id="top-avatar">同</div>' +
            '</div>' +
          '</header>' +
          '<main class="content" id="view"></main>' +
        '</div>' +
      '</div>' +
      '<nav class="tabbar">' +
        NAV.map(function (n) {
          return '<a class="tab" href="' + n.hash + '" data-nav="' + n.hash + '">' +
            '<span class="tab-emoji">' + n.emoji + '</span><span>' + n.label + '</span></a>';
        }).join('') +
      '</nav>';

    U.$('#top-demo', app).addEventListener('click', function () {
      U.modal({
        title: '载入 18 天演示数据？',
        body: '<p>会生成一段完整的使用历史（含一次 3 天中断），用来展示成长曲线、热力图、动态督促与失败恢复。</p>' +
              '<p class="mt-8 muted small">当前数据会被覆盖。建议先在「我的计划」里导出备份。</p>',
        actions: [
          { label: '取消', kind: 'btn-ghost' },
          {
            label: '载入演示数据', kind: 'btn-primary', onClick: function () {
              S.seedDemo();
              U.toast('演示数据已载入：18 天记录 + 1 次中断恢复 🎬', 'ok');
              location.hash = '#/today';
              render();
            }
          }
        ]
      });
    });
  }

  function syncShell(name) {
    U.$$('[data-nav]').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === '#/' + name);
    });

    var nav = NAV.filter(function (n) { return n.hash === '#/' + name; })[0];
    var title = U.$('#top-title'), date = U.$('#top-date');
    if (title) title.textContent = nav ? nav.title : '今日';
    if (date) date.textContent = U.fmtMDW(U.today());

    // 头像
    var av = U.$('#top-avatar');
    if (av) av.textContent = (S.get().user.name || '同学').slice(0, 1);

    // 打卡角标
    var badge = U.$('#nav-badge');
    if (badge) {
      var tp = S.taskProgress(U.today());
      var d = S.get().logs[U.today()];
      var left = tp.total - tp.done;
      if (left > 0 && !(d && d.checked)) {
        badge.textContent = left;
        badge.classList.remove('hide');
      } else badge.classList.add('hide');
    }

    // 侧边栏迷你计划
    var mini = U.$('#mini-plan');
    if (mini) {
      var st = S.stats();
      var s = S.get();
      mini.innerHTML =
        '<div class="mini-plan-top"><span>30 天进度</span><b class="num">' + st.dayIndex + '/' + s.plan.targetDays + '</b></div>' +
        '<div class="mini-bar"><i style="width:' + U.pct(st.dayIndex, s.plan.targetDays) + '%"></i></div>' +
        '<div class="mini-plan-top mt-8"><span>🔥 连续</span><b>' + st.streak + ' 天</b></div>' +
        '<div class="mini-plan-top"><span>✅ 累计打卡</span><b>' + st.checkinDays + ' 天</b></div>' +
        '<div class="tiny muted mt-8" style="line-height:1.5">' + U.esc((s.user.commitment || '').slice(0, 40)) + '</div>';
    }
  }

  /* ================================================================== *
   * 启动
   * ================================================================== */
  function boot() {
    S.load();
    S.subscribe(function () { render(); });

    global.addEventListener('hashchange', function () {
      var v = viewOf(currentRoute());
      if (v && v.reset) v.reset();
      render();
      global.scrollTo(0, 0);
    });

    // 键盘快捷：数字键切换页面（演示时方便）
    global.addEventListener('keydown', function (e) {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var map = { '1': '#/today', '2': '#/diet', '3': '#/checkin', '4': '#/growth', '5': '#/plan' };
      if (map[e.key] && S.get().onboarded) location.hash = map[e.key];
    });

    if (!location.hash) location.hash = S.get().onboarded ? '#/today' : '#/welcome';
    render();
  }

  LM.app = { render: render, boot: boot, NAV: NAV, VIEW_OF: VIEW_OF, currentRoute: currentRoute };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
