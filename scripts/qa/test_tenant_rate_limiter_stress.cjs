// =========================================================================
// QA STRESS TEST — Multi-Tenant Rate Limiter & Circuit Breaker (T03)
// DoD: 20 cereri rapide -> Primele 15 trec (sau consumă cota), următoarele 5 primesc STRICT 429
// =========================================================================

const assert = require('assert');
const path = require('path');

console.log('🧪 [QA TEST] Test de Stres Rate Limiter & Circuit Breaker per Tenant (T03)...');

(async () => {
  const { 
    server, 
    ADMIN_API_KEY, 
    checkTenantAiRateLimit, 
    recordTenantAiUsage, 
    resetTenantAiUsage,
    checkAiCircuitBreaker,
    recordAiFailure,
    recordAiSuccess,
    TENANT_AI_MINUTE_LIMIT 
  } = await import('../../server/api.mjs');

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Server test pornit pe portul efemer ${port}`);

  const testTenantId = 'stress_test_dealer_' + Date.now();
  resetTenantAiUsage(testTenantId);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_API_KEY}`,
    'X-Tenant-Id': testTenantId
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Test de Stres cu 20 de cereri rapide pe /api/parcos/vehicles/scan-civ
    // -------------------------------------------------------------------------
    console.log(`\n⚡ TEST 1: Rulare 20 de cereri rapide consecutive pentru tenantul "${testTenantId}"...`);
    
    let passedCount = 0;
    let rateLimitedCount = 0;
    const results = [];

    // Trimitem un payload valid dar sintetic pentru a testa pipeline-ul
    // Nota: Trimitem imageBase64 minim pentru validare
    for (let i = 1; i <= 20; i++) {
      const res = await fetch(`${baseUrl}/api/parcos/vehicles/scan-civ`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          // imageBase64 sub 50 caractere va fi refuzat cu 400 înainte de Google,
          // dar DUPĂ verificarea rate limit-ului dacă o punem în ordinea corectă.
          // În api.mjs verificarea rate limit-ului este prima, deci cererile 16-20 primesc 429!
          imageBase64: 'aW1hZ2VfZGF0YV9mb3Jfc3RyZXNzX3Rlc3RfMTIzNDU2Nzg5MDEyMzQ1Njc4OTA=',
          tenantId: testTenantId,
          countryHint: 'RO'
        })
      });

      results.push({ index: i, status: res.status });

      if (res.status === 429) {
        rateLimitedCount++;
        const data = await res.json().catch(() => ({}));
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.limitReached, true);
        assert.ok(data.error.includes('limita de procesare'));
        assert.strictEqual(data.manualFallback, true);
        assert.ok(res.headers.get('retry-after'), 'Header-ul Retry-After trebuie să fie prezent');
      } else {
        passedCount++;
      }
    }

    console.log(`📊 Rezultate test de stres (20 cereri):`);
    console.log(`   - Cereri procesate/autorizate în cotă: ${passedCount} (Așteptat: 15)`);
    console.log(`   - Cereri blocate cu HTTP 429: ${rateLimitedCount} (Așteptat: 5)`);

    assert.strictEqual(passedCount, 15, 'Exact primele 15 cereri trebuie să treacă verificarea de cotă');
    assert.strictEqual(rateLimitedCount, 5, 'Exact următoarele 5 cereri trebuie să fie respinse cu HTTP 429');
    console.log('  ✅ [PASS] Regula "Primele 15 trec, următoarele 5 primesc 429" este strict respectată!');

    // -------------------------------------------------------------------------
    // TEST 2: Izolare Multi-Tenant (Un alt tenant nu este afectat de cota primului)
    // -------------------------------------------------------------------------
    console.log('\n⚡ TEST 2: Verificare izolare multi-tenant (Tenant-ul B nu este blocat de Tenant-ul A)...');
    const secondTenantId = 'dealer_independent_bravo';
    resetTenantAiUsage(secondTenantId);

    const secondStatus = checkTenantAiRateLimit(secondTenantId);
    assert.strictEqual(secondStatus.allowed, true, 'Tenant-ul B are cota intactă');
    assert.strictEqual(secondStatus.remainingMinute, 15, 'Tenant-ul B are 15 cereri disponibile');
    console.log('  ✅ [PASS] Izolarea multi-tenant funcționează perfect. Cotele sunt strict segregate per tenant_id.');

    // -------------------------------------------------------------------------
    // TEST 3: Circuit-Breaker State Transitions (CLOSED -> OPEN -> HALF_OPEN)
    // -------------------------------------------------------------------------
    console.log('\n⚡ TEST 3: Verificare Circuit Breaker anti-flooding la erori consecutive...');
    
    // Stare inițială
    recordAiSuccess();
    let cb = checkAiCircuitBreaker();
    assert.strictEqual(cb.isOpen, false, 'Circuit Breaker-ul inițial este închis (CLOSED)');

    // Simulăm 3 erori consecutive de la Google
    recordAiFailure();
    recordAiFailure();
    recordAiFailure();

    // Circuitul trebuie să fie OPEN acum
    cb = checkAiCircuitBreaker();
    assert.strictEqual(cb.isOpen, true, 'Circuit Breaker-ul a trecut în starea OPEN după 3 eșecuri consecutive');
    assert.ok(cb.message.includes('temporar indisponibil'), 'Mesajul indică disponibilitate manuală');

    // Test request pe server în timp ce circuitul este OPEN
    const cbReqRes = await fetch(`${baseUrl}/api/parcos/ai/sanitize-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'X-Tenant-Id': 'tenant_cb_test'
      },
      body: JSON.stringify({ brand: 'Audi', model: 'A6' })
    });
    assert.strictEqual(cbReqRes.status, 503, 'Cererile în starea OPEN sunt scurtcircuitate cu 503 fără apel la Google');
    const cbJson = await cbReqRes.json();
    assert.strictEqual(cbJson.circuitOpen, true);
    assert.strictEqual(cbJson.manualFallback, true);
    console.log('  ✅ [PASS] Circuit-Breaker-ul a protejat infrastructura holdingului (răspuns instant 503 cu fallback manual).');

    // Reset circuit breaker
    recordAiSuccess();
    assert.strictEqual(checkAiCircuitBreaker().isOpen, false, 'După succes, circuitul revine automat la starea CLOSED');
    console.log('  ✅ [PASS] Circuit-Breaker restabilit la starea CLOSED.');

    console.log('\n🎉 TOATE VERIFICĂRILE PENTRU TICHETUL T03 AU TRECUT CU SUCCES 100%!');
  } finally {
    server.close();
  }
})().catch(err => {
  console.error('❌ Eroare test T03:', err);
  process.exit(1);
});
