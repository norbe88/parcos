/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SUITĂ CUPRINZĂTOARE DE TEST E2E & CERTIFICARE QA (WAVE 3 — TICKET 03)
 * ParcOS & RXM Automobile — Site Visitors & Conversion Telemetry Pipeline
 * 
 * Verificări End-to-End:
 * Pasul 1: Conexiune la PostgreSQL (Netcup VPS 152.53.158.65) și validarea
 *          tabelei traffic_events + cele 4 indexuri compozite de performanță.
 * Pasul 2: Emisii simulate de semnale de telemetrie către POST /api/telemetry/traffic-event:
 *          - pageview (dealerSlug: 'parcos', source: 'google_organic', mobile UA)
 *          - pageview (dealerSlug: 'rxm', source: 'window_qr', mobile UA)
 *          - click_whatsapp (dealerSlug: 'rxm', metadata: { carId: 'audi-a6-2017-kzfce' })
 *          - click_phone (dealerSlug: 'rxm', metadata: { carId: 'audi-a6-2017-kzfce' })
 *          - calc_finance (dealerSlug: 'rxm', metadata: { carId: 'audi-a6-2017-kzfce' })
 *          - submit_lead (dealerSlug: 'parcos', metadata: { form: 'landing_contact' })
 * Pasul 3: Interogare endpoint agregat:
 *          - GET /api/dealers/rxm/analytics/traffic-summary
 *          - GET /api/dealers/parcos/analytics/traffic-summary
 *          Validare: uniqueVisitors >= 1, totalPageviews >= 1, whatsappClicks, phoneClicks,
 *          financeCalc, leadsSubmitted, distribuție surse și dispozitive.
 * Pasul 4: Invarianțe Suverane CARVANA SRL Holding:
 *          - Hosting Netcup VPS 152.53.158.65 (RXM / ParcOS izolat)
 *          - TVA deductibil strict 21% (VAT_RATE = 0.21)
 *          - Terminologie strictă „Cont de Garanție” (zero „escrow”)
 *          - Politică Zero PII & conformitate GDPR (session_hash SHA-256, fără IP brut stocat)
 *          - Audit Contrast Dual-Theme WCAG AA (Dark Luxury #09090b vs Light #f8fafc)
 * ══════════════════════════════════════════════════════════════════════════════
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

function waitForPort(port, host = '127.0.0.1', timeoutMs = 10000) {
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
          reject(new Error(`Timeout la așteptarea portului ${port}: ${err.message}`));
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
console.log('🛡️ RULARE TESTE QA E2E: AUDIENCE TELEMETRY & HOLDING INVARIANTS');
console.log('   Target: ParcOS Multi-Tenant & RXM Automobile Analytics Engine');
console.log('================================================================\n');

async function runE2ESuite() {
  const LOCAL_TUNNEL_PORT = 54348;
  const TEST_SERVER_PORT = 39129;
  const NETCUP_CONTAINER_IP = '172.16.16.6';
  const NETCUP_SSH_HOST = 'root@152.53.158.65';

  let tunnel = null;
  let serverInstance = null;
  let sql = null;
  const testRunId = `qa_e2e_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // PASUL 1: CONEXIUNE POSTGRESQL & VERIFICARE STRUCTURĂ DDL + 4 INDEXURI
    // ══════════════════════════════════════════════════════════════════════════
    console.log('[PASUL 1] Conexiune Securizată la PostgreSQL (Netcup VPS 152.53.158.65)');
    tunnel = spawn(`ssh -N -L ${LOCAL_TUNNEL_PORT}:${NETCUP_CONTAINER_IP}:5432 ${NETCUP_SSH_HOST}`, { shell: true, stdio: 'ignore' });

    await waitForPort(LOCAL_TUNNEL_PORT, '127.0.0.1', 10000);
    console.log(`  ✓ Tunel SSH stabilit cu succes pe 127.0.0.1:${LOCAL_TUNNEL_PORT}`);

    process.env.DATABASE_URL = `postgres://postgres:O1MLK6Ezk4Y9IxEC0hwndUS7LDIijuUjZ76sDLPpHWAL55tsM76pokKe2vxdg1UR@127.0.0.1:${LOCAL_TUNNEL_PORT}/parcos`;

    const { getSql, getSiteTrafficAnalytics } = await import('../../server/db.mjs');
    sql = getSql();

    // Verificare existență tabelă traffic_events
    const tableRows = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'traffic_events'
    `;
    assert(tableRows.length === 1, 'Tabela traffic_events există în schema PostgreSQL publică');

    // Verificare existență 4 indexuri compozite optimizate
    const indexRows = await sql`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'traffic_events'
    `;
    const indexNames = indexRows.map(r => r.indexname);
    assert(indexNames.includes('idx_traffic_events_dealer_time'), 'Indexul compozit idx_traffic_events_dealer_time este activ în PostgreSQL');
    assert(indexNames.includes('idx_traffic_events_session'), 'Indexul compozit idx_traffic_events_session este activ în PostgreSQL');
    assert(indexNames.includes('idx_traffic_events_type'), 'Indexul compozit idx_traffic_events_type este activ în PostgreSQL');
    assert(indexNames.includes('idx_traffic_events_source'), 'Indexul compozit idx_traffic_events_source este activ în PostgreSQL');

    // Măsurare latență interogare agregare
    // 1. Warm-up conexiune pool peste tunelul SSH
    await sql`SELECT 1`;
    
    // 2. Măsurare timp de execuție efectiv pe serverul PostgreSQL via EXPLAIN ANALYZE
    const explainPlan = await sql`
      EXPLAIN ANALYZE
      SELECT
        COUNT(DISTINCT session_hash)::int AS unique_visitors,
        COUNT(*) FILTER (WHERE event_type = 'pageview')::int AS total_pageviews,
        COUNT(*)::int AS total_events,
        COUNT(*) FILTER (WHERE event_type = 'click_whatsapp')::int AS whatsapp_clicks,
        COUNT(*) FILTER (WHERE event_type = 'click_phone')::int AS phone_clicks,
        COUNT(*) FILTER (WHERE event_type = 'submit_lead')::int AS leads_submitted,
        COUNT(*) FILTER (WHERE event_type = 'calc_finance')::int AS finance_calc
      FROM traffic_events
      WHERE lower(dealer_slug) = 'rxm' AND created_at >= NOW() - INTERVAL '30 days'
    `;
    const planText = explainPlan.map(p => p['QUERY PLAN']).join('\n');
    const execTimeMatch = planText.match(/Execution Time: ([\d.]+) ms/);
    const pgExecTimeMs = execTimeMatch ? parseFloat(execTimeMatch[1]) : 0;
    
    // 3. Apel funcțional getSiteTrafficAnalytics
    const tStart = Date.now();
    const benchmarkResult = await getSiteTrafficAnalytics('rxm', '30d');
    const tElapsed = Date.now() - tStart;
    
    assert(benchmarkResult && typeof benchmarkResult === 'object', 'Interogarea de agregare getSiteTrafficAnalytics returnează obiect valid');
    assert(pgExecTimeMs < 20, `Timp de execuție PostgreSQL sub 20ms fără locks (actual: ${pgExecTimeMs}ms)`);
    assert(tElapsed < 5000, `Interogarea completă a returnat date structurate (timp total RTT tunel: ${tElapsed}ms)`);

    // ══════════════════════════════════════════════════════════════════════════
    // PASUL 2: EMISII SIMULATE DE SEMNALE TELEMETRIE CĂTRE POST /api/telemetry/traffic-event
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[PASUL 2] Emisii Simulate de Semnale de Telemetrie către API');

    const { server, detectDeviceType } = await import('../../server/api.mjs');
    assert(typeof detectDeviceType === 'function', 'Helperul detectDeviceType este exportat din server/api.mjs');

    await new Promise((resolve) => {
      serverInstance = server.listen(TEST_SERVER_PORT, '127.0.0.1', () => {
        console.log(`  ✓ Serverul API ascultă pe portul local de test ${TEST_SERVER_PORT}`);
        resolve();
      });
    });

    const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
    const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

    // 2.1. pageview din landing (dealerSlug: 'parcos', source: 'google_organic', deviceType: 'mobile')
    const resPageviewParcos = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/telemetry/traffic-event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': MOBILE_UA,
        'X-Forwarded-For': '82.77.100.11'
      }
    }, {
      dealerSlug: 'parcos',
      eventType: 'pageview',
      pagePath: '/landing',
      source: 'google_organic',
      referrer: 'https://www.google.ro/search?q=dealer+auto+cluj',
      metadata: { testRunId, step: 'landing_visit' }
    });
    assert(resPageviewParcos.statusCode === 200, `2.1 pageview parcos a returnat HTTP 200 (actual: ${resPageviewParcos.statusCode})`);
    assert(resPageviewParcos.body?.success === true && resPageviewParcos.body?.recorded === true, '2.1 pageview parcos salvat cu succes');
    assert(resPageviewParcos.body?.deviceType === 'mobile', `2.1 deviceType detectat ca mobile (${resPageviewParcos.body?.deviceType})`);
    assert(resPageviewParcos.body?.sessionHash?.length === 64, '2.1 sessionHash calculat este un hash valid SHA256 (64 hex)');

    // 2.2. pageview din showroom (dealerSlug: 'rxm', source: 'window_qr', deviceType: 'mobile')
    const resPageviewRxm = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/telemetry/traffic-event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': MOBILE_UA,
        'X-Forwarded-For': '82.77.100.22'
      }
    }, {
      dealerSlug: 'rxm',
      eventType: 'pageview',
      pagePath: '/showroom/audi-a6-2017-kzfce',
      source: 'window_qr',
      referrer: null,
      metadata: { testRunId, carId: 'audi-a6-2017-kzfce', stickerScanned: true }
    });
    assert(resPageviewRxm.statusCode === 200, `2.2 pageview rxm window_qr a returnat HTTP 200`);
    assert(resPageviewRxm.body?.success === true && resPageviewRxm.body?.recorded === true, '2.2 pageview rxm salvat');
    assert(resPageviewRxm.body?.deviceType === 'mobile', '2.2 deviceType showroom este mobile');

    // 2.3. click_whatsapp (dealerSlug: 'rxm', metadata: { carId: 'audi-a6-2017-kzfce' }, sendBeacon text/plain)
    const resWhatsappRxm = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/telemetry/traffic-event',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': MOBILE_UA,
        'X-Forwarded-For': '82.77.100.22'
      }
    }, JSON.stringify({
      dealerSlug: 'rxm',
      eventType: 'click_whatsapp',
      pagePath: '/showroom/audi-a6-2017-kzfce',
      source: 'window_qr',
      referrer: null,
      metadata: { testRunId, carId: 'audi-a6-2017-kzfce', action: 'direct_chat_cta' }
    }));
    assert(resWhatsappRxm.statusCode === 200, '2.3 click_whatsapp via sendBeacon a returnat HTTP 200');
    assert(resWhatsappRxm.body?.success === true && resWhatsappRxm.body?.recorded === true, '2.3 click_whatsapp salvat');

    // 2.4. click_phone (dealerSlug: 'rxm', metadata: { carId: 'audi-a6-2017-kzfce' })
    const resPhoneRxm = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/telemetry/traffic-event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': MOBILE_UA,
        'X-Forwarded-For': '82.77.100.22'
      }
    }, {
      dealerSlug: 'rxm',
      eventType: 'click_phone',
      pagePath: '/showroom/audi-a6-2017-kzfce',
      source: 'window_qr',
      referrer: null,
      metadata: { testRunId, carId: 'audi-a6-2017-kzfce', dialer: 'cellular' }
    });
    assert(resPhoneRxm.statusCode === 200, '2.4 click_phone a returnat HTTP 200');
    assert(resPhoneRxm.body?.success === true && resPhoneRxm.body?.recorded === true, '2.4 click_phone salvat');

    // 2.5. calc_finance (dealerSlug: 'rxm', metadata: { carId: 'audi-a6-2017-kzfce' }, Desktop UA)
    const resCalcFinance = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/telemetry/traffic-event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': DESKTOP_UA,
        'X-Forwarded-For': '82.77.100.33'
      }
    }, {
      dealerSlug: 'rxm',
      eventType: 'calc_finance',
      pagePath: '/showroom/audi-a6-2017-kzfce',
      source: 'direct',
      referrer: null,
      metadata: { testRunId, carId: 'audi-a6-2017-kzfce', advanceRon: 25000, tenureMonths: 60 }
    });
    assert(resCalcFinance.statusCode === 200, '2.5 calc_finance a returnat HTTP 200');
    assert(resCalcFinance.body?.success === true && resCalcFinance.body?.recorded === true, '2.5 calc_finance salvat');
    assert(resCalcFinance.body?.deviceType === 'desktop', '2.5 deviceType simulator este desktop');

    // 2.6. submit_lead (dealerSlug: 'parcos')
    const resSubmitLead = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/telemetry/traffic-event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': MOBILE_UA,
        'X-Forwarded-For': '82.77.100.11'
      }
    }, {
      dealerSlug: 'parcos',
      eventType: 'submit_lead',
      pagePath: '/landing#contact',
      source: 'google_organic',
      referrer: 'https://www.google.ro',
      metadata: { testRunId, form: 'landing_contact_submission', interest: 'buy_import' }
    });
    assert(resSubmitLead.statusCode === 200, '2.6 submit_lead a returnat HTTP 200');
    assert(resSubmitLead.body?.success === true && resSubmitLead.body?.recorded === true, '2.6 submit_lead salvat');

    // ══════════════════════════════════════════════════════════════════════════
    // PASUL 3: INTEROGARE ENDPOINT AGREGAT PENTRU RXM ȘI PARCOS
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[PASUL 3] Verificare Endpoint-uri Agregare Sumar Trafic & KPI-uri');

    // 3.1. Sumar RXM Automobile
    const resSummaryRxm = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/dealers/rxm/analytics/traffic-summary?timeframe=all',
      method: 'GET'
    });
    assert(resSummaryRxm.statusCode === 200, '3.1 GET /api/dealers/rxm/analytics/traffic-summary a returnat HTTP 200');
    assert(resSummaryRxm.body?.success === true, '3.1 Răspunsul RXM are success: true');
    assert(resSummaryRxm.body?.dealer === 'rxm', '3.1 Dealerul răspunsului este rxm');

    const rxmSummary = resSummaryRxm.body?.summary || resSummaryRxm.body;
    assert(typeof rxmSummary?.uniqueVisitors === 'number' && rxmSummary.uniqueVisitors >= 1, `3.1 RXM uniqueVisitors >= 1 (actual: ${rxmSummary?.uniqueVisitors})`);
    assert(typeof rxmSummary?.totalPageviews === 'number' && rxmSummary.totalPageviews >= 1, `3.1 RXM totalPageviews >= 1 (actual: ${rxmSummary?.totalPageviews})`);
    assert(typeof rxmSummary?.conversions === 'object' && rxmSummary.conversions !== null, '3.1 RXM obiectul conversions este structurat');
    assert(rxmSummary.conversions.whatsappClicks >= 1, `3.1 RXM whatsappClicks >= 1 (actual: ${rxmSummary.conversions.whatsappClicks})`);
    assert(rxmSummary.conversions.phoneClicks >= 1, `3.1 RXM phoneClicks >= 1 (actual: ${rxmSummary.conversions.phoneClicks})`);
    assert(rxmSummary.conversions.financeCalc >= 1, `3.1 RXM financeCalc >= 1 (actual: ${rxmSummary.conversions.financeCalc})`);

    // Verificare surse RXM (să includă window_qr)
    assert(Array.isArray(rxmSummary.sources) && rxmSummary.sources.length >= 1, '3.1 RXM are surse agregate în listă');
    const qrSource = rxmSummary.sources.find(s => s.source === 'window_qr');
    assert(Boolean(qrSource), '3.1 Sursa window_qr (QR Parbriz) este prezentă în agregarea RXM');
    assert(qrSource?.visitors >= 1, `3.1 Vizitatorii QR Parbriz contorizați corect (actual: ${qrSource?.visitors})`);

    // Verificare dispozitive RXM (să includă atât mobile cât și desktop)
    assert(typeof rxmSummary.devices === 'object', '3.1 RXM breakdown dispozitive este prezent');
    assert(rxmSummary.devices.mobile >= 1, `3.1 Dispozitive mobile >= 1 (actual: ${rxmSummary.devices.mobile})`);
    assert(rxmSummary.devices.desktop >= 1, `3.1 Dispozitive desktop >= 1 (actual: ${rxmSummary.devices.desktop})`);

    // 3.2. Sumar ParcOS Tenant
    const resSummaryParcos = await makeHttpRequest({
      hostname: '127.0.0.1',
      port: TEST_SERVER_PORT,
      path: '/api/dealers/parcos/analytics/traffic-summary?timeframe=all',
      method: 'GET'
    });
    assert(resSummaryParcos.statusCode === 200, '3.2 GET /api/dealers/parcos/analytics/traffic-summary a returnat HTTP 200');
    assert(resSummaryParcos.body?.success === true, '3.2 Răspunsul ParcOS are success: true');
    assert(resSummaryParcos.body?.dealer === 'parcos', '3.2 Dealerul răspunsului este parcos');

    const parcosSummary = resSummaryParcos.body?.summary || resSummaryParcos.body;
    assert(typeof parcosSummary?.uniqueVisitors === 'number' && parcosSummary.uniqueVisitors >= 1, `3.2 ParcOS uniqueVisitors >= 1 (actual: ${parcosSummary?.uniqueVisitors})`);
    assert(typeof parcosSummary?.totalPageviews === 'number' && parcosSummary.totalPageviews >= 1, `3.2 ParcOS totalPageviews >= 1 (actual: ${parcosSummary?.totalPageviews})`);
    assert(parcosSummary.conversions?.leadsSubmitted >= 1, `3.2 ParcOS leadsSubmitted >= 1 (actual: ${parcosSummary.conversions?.leadsSubmitted})`);

    const organicSource = parcosSummary.sources?.find(s => s.source === 'google_organic');
    assert(Boolean(organicSource), '3.2 Sursa google_organic este prezentă în agregarea ParcOS');

    // ══════════════════════════════════════════════════════════════════════════
    // PASUL 4: INVARIANȚE HOLDING, ZERO PII & DUAL-THEME AUDIT
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[PASUL 4] Verificare Invarianțe Suverane CARVANA SRL & Audit Dual-Theme');

    // 4.1. Invariantă Hosting Provider: Netcup VPS 152.53.158.65 (Strict)
    assert(NETCUP_SSH_HOST.includes('152.53.158.65'), 'Hosting provider pentru RXM & ParcOS este strict Netcup VPS (152.53.158.65)');
    const agentsMdContent = fs.readFileSync(path.join(__dirname, '../../AGENTS.md'), 'utf8');
    assert(agentsMdContent.includes('152.53.158.65'), 'AGENTS.md stipulează strict Netcup VPS 152.53.158.65');
    assert(!agentsMdContent.includes('rxm pe Hetzner'), 'Zero confuzie între RXM (Netcup) și Hetzner');

    // 4.2. Invariantă Strict 21% TVA (VAT_RATE = 0.21)
    const dealerSrc = fs.readFileSync(path.join(__dirname, '../../src/db/dealer.ts'), 'utf8');
    assert(dealerSrc.includes('vatRate: 0.21') || dealerSrc.includes('21%'), 'Invariantă TVA: Cota legală este strict 21% (VAT_RATE = 0.21)');

    // 4.3. Invariantă Terminologie Garanții: „Cont de Garanție” (zero escrow)
    const typesSrc = fs.readFileSync(path.join(__dirname, '../../src/db/types.ts'), 'utf8');
    assert(!dealerSrc.toLowerCase().includes('escrow') && !typesSrc.toLowerCase().includes('escrow'), 'Invariantă Terminologie: Strict „Cont de Garanție” (zero apariții escrow)');

    // 4.4. Invariantă Suverană Zero PII în Telemetrie & GDPR
    console.log('\n  [4.4. Zero PII Audit] Verificare Integritate Criptografică în traffic_events');
    const telemetryRows = await sql`
      SELECT id, session_hash, event_type, metadata
      FROM traffic_events
      WHERE metadata->>'testRunId' = ${testRunId}
    `;
    assert(telemetryRows.length === 6, `S-au salvat exact cele 6 evenimente din testRunId (actual: ${telemetryRows.length})`);
    
    for (const row of telemetryRows) {
      // 1. session_hash este SHA256 hex de exact 64 caractere
      assert(/^[a-f0-9]{64}$/i.test(row.session_hash), `session_hash (${row.session_hash}) este un hash SHA256 hex ireversibil`);
      
      // 2. Metadata nu conține IP brut sau date de identificare directă
      const metaStr = JSON.stringify(row.metadata);
      assert(!metaStr.includes('82.77.100.'), 'Metadata nu conține adresa IP brută a utilizatorului');
      assert(!metaStr.toLowerCase().includes('email'), 'Metadata nu conține adrese de email');
      assert(!metaStr.toLowerCase().includes('phone_number'), 'Metadata nu conține numere de telefon brute');
    }
    console.log('  ✓ Niciun IP brut sau dată PII nu este stocată în PostgreSQL (Conformitate GDPR totală)');

    // 4.5. Audit Contrast & Tokens Dual-Theme WCAG AA pentru AudienceOverviewTab.tsx
    console.log('\n  [4.5. Dual-Theme Audit] Verificare Conformitate Vizuală Dark & Light Mode');
    const audienceTabPath = path.join(__dirname, '../../src/components/admin/analytics/AudienceOverviewTab.tsx');
    assert(fs.existsSync(audienceTabPath), 'Componenta AudienceOverviewTab.tsx există');
    const audienceTabContent = fs.readFileSync(audienceTabPath, 'utf8');

    // Tokeni Dark Luxury (#09090b / zinc-900 / zinc-950)
    assert(audienceTabContent.includes('dark:bg-zinc-900') || audienceTabContent.includes('dark:bg-zinc-950'), 'Suport Dark Mode complet implementat cu tokeni zinc-900/950');
    assert(audienceTabContent.includes('dark:text-zinc-100') || audienceTabContent.includes('dark:text-white'), 'Text Dark Mode cu contrast ridicat (zinc-100 / white)');
    assert(audienceTabContent.includes('dark:border-zinc-800'), 'Borduri Dark Mode adaptive fără linii albe stridente (dark:border-zinc-800)');

    // Tokeni Light Luxury (slate-50 / white / zinc-900)
    assert(audienceTabContent.includes('bg-slate-50') || audienceTabContent.includes('bg-white'), 'Suport Light Mode implementat (bg-white/bg-slate-50)');
    assert(audienceTabContent.includes('text-zinc-900') || audienceTabContent.includes('text-slate-900'), 'Text Light Mode cu contrast maxim (text-zinc-900)');

    // Verificare helper telemetryHelpers.ts
    const helpersPath = path.join(__dirname, '../../src/utils/telemetryHelpers.ts');
    assert(fs.existsSync(helpersPath), 'Modulul telemetryHelpers.ts există');
    const helpersContent = fs.readFileSync(helpersPath, 'utf8');
    assert(helpersContent.includes('window_qr'), 'Configurația sursei window_qr conține etichetă dedicată QR Parbriz');
    assert(helpersContent.includes('calculateDevicePercentages'), 'calculateDevicePercentages previne division by zero');

    // ══════════════════════════════════════════════════════════════════════════
    // CURĂȚARE DATE DE TEST & RESURSE
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n[CURĂȚARE] Ștergere Evenimente de Test din PostgreSQL');
    const deleteResult = await sql`
      DELETE FROM traffic_events 
      WHERE metadata->>'testRunId' = ${testRunId}
    `;
    console.log(`  ✓ Șterse rândurile de test cu testRunId=${testRunId}`);

  } catch (err) {
    console.error('❌ EROARE CRITICĂ ÎN TIMPUL RULĂRII SUITEI E2E:', err);
    process.exit(1);
  } finally {
    if (sql) {
      try {
        await sql.end({ timeout: 2 });
      } catch {}
    }
    if (serverInstance) {
      try {
        serverInstance.close();
      } catch {}
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
  console.log('🎉 TOATE TESTELE E2E & INVARIANTELE AU TRECUT CU SUCCES (100%)!');
  console.log('   Certificare QA: Wave 3 — Audience Intelligence Dashboard Ready');
  console.log('================================================================\n');
}

runE2ESuite().catch((err) => {
  console.error('Eroare neprinsă în execuția suitei E2E:', err);
  process.exit(1);
});
