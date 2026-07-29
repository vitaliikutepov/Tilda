(function () {
  'use strict';

  var CARD_SELECTOR = '[class*="card-animation"]';
  var ICON_SELECTOR = '.random-squares-icon';

  var ACTIVE_FILL   = '#F40D01'; // красный «включённый» квадрат
  var IDLE_FILL     = '#97A1B0'; // серый фоновый квадрат
  var IDLE_OPACITY  = '0.2';

  var STEP_MS       = 350;  // как часто перемешивать квадраты, пока курсор на карточке
  var MIN_ACTIVE    = 2;    // минимум красных квадратов в кадре
  var MAX_ACTIVE    = 4;    // максимум красных квадратов в кадре
  var MAX_DELAY_MS  = 120;  // случайная задержка перехода для «живого» эффекта

  var timers = new WeakMap();

  function getRects(card) {
    return Array.prototype.slice.call(
      card.querySelectorAll(ICON_SELECTOR + ' .sq')
    );
  }

  function rememberInitial(rect) {
    if (rect.dataset.origFill === undefined) {
      rect.dataset.origFill = rect.getAttribute('fill') || IDLE_FILL;
      rect.dataset.origOpacity =
        rect.getAttribute('fill-opacity') ||
        rect.dataset.finalOpacity ||
        IDLE_OPACITY;
    }
  }

  function shuffle(rects) {
    var activeCount = MIN_ACTIVE +
      Math.floor(Math.random() * (MAX_ACTIVE - MIN_ACTIVE + 1));

    var indices = rects.map(function (_, i) { return i; });
    for (var i = indices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
    }
    var active = {};
    indices.slice(0, activeCount).forEach(function (i) { active[i] = true; });

    rects.forEach(function (rect, i) {
      rect.style.transitionDelay = Math.floor(Math.random() * MAX_DELAY_MS) + 'ms';
      if (active[i]) {
        rect.setAttribute('fill', ACTIVE_FILL);
        rect.setAttribute('fill-opacity', '1');
      } else {
        rect.setAttribute('fill', IDLE_FILL);
        rect.setAttribute('fill-opacity', IDLE_OPACITY);
      }
    });
  }

  function restore(rects) {
    rects.forEach(function (rect) {
      rect.style.transitionDelay = '0ms';
      rect.setAttribute('fill', rect.dataset.origFill || IDLE_FILL);
      rect.setAttribute('fill-opacity', rect.dataset.origOpacity || IDLE_OPACITY);
    });
  }

  function start(card) {
    if (timers.has(card)) return;
    var rects = getRects(card);
    if (!rects.length) return;
    rects.forEach(rememberInitial);
    shuffle(rects);
    timers.set(card, setInterval(function () { shuffle(rects); }, STEP_MS));
  }

  function stop(card) {
    var timer = timers.get(card);
    if (timer !== undefined) {
      clearInterval(timer);
      timers.delete(card);
    }
    restore(getRects(card));
  }

  function closestCard(node) {
    return node && node.closest ? node.closest(CARD_SELECTOR) : null;
  }

  // Делегирование вместо mouseenter/mouseleave на самих карточках:
  // работает даже после того, как Tilda пересоздаст DOM Zero Block'а.
  document.addEventListener('mouseover', function (e) {
    var card = closestCard(e.target);
    if (!card) return;
    if (e.relatedTarget && card.contains(e.relatedTarget)) return;
    start(card);
  });

  document.addEventListener('mouseout', function (e) {
    var card = closestCard(e.target);
    if (!card) return;
    if (e.relatedTarget && card.contains(e.relatedTarget)) return;
    stop(card);
  });
})();
