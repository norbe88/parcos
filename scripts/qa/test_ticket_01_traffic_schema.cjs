/**
 * QA & Invariant Verification Suite for Ticket 01: traffic_events Database Schema & Ingestion
 * 
 * Verifică:
 * 1. Exportul funcției recordTrafficEvent din server/db.mjs
 * 2. Prezența DDL-ului și a celor 4 indexuri compozite în initDatabase()
 * 3. Validarea parametrilor obligatorii (sessionHash) și fallback-ul de eroare
 * 4. Inserarea efectivă și verificarea schemei pe Netcup VPS PostgreSQL (parcos)
 * 5. Verificarea integrității indexurilor compozite pe PostgreSQL
 */

const fs = require('fs');
const path = require('path');
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

console.log('================================================================');
console.log('🛡️ RULARE TESTE QA: TICKET 01 — TRAFFIC_EVENTS SCHEMA & INGESTION');
console.log('================================================================\n');

async function runTests() {
  // 1. Verificare conținut sursă server/db.mjs
  console.log('[Test 1] Verificare Structură DDL și Indexuri în server/db.mjs');
  const dbMjsPath = path.join(__dirname, '../../server/db.mjs');
  const dbContent = fs.readFileSync(dbMjsPath, 'utf8');

  assert(dbContent.includes('CREATE TABLE IF NOT EXISTS traffic_events'), 'DDL CREATE TABLE IF NOT EXISTS traffic_events este prezent în server/db.mjs');
  assert(dbContent.includes('idx_traffic_events_dealer_time'), 'Indexul idx_traffic_events_dealer_time este prezent');
  assert(dbContent.includes('idx_traffic_events_session'), 'Indexul idx_traffic_events_session este prezent');
  assert(dbContent.includes('idx_traffic_events_type'), 'Indexul idx_traffic_events_type este prezent');
  assert(dbContent.includes('idx_traffic_events_source'), 'Indexul idx_traffic_events_source este prezent');
  assert(dbContent.includes('export async function recordTrafficEvent'), 'Funcția recordTrafficEvent este exportată');

  // 2. Conectare și stabilire tunel SSH către PostgreSQL Netcup VPS
  console.log('\n[Test 2] Stabilire Conexiune Securizată către Netcup VPS (152.53.158.65)');
  
  const LOCAL_TUNNEL_PORT = 54338;
  const NETCUP_CONTAINER_IP = '172.16.16.6';
  const NETCUP_SSH_HOST = 'root@152.53.158.65';

  let tunnel = spawn(`ssh -N -L ${LOCAL_TUNNEL_PORT}:${NETCUP_CONTAINER_IP}:5432 ${NETCUP_SSH_HOST}`, { shell: true, stdio: 'ignore' });

  await waitForPort(LOCAL_TUNNEL_PORT, '127.0.0.1', 8000);
  console.log(`  ✓ Tunel SSH stabilit pe 127.0.0.1:${LOCAL_TUNNEL_PORT}`);

  process.env.DATABASE_URL = `postgres://postgres:O1MLK6Ezk4Y9IxEC0hwndUS7LDIijuUjZ76sDLPpHWAL55tsM76pokKe2vxdg1UR@127.0.0.1:${LOCAL_TUNNEL_PORT}/parcos`;

  // 3. Import dinamic modul server/db.mjs
  console.log('\n[Test 3] Verificare Export Funcțional recordTrafficEvent');
  const db = await import('../../server/db.mjs');
  assert(typeof db.recordTrafficEvent === 'function', 'recordTrafficEvent este funcție apelabilă');

  // 4. Validare eroare când lipsește sessionHash
  console.log('\n[Test 4] Verificare Validare Parametri Obligatorii');
  const missingHashResult = await db.recordTrafficEvent({ eventType: 'pageview' });
  assert(missingHashResult.success === false, 'recordTrafficEvent fără sessionHash returnează success: false');
  assert(typeof missingHashResult.error === 'string', 'recordTrafficEvent returnează mesaj de eroare explicativ');

  // 5. Testare efectivă inserare pe baza Netcup VPS
  console.log('\n[Test 5] Verificare Inserare Reală și Indexuri pe Netcup VPS PostgreSQL (parcos)');
  
  try {
    const sql = db.getSql();

    // Verificăm existența tabelei și a indexurilor în PostgreSQL
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'traffic_events'
    `;
    assert(tableCheck.length === 1, 'Tabela traffic_events există în PostgreSQL');

    const indexCheck = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'traffic_events'
    `;
    const indexNames = indexCheck.map(r => r.indexname);
    assert(indexNames.includes('idx_traffic_events_dealer_time'), 'Indexul idx_traffic_events_dealer_time este activ în PG');
    assert(indexNames.includes('idx_traffic_events_session'), 'Indexul idx_traffic_events_session este activ în PG');
    assert(indexNames.includes('idx_traffic_events_type'), 'Indexul idx_traffic_events_type este activ în PG');
    assert(indexNames.includes('idx_traffic_events_source'), 'Indexul idx_traffic_events_source este activ în PG');

    // Executăm recordTrafficEvent cu un payload complet
    const testSessionHash = `qa_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const insertResult = await db.recordTrafficEvent({
      dealerSlug: 'parcos',
      sessionHash: testSessionHash,
      eventType: 'pageview',
      pagePath: '/showroom/test-car-qa',
      source: 'direct',
      deviceType: 'desktop',
      referrer: 'https://google.ro',
      metadata: { testRunner: 'test_ticket_01_traffic_schema.cjs', verified: true }
    });

    assert(insertResult.success === true, 'recordTrafficEvent a returnat success: true');
    assert(insertResult.eventId !== undefined && insertResult.eventId !== null, `recordTrafficEvent a returnat un eventId valid (${insertResult.eventId})`);

    // Verificăm că rândul se poate citi cu valorile corecte
    const rows = await sql`
      SELECT id, dealer_slug, session_hash, event_type, page_path, source, device_type, referrer, metadata, created_at
      FROM traffic_events 
      WHERE session_hash = ${testSessionHash}
    `;

    assert(rows.length === 1, 'Rândul inserat a fost citit cu succes din PostgreSQL');
    assert(rows[0].dealer_slug === 'parcos', 'dealer_slug este parcos');
    assert(rows[0].event_type === 'pageview', 'event_type este pageview');
    assert(rows[0].page_path === '/showroom/test-car-qa', 'page_path este /showroom/test-car-qa');
    assert(rows[0].device_type === 'desktop', 'device_type este desktop');
    assert(rows[0].source === 'direct', 'source este direct');
    assert(rows[0].referrer === 'https://google.ro', 'referrer este https://google.ro');
    assert(rows[0].metadata?.verified === true, 'metadata conține verified: true');

    // Curățare rând de test
    await sql`DELETE FROM traffic_events WHERE session_hash = ${testSessionHash}`;
    console.log('  ✓ Curățare rând de test efectuată.');

    await sql.end();
  } catch (err) {
    console.error('❌ Eroare la testarea conexiunii DB:', err);
    process.exit(1);
  } finally {
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
  console.log('🎉 TOATE TESTELE QA PENTRU TICKET 01 AU TRECUT CU SUCCES!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Eroare neașteptată în test suite:', err);
  process.exit(1);
});
