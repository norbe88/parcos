// =========================================================================
// QA SUITE — Ping Test Google Gemini API (Silent Holding Account)
// =========================================================================

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/^GEMINI_API_KEY=(.+)$/m);

if (!keyMatch || !keyMatch[1]) {
  console.error('❌ Lipsă GEMINI_API_KEY în .env');
  process.exit(1);
}

const rawVal = keyMatch[1].trim().replace(/^["']|["']$/g, '');
const keys = rawVal.split(',').map(k => k.trim()).filter(Boolean);
console.log('🔑 Chei identificate:', keys.length);

async function testSingleKey(key, idx) {
  console.log(`\n--- Test Cheie #${idx + 1} (${key.slice(0, 15)}...${key.slice(-6)}) ---`);
  const model = 'gemini-3.8-flash';
  
  // 1. Via x-goog-api-key header
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Ping test. Răspunde strict cu: PONG_200_OK' }] }]
      })
    });
    console.log(`📡 [Header x-goog-api-key] Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    if (res.ok) {
      console.log('✅ Răspuns:', text.slice(0, 200));
    } else {
      console.log('❌ Eroare:', text.slice(0, 300));
    }
  } catch (e) {
    console.error('Eroare fetch:', e.message);
  }

  // 2. Via query param ?key=
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Ping test. Răspunde strict cu: PONG_200_OK' }] }]
      })
    });
    console.log(`📡 [Query Param ?key=] Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    if (res.ok) {
      console.log('✅ Răspuns:', text.slice(0, 200));
    } else {
      console.log('❌ Eroare:', text.slice(0, 300));
    }
  } catch (e) {
    console.error('Eroare fetch:', e.message);
  }
}

async function runPing() {
  for (let i = 0; i < keys.length; i++) {
    await testSingleKey(keys[i], i);
  }
}

runPing().catch(err => {
  console.error('❌ Eroare rețea/execuție:', err.message);
  process.exit(1);
});
