#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'tilda-embed.html'), 'utf8');

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
    return false;
  }
  console.log('ok:', msg);
  return true;
}

assert(
  /@media screen and \(min-width: 1366px\) and \(max-width: 1919px\)[\s\S]*?max-height:\s*1080px/.test(html),
  'CSS: 1366–1919 → max-height 1080px'
);

assert(
  /@media screen and \(min-width: 1920px\)[\s\S]*?max-height:\s*1220px/.test(html),
  'CSS: ≥1920 → max-height 1220px'
);

assert(html.includes("var REC_ID = '3351087101'"), 'JS rec id');

const script = html.match(/<script>([\s\S]*?)<\/script>/);
assert(!!script, 'embed contains a script');

function sandboxAt(innerWidth) {
  const rec = {
    getAttribute: function (name) {
      return name === 'data-artboard-recid' ? '3351087101' : null;
    }
  };
  const other = {
    getAttribute: function () { return 'other'; }
  };

  const listeners = {};
  const ctx = {
    innerWidth: innerWidth,
    lastRendered: null,
    scaled: 0,
    patched: false
  };

  const windowObj = {
    get innerWidth() { return ctx.innerWidth; },
    addEventListener: function (ev, cb) {
      (listeners[ev] || (listeners[ev] = [])).push(cb);
    },
    removeEventListener: function (ev, cb) {
      listeners[ev] = (listeners[ev] || []).filter(function (fn) { return fn !== cb; });
    },
    t396_ab__getHeight: function () { return 2000; }
  };

  const documentObj = {
    readyState: 'complete',
    addEventListener: function () {},
    querySelector: function (sel) {
      return sel.indexOf('t396__artboard') !== -1 ? rec : null;
    }
  };
  windowObj.document = documentObj;

  vm.runInNewContext(script[1], {
    window: windowObj,
    document: documentObj,
    t396_ab__renderView: function (artboard) {
      ctx.lastRendered = windowObj.t396_ab__getHeight(artboard);
    },
    t396_scaleBlock: function () { ctx.scaled += 1; },
    setInterval: function () { return 1; },
    clearInterval: function () {}
  });

  ctx.patched = function () {
    return !!(windowObj.t396_ab__getHeight && windowObj.t396_ab__getHeight.__maxHPatched);
  };
  ctx.getHeight = function (artboard) {
    return windowObj.t396_ab__getHeight(artboard);
  };
  ctx.resizeTo = function (w) {
    ctx.innerWidth = w;
    (listeners.resize || []).slice().forEach(function (fn) { fn(); });
  };
  ctx.own = rec;
  ctx.other = other;
  return ctx;
}

const cases = [
  [320, null, false],
  [1280, null, false],
  [1365, null, false],
  [1366, 1080, true],
  [1440, 1080, true],
  [1919, 1080, true],
  [1920, 1220, true],
  [2560, 1220, true]
];

cases.forEach(function ([w, cap, shouldPatch]) {
  const s = sandboxAt(w);
  assert(s.patched() === shouldPatch, 'width ' + w + ' patched=' + shouldPatch);
  if (shouldPatch) {
    assert(s.lastRendered === cap, 'width ' + w + ' render cap ' + cap + ' (got ' + s.lastRendered + ')');
    assert(s.getHeight(s.own) === cap, 'width ' + w + ' getHeight own ' + cap);
    assert(s.getHeight(s.other) === 2000, 'width ' + w + ' other rec stays 2000');
    assert(s.scaled >= 1, 'width ' + w + ' scaleBlock called');
  } else {
    assert(s.lastRendered === null, 'width ' + w + ' does not render');
    assert(s.getHeight(s.own) === 2000, 'width ' + w + ' original height');
  }
});

const fromNarrow = sandboxAt(1280);
assert(fromNarrow.patched() === false, 'starts inactive at 1280');
fromNarrow.resizeTo(1440);
assert(fromNarrow.patched() === true, 'activates after resize into 1366–1919');
assert(fromNarrow.lastRendered === 1080, 'cap 1080 after resize to 1440');
fromNarrow.resizeTo(1920);
assert(fromNarrow.getHeight(fromNarrow.own) === 1220, 'cap 1220 after resize to 1920');

const fromWide = sandboxAt(1920);
fromWide.resizeTo(1600);
assert(fromWide.getHeight(fromWide.own) === 1080, 'cap 1080 after resize 1920 → 1600');

if (process.exitCode) process.exit(process.exitCode);
console.log('all checks passed');
