/**
 * QA & Invariant Verification Suite for Ticket 02 & Ticket 03
 * Ingestion API Endpoint & Analytics Aggregation Queries
 * 
 * Verifică:
 * 1. POST /api/telemetry/traffic-event cu pageview (JSON)
 * 2. POST /api/telemetry/traffic-event cu click_whatsapp (navigator.sendBeacon text/plain + mobile UA)
 * 3. GET /api/dealers/parcos/analytics/traffic-summary?timeframe=all
 *    Verifică: uniqueVisitors, totalPageviews, conversions, sources, devices
 * 4. GET /api/analytics/traffic-summary alias cu query param ?dealer=parcos
 * 5. Curățare evenimente de test și eliberare resurse
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

function waitForPort(port, host = '127.0.0.1', timeoutMs = 8000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    function tryConnect() {
      const socket = net.createConnection({ port, host });
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', (err) => {
        socket.destroy();
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Timeout waiting for port ${port}: ${err.message}`));
        } else {
          setTimeout(tryConnect, 200);
        }
      });
    }
    tryConnect();
  });
}

function makeHttpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

console.log('================================================================');
console.log('🛡️ RULARE TESTE QA: TICKET 02 & 03 — TELEMETRY INGESTION & AGGREGATION');
console.log('================================================================\n');

async function runTests() {
  const LOCAL_TUNNEL_PORT = 54339;
  const TEST_SERVER_PORT = 39123;
  const NETCUP_CONTAINER_IP = '172.16.16.6';
  const NETCUP_SSH_HOST = 'root@152.53.158.65';

  let tunnel = null;
  let serverInstance = null;
  const testRunId = `qa_run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    // 1. Stabilire tunel SSH către Netcup VPS PostgreSQL
    console.log('[Faza 1] Conectare Securizată către Netcup VPS (152.53.158.65)');
    tunnel = spawn(`ssh -N -L ${LOCAL_TUNNEL_PORT}:${NETCUP_CONTAINER_IP}:5432 ${NETCUP_SSH_HOST}`, { shell: true, stdio: 'ignore' });

    await waitForPort(LOCAL_TUNNEL_PORT, '127.0.0.1', 8000);
    console.log(`  ✓ Tunel SSH deschis pe 127.0.0.1:${LOCAL_TUNNEL_PORT}`);

    process.env.DATABASE_URL = `postgres://postgres:O1MLK6Ezk4Y9IxEC0hwndUS7LDIijuUjZ76sDLPpHWAL55tsM76pokKe2vxdg1UR@127.0.0.1:${LOCAL_TUNNEL_PORT}/parcos`;

    // 2. Inițializare server HTTP din server/api.mjs
    console.log('\n[Faza 2] Pornire Server HTTP pe Portul de Test ' + TEST_SERVER_PORT);
    const { server, detectDeviceType } = await import('../../server/api.mjs');
    const { getSql, getSiteTrafficAnalytics } = await import('../../server/db.mjs');

    assert(typeof detectDeviceType === 'function', 'Helperul detectDeviceType este funcție exportată');
    assert(typeof getSiteTrafficAnalytics === 'function', 'Funcția getSiteTrafficAnalytics este exportată din server/db.mjs');

    await new Promise((resolve) => {
      serverInstance = server.listen(TEST_SERVER_PORT, '127.0.0.1', () => {
        console.log(`  ✓ Serverul de test ascultă pe 127.0.0.1:${TEST_SERVER_PORT}`);
        resolve();
      });
    });

    // 3. Test Ingestie POST /api/telemetry/traffic-event cu pageview (Desktop, JSON)
    console.log('\n[Test 1] POST /api/telemetry/traffic-event — Ingestie Pageview (Desktop, JSON)');
    const pageviewPayload = {
      dealerSlug: 'parcos',
      eventType: 'pageview',
      pagePath: '/showroom/qa-test-audi',
      source: 'google_organic',
      referrer: 'https://google.ro',
      metadata: { testRunId, action: 'pageview_test' }
    };

    const resPageview = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/telemetry/traffic-event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, pageviewPayload);

    assert(resPageview.statusCode === 200, `POST /api/telemetry/traffic-event a returnat HTTP 200 (actual: ${resPageview.statusCode})`);
    assert(resPageview.body?.success === true, 'Răspunsul are success: true');
    assert(resPageview.body?.recorded === true, 'Răspunsul are recorded: true');
    assert(resPageview.body?.deviceType === 'desktop', `deviceType a fost detectat ca desktop (actual: ${resPageview.body?.deviceType})`);
    assert(typeof resPageview.body?.sessionHash === 'string' && resPageview.body.sessionHash.length === 64, 'sessionHash calculat este un SHA256 valid (64 caractere)');
    assert(resPageview.body?.eventId !== undefined && resPageview.body?.eventId !== null, `S-a generat eventId: ${resPageview.body?.eventId}`);

    // 4. Test Ingestie POST /api/telemetry/traffic-event cu click_whatsapp (Mobile, sendBeacon text/plain)
    console.log('\n[Test 2] POST /api/telemetry/traffic-event — Ingestie click_whatsapp (Mobile UA, sendBeacon text/plain)');
    const whatsappPayload = JSON.stringify({
      dealerSlug: 'parcos',
      eventType: 'click_whatsapp',
      pagePath: '/showroom/qa-test-audi',
      source: 'window_qr',
      referrer: null,
      metadata: { testRunId, action: 'whatsapp_click_test' }
    });

    const resWhatsapp = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/telemetry/traffic-event',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
      }
    }, whatsappPayload);

    assert(resWhatsapp.statusCode === 200, `POST cu text/plain (sendBeacon) a returnat HTTP 200 (actual: ${resWhatsapp.statusCode})`);
    assert(resWhatsapp.body?.success === true, 'Răspunsul are success: true');
    assert(resWhatsapp.body?.recorded === true, 'Răspunsul are recorded: true');
    assert(resWhatsapp.body?.deviceType === 'mobile', `deviceType a fost detectat ca mobile (actual: ${resWhatsapp.body?.deviceType})`);
    assert(typeof resWhatsapp.body?.sessionHash === 'string' && resWhatsapp.body.sessionHash.length === 64, 'sessionHash mobil este un SHA256 valid');

    // 5. Test Agregare GET /api/dealers/parcos/analytics/traffic-summary?timeframe=all
    console.log('\n[Test 3] GET /api/dealers/parcos/analytics/traffic-summary?timeframe=all — Verificare Metrici Agregate');
    const resSummary = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/dealers/parcos/analytics/traffic-summary?timeframe=all',
      method: 'GET'
    });

    assert(resSummary.statusCode === 200, `GET traffic-summary a returnat HTTP 200 (actual: ${resSummary.statusCode})`);
    assert(resSummary.body?.success === true, 'Răspunsul are success: true');
    assert(resSummary.body?.dealer === 'parcos', 'Dealerul este parcos');

    const summary = resSummary.body?.summary || resSummary.body;
    assert(typeof summary?.uniqueVisitors === 'number', `uniqueVisitors este număr (actual: ${summary?.uniqueVisitors})`);
    assert(summary?.uniqueVisitors >= 1, `uniqueVisitors reflectă vizitatorii unici (>= 1, actual: ${summary?.uniqueVisitors})`);
    assert(typeof summary?.totalPageviews === 'number', `totalPageviews este număr (actual: ${summary?.totalPageviews})`);
    assert(summary?.totalPageviews >= 1, `totalPageviews este cel puțin 1 (actual: ${summary?.totalPageviews})`);

    // Verificare structură conversions
    assert(typeof summary?.conversions === 'object' && summary?.conversions !== null, 'Câmpul conversions este prezent ca obiect');
    assert(typeof summary.conversions.whatsappClicks === 'number', `conversions.whatsappClicks este număr (${summary.conversions.whatsappClicks})`);
    assert(typeof summary.conversions.phoneClicks === 'number', `conversions.phoneClicks este număr (${summary.conversions.phoneClicks})`);
    assert(typeof summary.conversions.leadsSubmitted === 'number', `conversions.leadsSubmitted este număr (${summary.conversions.leadsSubmitted})`);
    assert(typeof summary.conversions.financeCalc === 'number', `conversions.financeCalc este număr (${summary.conversions.financeCalc})`);
    assert(summary.conversions.whatsappClicks >= 1, 'conversions.whatsappClicks conține evenimentul înregistrat');

    // Verificare structură sources
    assert(Array.isArray(summary?.sources), 'Câmpul sources este un array');
    assert(summary.sources.length >= 1, 'sources conține cel puțin o sursă');
    const firstSource = summary.sources[0];
    assert(typeof firstSource.source === 'string', `sources[0].source este string (${firstSource.source})`);
    assert(typeof firstSource.visitors === 'number', `sources[0].visitors este număr (${firstSource.visitors})`);
    assert(typeof firstSource.pageviews === 'number', `sources[0].pageviews este număr (${firstSource.pageviews})`);
    assert(typeof firstSource.percentage === 'number', `sources[0].percentage este număr (${firstSource.percentage}%)`);

    // Verificare structură devices
    assert(typeof summary?.devices === 'object' && summary?.devices !== null, 'Câmpul devices este prezent ca obiect');
    assert(typeof summary.devices.mobile === 'number', `devices.mobile este număr (${summary.devices.mobile})`);
    assert(typeof summary.devices.desktop === 'number', `devices.desktop este număr (${summary.devices.desktop})`);
    assert(typeof summary.devices.tablet === 'number', `devices.tablet este număr (${summary.devices.tablet})`);
    assert(summary.devices.mobile >= 1, 'devices.mobile numără vizitatorul de pe iPhone');
    assert(summary.devices.desktop >= 1, 'devices.desktop numără vizitatorul de pe Desktop');

    // Verificare conversionRate și topSource
    assert(typeof summary?.conversionRate === 'number', `conversionRate este număr (${summary?.conversionRate}%)`);
    assert(typeof summary?.topSource === 'string', `topSource este string (${summary?.topSource})`);

    // 6. Test Endpoint Alias GET /api/analytics/traffic-summary?dealer=parcos&timeframe=30d
    console.log('\n[Test 4] GET /api/analytics/traffic-summary?dealer=parcos&timeframe=30d — Alias Endpoint');
    const resAlias = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/analytics/traffic-summary?dealer=parcos&timeframe=30d',
      method: 'GET'
    });
    assert(resAlias.statusCode === 200, `GET alias endpoint a returnat HTTP 200 (actual: ${resAlias.statusCode})`);
    assert(resAlias.body?.dealer === 'parcos', 'Dealerul este rezolvat corect ca parcos');
    assert(resAlias.body?.timeframe === '30d', 'timeframe este 30d');

    // 7. Curățare date de test din PostgreSQL
    console.log('\n[Faza 3] Curățare Evenimente de Test din PostgreSQL');
    const sql = getSql();
    await sql`
      DELETE FROM traffic_events 
      WHERE metadata->>'testRunId' = ${testRunId}
    `;
    console.log(`  ✓ Curățate înregistrările de test cu testRunId=${testRunId}`);
    await sql.end();

  } catch (err) {
    console.error('❌ EROARE ÎN TIMPUL RULĂRII TESTELOR QA:', err);
    process.exit(1);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    if (tunnel) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(tunnel.pid), '/f', '/t']);
        } else {
          tunnel.kill('SIGTERM');
        }
      } catch {}
    }
  }

  console.log('\n================================================================');
  console.log('🎉 TOATE TESTELE QA PENTRU TICKET 02 & 03 AU TRECUT CU SUCCES (100%)!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Eroare neașteptată în test suite:', err);
  process.exit(1);
});
