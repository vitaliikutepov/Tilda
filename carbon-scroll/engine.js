(function(){
  var root = document.getElementById("mp-carbon");
  if (!root) return;
  var d = document;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c){ return (c || root).querySelector(s); }
  function $$(s, c){ return Array.prototype.slice.call((c || root).querySelectorAll(s)); }
  function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
  function seg(p, a, b){ return b === a ? 1 : clamp((p - a) / (b - a), 0, 1); }
  function ease(t){ return t * t * (3 - 2 * t); }

  var climb = root.closest("[id^='rec']") || root.parentElement;
  for (var i = 0; i < 6 && climb; i++){
    climb.style.overflow = "visible";
    climb = climb.parentElement;
  }

  var svg = $(".mp-art", root);
  var flowClip = $("#mp-flow-clip-rect", svg);
  var flows = $$(".mp-flow", svg);
  var hexes = $$(".mp-hex", svg);
  var routeWraps = $$(".mp-route-wrap", svg);
  var routes = $$(".mp-route", svg);
  var s3labs = $$(".mp-s3-lab", svg);
  var cards = $$(".mp-card", svg);
  var cardDraws = $$(".mp-card-draw", svg);
  var shimmers = $$(".mp-card-shimmer", svg);
  var gauges = $$(".mp-gauge", svg);
  var dotsG = $("#mp-dots", svg);
  var bloomCircs = $$(".mp-bloom", svg);
  var shimmerGrad = $("#mp-shimmer", svg);
  var SVGNS = "http://www.w3.org/2000/svg";

  flows.forEach(function(n){
    try { n._len = n.getTotalLength(); } catch (e){ n._len = 400; }
  });
  hexes.forEach(function(n, i){
    try { n._len = n.getTotalLength(); } catch (e){ n._len = 200; }
    try {
      var b = n.getBBox();
      n._cx = b.x + b.width / 2;
      n._cy = b.y + b.height / 2;
    } catch (e){ n._cx = 0; n._cy = i; }
  });
  var hexMin = Infinity, hexMax = -Infinity;
  hexes.forEach(function(n){ hexMin = Math.min(hexMin, n._cy); hexMax = Math.max(hexMax, n._cy); });
  hexes.forEach(function(n){ n._yt = (n._cy - hexMin) / Math.max(hexMax - hexMin, 1); });

  routes.forEach(function(n, i){
    try { n._len = n.getTotalLength(); } catch (e){ n._len = 300; }
    try {
      var b = n.getBBox();
      n._cx = b.x + b.width / 2;
      n._cy = b.y + b.height / 2;
    } catch (e){ n._cx = 850; n._cy = 360; }
    if (bloomCircs[i]){
      bloomCircs[i].setAttribute("cx", n._cx);
      bloomCircs[i].setAttribute("cy", n._cy);
    }
  });

  /* route i → card j + translation from grid pose to card pose */
  var ROUTE_TO_CARD = [1, 0, 2];
  var ROUTE_MOVE = [
    { dx: 851.44 - 926.354, dy: 361.369 - 377.071 },
    { dx: 360.028 - 441.203, dy: 361.369 - 209.072 },
    { dx: 1391 - 1409.18, dy: 389.072 - 433.265 }
  ];

  cardDraws.forEach(function(n){ n.style.opacity = "0"; });

  gauges.forEach(function(g){
    var arc = $(".mp-gauge-arc", g);
    arc._C = 2 * Math.PI * 135.4;
    arc.style.strokeDasharray = "0 " + arc._C;
    g._v = parseFloat(g.getAttribute("data-v"));
    g._dec = parseInt(g.getAttribute("data-dec"), 10);
    g._val = $(".mp-gauge-val", g);
    g._xy = (g.getAttribute("transform") || "translate(0,0)").replace(/scale\([^)]*\)/, "").trim();
    g.style.opacity = "0";
  });
  cards.forEach(function(g){ g.style.opacity = "0"; });
  s3labs.forEach(function(g){ g.style.opacity = "0"; });
  routes.forEach(function(n){ n.style.opacity = "0"; });

  function setHexDraw(n, t){
    t = clamp(t, 0, 1);
    if (t >= 1){
      n.style.strokeDasharray = "none";
      n.style.strokeDashoffset = "0";
      return;
    }
    n.style.strokeDasharray = n._len;
    n.style.strokeDashoffset = String(n._len * (1 - t));
  }
  function setRouteDraw(n, t){
    t = clamp(t, 0, 1);
    n.style.strokeDasharray = n._len;
    n.style.strokeDashoffset = String(n._len * (1 - t));
    if (t >= 1){
      n.style.strokeDasharray = "none";
      n.style.strokeDashoffset = "0";
    }
  }

  var P = {
    linesEnd: 0.11,
    hold1: 0.20,
    gridEnd: 0.34,
    holdGrid: 0.42,
    routesEnd: 0.56,
    holdRoutes: 0.64,
    cardsEnd: 0.76,
    holdCards: 0.84,
    gaugesEnd: 0.97
  };

  var introClock = 0;
  var lastTs = 0;
  var dots = [];
  var spawnAcc = 0;

  function spawnDot(){
    if (dots.length > 16) return;
    var line = flows[Math.floor(Math.random() * flows.length)];
    if (!line || !line._len) return;
    var c = d.createElementNS(SVGNS, "circle");
    c.setAttribute("fill", "#fff");
    dotsG.appendChild(c);
    dots.push({
      el: c, line: line, t: 0,
      speed: 0.16 + Math.random() * 0.28,
      r0: 6 + Math.random() * 9
    });
  }

  function tickDots(dt, allow){
    if (allow){
      spawnAcc += dt;
      while (spawnAcc > 0.2){
        spawnAcc -= 0.2;
        spawnDot();
      }
    } else {
      spawnAcc = 0;
    }
    for (var i = dots.length - 1; i >= 0; i--){
      var o = dots[i];
      o.t += o.speed * dt;
      if (o.t >= 1 || (!allow && o.t > 0.02)){
        o.el.remove();
        dots.splice(i, 1);
        continue;
      }
      var pt = o.line.getPointAtLength(Math.min(0.999, o.t) * o.line._len);
      o.el.setAttribute("cx", pt.x);
      o.el.setAttribute("cy", pt.y);
      o.el.setAttribute("r", String(Math.max(0.15, o.r0 * (1 - o.t))));
      o.el.setAttribute("opacity", String(1 - o.t * 0.12));
    }
  }

  function fmt(v, dec){
    if (dec === 0) return Math.round(v) + "%";
    return v.toFixed(dec) + "%";
  }

  var sceneTop = 0, sceneH = 1;
  function measure(){
    var r = root.getBoundingClientRect();
    sceneTop = r.top + window.pageYOffset;
    sceneH = root.offsetHeight;
  }

  function apply(p, now, dt){
    var lineT = Math.max(
      ease(seg(p, 0, P.linesEnd)),
      reduced ? 1 : ease(clamp(introClock / 2.6, 0, 1))
    );
    if (flowClip) flowClip.setAttribute("height", String(726 * lineT));
    var flowFade = 1 - ease(seg(p, P.hold1, P.gridEnd * 0.9));
    flows.forEach(function(n){
      n.style.opacity = String(flowFade);
      n.style.strokeDashoffset = String(-((now / 40) % 30));
    });

    var gridT = ease(seg(p, P.hold1, P.gridEnd));
    var gridFade = 1 - ease(seg(p, P.holdRoutes, P.cardsEnd));
    hexes.forEach(function(n){
      var lt = seg(gridT, n._yt * 0.5, n._yt * 0.5 + 0.5);
      setHexDraw(n, lt);
      var pulse = 1;
      if (gridT > 0.2 && gridFade > 0.05){
        pulse = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(now * 0.0015 + n._cx * 0.012 + n._yt * 2.4));
      }
      n.style.opacity = String(lt * gridFade * pulse);
    });

    var routeT = ease(seg(p, P.holdGrid, P.routesEnd));
    var toCards = ease(seg(p, P.holdRoutes, P.cardsEnd));
    var leaveCards = ease(seg(p, P.holdCards, P.gaugesEnd));

    routes.forEach(function(n, i){
      var st = i * 0.18;
      var lt = ease(seg(routeT, st, st + 0.52));
      setRouteDraw(n, lt);
      n.style.opacity = String(clamp(lt * 5, 0, 1) * (1 - leaveCards));
      if (bloomCircs[i]) bloomCircs[i].setAttribute("r", String(toCards > 0.02 ? 2000 : 8 + 360 * lt));
      var wrap = routeWraps[i];
      if (wrap){
        var mv = ROUTE_MOVE[i];
        wrap.setAttribute("transform", "translate(" + (mv.dx * toCards) + "," + (mv.dy * toCards) + ")");
      }
    });

    s3labs.forEach(function(g, i){
      var st = i * 0.18;
      var vis = ease(seg(routeT, st + 0.28, st + 0.55)) * (1 - toCards);
      g.style.opacity = String(vis);
    });

    cards.forEach(function(g, i){
      var st = i * 0.1;
      var vis = ease(seg(toCards, st, st + 0.5)) * (1 - leaveCards);
      g.style.opacity = String(vis);
      var frame = $(".mp-card-frame", g);
      var x = +frame.getAttribute("x"), y = +frame.getAttribute("y");
      var w = +frame.getAttribute("width"), h = +frame.getAttribute("height");
      g.style.transformOrigin = (x + w / 2) + "px " + (y + h / 2) + "px";
      g.style.transform = "scale(" + (0.97 + 0.03 * vis) + ")";
      if (shimmers[i]) shimmers[i].setAttribute("opacity", vis > 0.65 ? String(0.22) : "0");
    });

    var gT = ease(seg(p, P.holdCards, P.gaugesEnd));
    gauges.forEach(function(g, i){
      var st = i * 0.13;
      var lt = ease(seg(gT, st, st + 0.4));
      g.style.opacity = String(lt);
      g.setAttribute("transform", g._xy + " scale(" + (0.9 + 0.1 * lt) + ")");
      var arc = $(".mp-gauge-arc", g);
      var pct = (g._v / 100) * lt;
      arc.style.strokeDasharray = (arc._C * pct) + " " + arc._C;
      g._val.textContent = fmt(g._v * lt, g._dec);
    });

    if (shimmerGrad){
      var ox = (Math.sin(now * 0.0008) * 0.5 + 0.5) * 1702;
      shimmerGrad.setAttribute("x1", ox - 240);
      shimmerGrad.setAttribute("x2", ox + 240);
    }

    var inStage1 = p < P.hold1 && lineT > 0.28;
    tickDots(dt, inStage1 && !reduced);
  }

  function progress(){
    var y = window.pageYOffset;
    var vh = window.innerHeight;
    var span = Math.max(1, sceneH - vh);
    return clamp((y - sceneTop) / span, 0, 1);
  }

  function frame(ts){
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    var p = progress();
    if (p < 0.03 && introClock < 2.6) introClock += dt;
    apply(p, ts, dt);
    lastTs = ts;
    requestAnimationFrame(frame);
  }

  if (reduced) introClock = 99;
  measure();
  apply(progress(), performance.now(), 0.016);
  requestAnimationFrame(frame);
  window.addEventListener("resize", measure, { passive: true });
})();
