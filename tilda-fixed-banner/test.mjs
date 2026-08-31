/**
 * Headless checks for tilda-fixed-banner/tilda-embed.html
 * Run: node tilda-fixed-banner/test.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

function startServer() {
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
  };
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = path.join(ROOT, urlPath === '/' ? 'demo.html' : urlPath);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'text/plain' });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function loadPuppeteer() {
  const tmp = '/tmp/tilda-fixed-banner-tests';
  try {
    return createRequire(path.join(tmp, 'package.json'))('puppeteer-core');
  } catch {
    const { execSync } = await import('node:child_process');
    fs.mkdirSync(tmp, { recursive: true });
    if (!fs.existsSync(path.join(tmp, 'package.json'))) {
      fs.writeFileSync(path.join(tmp, 'package.json'), '{"name":"banner-tests","private":true}');
    }
    execSync('npm install puppeteer-core@24', { cwd: tmp, stdio: 'inherit' });
    return createRequire(path.join(tmp, 'package.json'))('puppeteer-core');
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function waitBannerReady(page) {
  await page.waitForFunction(() => {
    const el = document.getElementById('rec2643778101');
    return el && el.querySelector('.close-banner');
  });
  await page.waitForFunction(() =>
    getComputedStyle(document.getElementById('rec2643778101')).position === 'fixed'
  );
}

async function clickEl(page, selector) {
  await page.$eval(selector, (el) => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  });
}

async function showBanner(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 1700);
    window.dispatchEvent(new Event('scroll'));
  });
  await page.waitForFunction(() =>
    document.getElementById('rec2643778101').classList.contains('banner-visible')
  );
}

async function run() {
  const puppeteer = await loadPuppeteer();
  const { server, port } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const url = `http://127.0.0.1:${port}/demo.html`;
  const checks = [];

  try {
    const desktop = await browser.newPage();
    await desktop.setViewport({ width: 1280, height: 800 });
    await desktop.goto(url, { waitUntil: 'networkidle0' });
    await waitBannerReady(desktop);
    assert(
      !(await desktop.$eval('#rec2643778101', (el) => el.classList.contains('banner-collapsed'))),
      'desktop should not start collapsed'
    );
    await showBanner(desktop);
    await clickEl(desktop, '.close-banner');
    await desktop.waitForFunction(() =>
      !document.getElementById('rec2643778101').classList.contains('banner-visible')
    );
    checks.push('desktop: close immediately hides banner');
    await desktop.close();

    const mobile = await browser.newPage();
    await mobile.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await mobile.goto(url, { waitUntil: 'networkidle0' });
    await waitBannerReady(mobile);
    assert(
      await mobile.$eval('#rec2643778101', (el) => el.classList.contains('banner-collapsed')),
      'mobile should start collapsed'
    );
    await showBanner(mobile);
    assert(
      await mobile.$eval('.banner-text', (el) => getComputedStyle(el).display === 'none'),
      'collapsed hides banner-text'
    );
    assert(
      await mobile.$eval('.banner-button', (el) => getComputedStyle(el).display === 'none'),
      'collapsed hides banner-button'
    );

    await clickEl(mobile, '.banner-header');
    await mobile.waitForFunction(() =>
      !document.getElementById('rec2643778101').classList.contains('banner-collapsed')
    );
    assert(
      await mobile.$eval('.banner-button', (el) => getComputedStyle(el).display !== 'none'),
      'expanded shows Подробнее'
    );
    const href = await mobile.$eval('.banner-button', (el) => el.getAttribute('href'));
    assert(href && href.includes('hackathon_2026'), 'Подробнее keeps href');
    checks.push('mobile: tap on card (header) expands');

    const visibleAfterCardTap = await mobile.$eval('#rec2643778101', (el) =>
      el.classList.contains('banner-visible')
    );
    assert(visibleAfterCardTap, 'expanded banner stays visible');

    await clickEl(mobile, '.close-banner');
    await mobile.waitForFunction(() =>
      !document.getElementById('rec2643778101').classList.contains('banner-visible')
    );
    checks.push('mobile: X after expand closes banner');
    await mobile.close();

    const mobile2 = await browser.newPage();
    await mobile2.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await mobile2.goto(url, { waitUntil: 'networkidle0' });
    await waitBannerReady(mobile2);
    await showBanner(mobile2);
    await clickEl(mobile2, '.banner-image img');
    await mobile2.waitForFunction(() =>
      !document.getElementById('rec2643778101').classList.contains('banner-collapsed')
    );
    checks.push('mobile: tap on image expands');

    const navigated = await mobile2.evaluate(() => {
      const link = document.querySelector('.banner-button');
      let went = false;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        went = true;
      });
      link.click();
      return went;
    });
    assert(navigated, 'Подробнее click still fires');
    assert(
      await mobile2.$eval('#rec2643778101', (el) => el.classList.contains('banner-visible')),
      'Подробнее does not close the banner'
    );
    checks.push('mobile: Подробнее works after expand and does not close');
    await mobile2.close();

    const mobile3 = await browser.newPage();
    await mobile3.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await mobile3.goto(url, { waitUntil: 'networkidle0' });
    await waitBannerReady(mobile3);
    await showBanner(mobile3);
    await clickEl(mobile3, '.close-banner');
    await mobile3.waitForFunction(() =>
      !document.getElementById('rec2643778101').classList.contains('banner-collapsed')
    );
    assert(
      await mobile3.$eval('#rec2643778101', (el) => el.classList.contains('banner-visible')),
      'expand icon does not close while collapsed'
    );
    checks.push('mobile: tap on expand icon still expands');
    await mobile3.close();

    console.log('OK', checks.length, 'checks');
    checks.forEach((c) => console.log(' -', c));
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
