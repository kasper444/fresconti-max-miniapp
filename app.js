/* FRESCONTI — логика мини-приложения MAX
   Каталог + избранное + опт-заявка. Покупка — через Wildberries (внешняя ссылка).
   MAX Bridge: window.WebApp. Вне MAX — мок + fallback. */
'use strict';

(function () {
  var G = window.GLOBAL;
  var WebApp = window.WebApp || {};

  // ---------- Конфиг ----------
  var CONFIG = {
    // Куда отправлять опт-заявку. Пусто = тот же origin (server.js /api/lead).
    // Для Pages + Render: укажите абсолютный URL бэкенда.
    leadEndpoint: ''
  };

  // ---------- Состояние ----------
  var state = {
    category: 'all',
    search: '',
    favorites: new Set(),
    currentProduct: null
  };

  // ---------- Утилиты ----------
  function $(sel) { return document.querySelector(sel); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }
  function fmtVol(v) { return v || ''; }
  function fmtRating(p) {
    if (p.rating && p.reviews >= 3) return '★ ' + p.rating.toFixed(1) + ' · ' + p.reviews + ' отз.';
    return '';
  }
  function wbLink(p) { return p.wb || G.brand.wbBrand; }

  function haptic() {
    try { if (WebApp.HapticFeedback && WebApp.HapticFeedback.selectionChanged) WebApp.HapticFeedback.selectionChanged(); } catch (e) {}
  }
  function openLink(url) {
    try {
      if (WebApp.openLink) { WebApp.openLink(url); return; }
    } catch (e) {}
    window.open(url, '_blank');
  }
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2200);
  }

  // ---------- Хранилище избранного (DeviceStorage + localStorage fallback) ----------
  function loadFavorites(cb) {
    try {
      if (WebApp.DeviceStorage && WebApp.DeviceStorage.getItem) {
        WebApp.DeviceStorage.getItem('fresconti_fav').then(function (v) {
          state.favorites = new Set(v ? JSON.parse(v) : []);
          cb && cb();
        }).catch(function () { localFavFallback(); cb && cb(); });
        return;
      }
    } catch (e) {}
    localFavFallback(); cb && cb();
  }
  function localFavFallback() {
    try { state.favorites = new Set(JSON.parse(localStorage.getItem('fresconti_fav') || '[]')); }
    catch (e) { state.favorites = new Set(); }
  }
  function saveFavorites() {
    var arr = Array.from(state.favorites);
    try {
      if (WebApp.DeviceStorage && WebApp.DeviceStorage.setItem) {
        WebApp.DeviceStorage.setItem('fresconti_fav', JSON.stringify(arr)).catch(function () {});
      }
    } catch (e) {}
    try { localStorage.setItem('fresconti_fav', JSON.stringify(arr)); } catch (e) {}
    updateFavBadge();
  }
  function updateFavBadge() {
    var c = state.favorites.size;
    $('#favCount').textContent = c;
    $('#favCount').style.display = c ? 'flex' : 'none';
  }
  function toggleFavorite(id, silent) {
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    saveFavorites();
    if (!silent) toast(state.favorites.has(id) ? 'Добавлено в избранное ♥' : 'Убрано из избранного');
    renderAll();
  }

  // ---------- Приветствие / пользователь ----------
  function initUser() {
    var u = {};
    try {
      u = (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) || {};
    } catch (e) {}
    var name = u.first_name || 'Гость';
    $('#greeting').textContent = name === 'Гость'
      ? 'Добро пожаловать! 👋'
      : 'Здравствуйте, ' + esc(name) + '! 👋';
  }

  // ---------- Рендер: вкладки ----------
  function renderTabs() {
    var el = $('#tabs');
    el.innerHTML = '';
    G.categories.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'tab' + (state.category === c.id ? ' active' : '');
      b.textContent = c.emoji + ' ' + c.name;
      b.addEventListener('click', function () {
        state.category = c.id; state.search = ''; $('#searchInput').value = '';
        renderAll(); haptic();
      });
      el.appendChild(b);
    });
  }

  // ---------- Рендер: товары ----------
  function filteredProducts() {
    var q = state.search.trim().toLowerCase();
    return G.products.filter(function (p) {
      var okCat = state.category === 'all' || p.cat === state.category;
      var okSearch = !q || (p.name + ' ' + (p.desc || '')).toLowerCase().indexOf(q) !== -1;
      return okCat && okSearch;
    });
  }

  function productCard(p) {
    var card = document.createElement('div');
    card.className = 'product-card';
    var rating = fmtRating(p);
    card.innerHTML =
      '<img class="product-img" src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" />' +
      '<div class="product-body">' +
        '<h3 class="product-name">' + esc(p.name) + '</h3>' +
        '<div class="product-vol">' + esc(fmtVol(p.vol)) + '</div>' +
        (rating ? '<div class="product-rating">' + esc(rating) + '</div>' : '') +
        '<div class="product-actions">' +
          '<button class="buy-btn" data-act="buy">Купить</button>' +
          '<button class="fav-toggle' + (state.favorites.has(p.id) ? ' on' : '') + '" data-act="fav" aria-label="В избранное">♥</button>' +
        '</div>' +
      '</div>';

    card.querySelector('.buy-btn').addEventListener('click', function (e) { e.stopPropagation(); openLink(wbLink(p)); haptic(); });
    card.querySelector('.fav-toggle').addEventListener('click', function (e) { e.stopPropagation(); toggleFavorite(p.id); haptic(); });
    card.addEventListener('click', function () { openProduct(p); });
    return card;
  }

  function renderProducts() {
    var el = $('#products');
    el.innerHTML = '';
    var list = filteredProducts();
    if (!list.length) {
      el.innerHTML = '<div class="empty" style="grid-column:1/-1">Ничего не найдено — попробуйте другой запрос.</div>';
      return;
    }
    list.forEach(function (p) { el.appendChild(productCard(p)); });
  }

  // ---------- Рендер: избранное ----------
  function renderFavorites() {
    var list = G.products.filter(function (p) { return state.favorites.has(p.id); });
    $('#favEmpty').hidden = list.length > 0;
    var el = $('#favList');
    el.innerHTML = '';
    list.forEach(function (p) { el.appendChild(productCard(p)); });
  }

  // ---------- Рендер: о бренде ----------
  function renderAbout() {
    $('#aboutText').textContent = G.brand.about;
    $('#manufText').textContent = G.brand.manufacturer;
    var rows = $('#contactRows');
    rows.innerHTML = '';
    var items = [
      { label: 'Телефон', href: 'tel:' + G.brand.phone.replace(/[^+\d]/g, ''), text: G.brand.phone },
      { label: 'Email', href: 'mailto:' + G.brand.email, text: G.brand.email },
      { label: 'Адрес', href: null, text: G.brand.address }
    ];
    items.forEach(function (it) {
      var d = document.createElement('div');
      d.className = 'contact-row';
      var inner = '<strong>' + it.label + ':</strong> ' +
        (it.href ? '<a href="' + esc(it.href) + '">' + esc(it.text) + '</a>' : esc(it.text));
      d.innerHTML = inner;
      if (it.href && it.href.indexOf('tel:') === 0) {
        d.querySelector('a').addEventListener('click', function (e) { e.preventDefault(); openLink(it.href); });
      }
      rows.appendChild(d);
    });
  }

  // ---------- Модальное окно товара ----------
  function openProduct(p) {
    state.currentProduct = p;
    $('#pmImg').src = p.img;
    $('#pmImg').alt = p.name;
    $('#pmName').textContent = p.name;
    var r = fmtRating(p);
    $('#pmMeta').innerHTML = '<span class="star">' + esc(r) + '</span>'
      + (r ? ' · ' : '') + esc(fmtVol(p.vol));
    $('#pmDesc').textContent = p.desc || '';
    $('#pmFav').innerHTML = (state.favorites.has(p.id) ? '♥ Убрать из избранного' : '♥ В избранное');
    $('#productModal').hidden = false;
    showBack();
  }
  function closeProduct() {
    $('#productModal').hidden = true;
    state.currentProduct = null;
    if (activeScreen() === 'catalog') hideBack();
  }

  // ---------- Навигация между экранами ----------
  function activeScreen() {
    if (!$('#favoritesScreen').hidden) return 'favorites';
    if (!$('#aboutScreen').hidden) return 'about';
    return 'catalog';
  }
  function showScreen(id) {
    ['catalogScreen', 'favoritesScreen', 'aboutScreen'].forEach(function (s) {
      $('#' + s).hidden = (s !== id);
    });
    window.scrollTo(0, 0);
    if (id === 'catalogScreen') { renderProducts(); hideBack(); }
    if (id === 'favoritesScreen') { renderFavorites(); showBack(); }
    if (id === 'aboutScreen') { renderAbout(); showBack(); }
  }

  function renderAll() {
    renderTabs();
    renderProducts();
    renderFavorites();
  }

  // ---------- Кнопка «Назад» ----------
  function showBack() {
    var b = $('#backBtn');
    b.hidden = false;
    try { if (WebApp.BackButton && WebApp.BackButton.show) WebApp.BackButton.show(); } catch (e) {}
  }
  function hideBack() {
    var b = $('#backBtn');
    b.hidden = true;
    try { if (WebApp.BackButton && WebApp.BackButton.hide) WebApp.BackButton.hide(); } catch (e) {}
  }
  function goBack() {
    if (!$('#productModal').hidden) { closeProduct(); return; }
    if (!$('#aboutScreen').hidden) { showScreen('catalogScreen'); return; }
    if (!$('#favoritesScreen').hidden) { showScreen('catalogScreen'); return; }
  }

  // ---------- Опт-заявка ----------
  function submitLead(e) {
    e.preventDefault();
    var name = $('#lName').value.trim();
    var contact = $('#lContact').value.trim();
    var comment = $('#lComment').value.trim();
    if (!name || !contact) { toast('Заполните имя и контакт'); return; }
    var payload = {
      name: name, contact: contact, comment: comment,
      initData: (typeof WebApp.initData === 'string') ? WebApp.initData : ''
    };
    var btn = $('#leadSubmit');
    btn.disabled = true; btn.textContent = 'Отправка…';

    var endpoint = CONFIG.leadEndpoint || '/api/lead';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (data) {
        btn.disabled = false; btn.textContent = 'Отправить заявку';
        if (data && data.ok) {
          toast('Заявка отправлена! ✅');
          $('#leadForm').reset();
        } else {
          toast('Не удалось отправить — напишите на ' + G.brand.email);
        }
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = 'Отправить заявку';
        toast('Не удалось отправить — напишите на ' + G.brand.email);
      });
  }

  // ---------- Номер телефона из MAX ----------
  function requestContact() {
    try {
      if (WebApp.requestContact) {
        WebApp.requestContact().then(function (res) {
          if (res && res.phone) { $('#lContact').value = '+' + String(res.phone).replace(/^\+/, ''); }
        }).catch(function () { toast('Не удалось получить номер'); });
        return;
      }
    } catch (e) {}
    toast('Доступно только внутри MAX');
  }

  // ---------- Шаринг ----------
  function shareApp() {
    var text = 'FRESCONTI — премиальные соленья, соусы и маринады 🍅🥒 ' + G.brand.wbBrand;
    try {
      if (WebApp.shareMaxContent) { WebApp.shareMaxContent({ text: text }); return; }
      if (WebApp.shareContent) { WebApp.shareContent({ text: text }); return; }
    } catch (e) {}
    toast('Шаринг доступен внутри MAX');
  }

  // ---------- Инициализация ----------
  function bind() {
    $('#favBtn').addEventListener('click', function () { showScreen('favoritesScreen'); haptic(); });
    $('#aboutBtn').addEventListener('click', function () { showScreen('aboutScreen'); haptic(); });
    $('#backBtn').addEventListener('click', function () { goBack(); haptic(); });
    $('#shareBtn').addEventListener('click', shareApp);
    $('#heroShare').addEventListener('click', shareApp);
    $('#heroWb').addEventListener('click', function () { openLink(G.brand.wbBrand); });
    $('#wbBrandBtn').addEventListener('click', function () { openLink(G.brand.wbBrand); });
    $('#siteBtn').addEventListener('click', function () { openLink(G.brand.site); });

    var si = $('#searchInput');
    var deb;
    si.addEventListener('input', function () {
      clearTimeout(deb);
      deb = setTimeout(function () { state.search = si.value; renderProducts(); }, 200);
    });

    $('#modalClose').addEventListener('click', closeProduct);
    $('#modalBackdrop').addEventListener('click', closeProduct);
    $('#pmBuy').addEventListener('click', function () { if (state.currentProduct) { openLink(wbLink(state.currentProduct)); haptic(); } });
    $('#pmFav').addEventListener('click', function () { if (state.currentProduct) { toggleFavorite(state.currentProduct.id); haptic(); } });

    $('#leadForm').addEventListener('submit', submitLead);
    $('#contactBtn').addEventListener('click', requestContact);

    try {
      if (WebApp.BackButton && WebApp.BackButton.onClick) WebApp.BackButton.onClick(goBack);
    } catch (e) {}
  }

  function init() {
    initUser();
    bind();
    renderAll();
    loadFavorites(function () { renderAll(); updateFavBadge(); });
    updateFavBadge();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
