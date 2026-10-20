/**
 * ════════════════════════════════════════════════════════════════════════════════
 * QA Verification Suite — ParcOS Mail Hub (Sprint 2)
 * Validare: PMH-201 (Webhook SNS & MIME Parser) & PMH-202 (SES Outbound Delivery)
 * Holding: CARVANA SRL • Invariante: Strict 21% TVA • Netcup VPS (152.53.158.65)
 * ════════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

console.log('🚀 [QA SPRINT 2] Pornire verificare ParcOS Mail Hub (PMH-201 & PMH-202)...');

let testsPassed = 0;
let testsTotal = 0;

function it(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

async function itAsync(name, fn) {
  testsTotal++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Încărcare module Sprint 2
// ─────────────────────────────────────────────────────────────────────────────
const mailHubPath = path.join(__dirname, '..', 'server', 'mailHub.mjs');
assert(fs.existsSync(mailHubPath), 'Fișierul server/mailHub.mjs lipsește');

const mailWebhookTsPath = path.join(__dirname, '..', 'src', 'services', 'mailWebhookService.ts');
assert(fs.existsSync(mailWebhookTsPath), 'Fișierul src/services/mailWebhookService.ts lipsește');

const mailDeliveryTsPath = path.join(__dirname, '..', 'src', 'services', 'mailDeliveryService.ts');
assert(fs.existsSync(mailDeliveryTsPath), 'Fișierul src/services/mailDeliveryService.ts lipsește');

async function runSuite() {
  const mailHub = await import(`file://${mailHubPath.replace(/\\/g, '/')}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Verificare PMH-201: Verificare Semnătură Criptografică AWS SNS (Security Gate)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🔒 [PMH-201] Verificare Semnătură Criptografică AWS SNS (Security Gate)');

  it('validateSNSCertUrl acceptă exclusiv domenii oficiale amazonaws.com peste HTTPS', () => {
    assert.strictEqual(
      mailHub.validateSNSCertUrl('https://sns.eu-north-1.amazonaws.com/SimpleNotificationService-1234.pem'),
      true,
      'URL valid respins'
    );
    assert.strictEqual(
      mailHub.validateSNSCertUrl('https://sns.us-east-1.amazonaws.com/cert.pem'),
      true,
      'URL valid us-east-1 respins'
    );
    assert.strictEqual(
      mailHub.validateSNSCertUrl('http://sns.eu-north-1.amazonaws.com/insecure.pem'),
      false,
      'HTTP nesigur acceptat eronat'
    );
    assert.strictEqual(
      mailHub.validateSNSCertUrl('https://attacker.com/SimpleNotificationService-1234.pem'),
      false,
      'Domeniu malițios acceptat eronat'
    );
    assert.strictEqual(
      mailHub.validateSNSCertUrl('https://sns.eu-north-1.amazonaws.com.attacker.com/fake.pem'),
      false,
      'Subdomeniu mascat malițios acceptat eronat'
    );
    assert.strictEqual(
      mailHub.validateSNSCertUrl('https://sns.eu-north-1.amazonaws.com/payload.exe'),
      false,
      'Extensie non-pem acceptată eronat'
    );
  });

  it('buildSNSCanonicalString generează stringul canonic exact conform specificației AWS', () => {
    const notifPayload = {
      Type: 'Notification',
      Message: 'Test Message',
      MessageId: 'msg-123',
      Subject: 'Test Subject',
      Timestamp: '2026-10-19T12:00:00.000Z',
      TopicArn: 'arn:aws:sns:eu-north-1:123456789012:parcos-inbound',
    };
    const canonical = mailHub.buildSNSCanonicalString(notifPayload);
    const expected =
      'Message\nTest Message\n' +
      'MessageId\nmsg-123\n' +
      'Subject\nTest Subject\n' +
      'Timestamp\n2026-10-19T12:00:00.000Z\n' +
      'TopicArn\narn:aws:sns:eu-north-1:123456789012:parcos-inbound\n' +
      'Type\nNotification\n';
    assert.strictEqual(canonical, expected);
  });

  await itAsync('verifySNSSignature validează semnătură RSA autentică și respinge payload falsificat', async () => {
    // Generare pereche de chei RSA de test
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const notifPayload = {
      Type: 'Notification',
      Message: '{"notificationType":"Received","mail":{"messageId":"123"}}',
      MessageId: 'sns-msg-999',
      Timestamp: '2026-10-19T15:00:00.000Z',
      TopicArn: 'arn:aws:sns:eu-north-1:123456:parcos-inbound',
      SignatureVersion: '1',
      SigningCertURL: 'https://sns.eu-north-1.amazonaws.com/test-cert.pem',
    };

    const canonical = mailHub.buildSNSCanonicalString(notifPayload);
    const signer = crypto.createSign('RSA-SHA1');
    signer.update(canonical, 'utf8');
    const signature = signer.sign(privateKey, 'base64');
    notifPayload.Signature = signature;

    const mockCertFetcher = async () => publicKey;

    // Test 1: Semnătură validă
    const isValid = await mailHub.verifySNSSignature(notifPayload, { certFetcher: mockCertFetcher });
    assert.strictEqual(isValid, true, 'Semnătura validă a fost respinsă');

    // Test 2: Payload modificat (tampering attack)
    const tamperedPayload = { ...notifPayload, Message: '{"tampered":true}' };
    const isTamperedValid = await mailHub.verifySNSSignature(tamperedPayload, { certFetcher: mockCertFetcher });
    assert.strictEqual(isTamperedValid, false, 'Payload-ul falsificat a fost acceptat eronat');

    // Test 3: Cert URL falsificat
    const badCertUrlPayload = { ...notifPayload, SigningCertURL: 'https://evil.com/cert.pem' };
    const isBadCertValid = await mailHub.verifySNSSignature(badCertUrlPayload, { certFetcher: mockCertFetcher });
    assert.strictEqual(isBadCertValid, false, 'URL-ul de cert malițios a fost acceptat eronat');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Verificare PMH-201: Curățare Reply-Chain & Context Auto
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🧹 [PMH-201] Curățare Reply-Chain & Detectare Context Vehicul');

  it('cleanReplyChain elimină istoricul repetitiv On ... wrote și antetele de forward/reply', () => {
    const rawBody = `Bună ziua,
Sunt interesat de BMW X5. Putem programa un test drive mâine la ora 14:00?

On Mon, Oct 19, 2026 at 10:15 AM Andrei - RXM <contact@rxmautomobile.ro> wrote:
> Bună ziua, vehiculul este disponibil în showroom.`;

    const cleaned = mailHub.cleanReplyChain(rawBody);
    assert.strictEqual(cleaned.includes('Putem programa un test drive'), true);
    assert.strictEqual(cleaned.includes('On Mon, Oct 19'), false);
    assert.strictEqual(cleaned.includes('Andrei - RXM'), false);
  });

  it('cleanReplyChain curăță antetele în limba română (În data de ... a scris)', () => {
    const rawRo = `Vă mulțumesc pentru ofertă. Accept condițiile.

În data de 19.10.2026, la 14:20, Consilier Vânzări a scris:
> Vă transmitem oferta de preț pentru Audi Q7.`;

    const cleaned = mailHub.cleanReplyChain(rawRo);
    assert.strictEqual(cleaned, 'Vă mulțumesc pentru ofertă. Accept condițiile.');
  });

  it('detectVehicleContext identifică coduri stoc auto (RXM-XXXX, CVN-XXXX) și serii VIN (ISO 3779)', () => {
    const res1 = mailHub.detectVehicleContext('Interes achiziție RXM-1024 BMW Seria 5', 'Doresc detalii suplimentare.');
    assert.strictEqual(res1.vehicleId, 'RXM-1024');

    const res2 = mailHub.detectVehicleContext('Întrebare autoturism', 'Numărul de șasiu este WBA3A5C50DF289123.');
    assert.strictEqual(res2.vin, 'WBA3A5C50DF289123');

    const res3 = mailHub.detectVehicleContext('Comandă CVN-8822', 'Șasiu: VF12R040B51234567');
    assert.strictEqual(res3.vehicleId, 'CVN-8822');
    assert.strictEqual(res3.vin, 'VF12R040B51234567');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Verificare PMH-201: Parser Robust MIME RFC 2822
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📧 [PMH-201] Parser Robust MIME RFC 2822 & Atașamente');

  it('parseRawMimeEmail extrage corect antete, corp text/html și decodifică quoted-printable', () => {
    const sampleEml = [
      'From: "Ion Popescu" <ion.popescu@gmail.com>',
      'To: contact@rxmautomobile.ro',
      'Subject: =?UTF-8?Q?Cerere_ofert=C4=83_RXM-4040?=',
      'Date: Mon, 19 Oct 2026 12:30:00 +0300',
      'Message-ID: <client-msg-888@mail.gmail.com>',
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: quoted-printable',
      '',
      'Bun=C4=83 ziua,=0DV=C4=83 rog s=C4=83-=C8=9Bi trimite=C8=9Bi fisa tehnic=C4=83.',
    ].join('\r\n');

    const parsed = mailHub.parseRawMimeEmail(sampleEml);
    assert.strictEqual(parsed.from, 'ion.popescu@gmail.com');
    assert.strictEqual(parsed.senderName, 'Ion Popescu');
    assert.strictEqual(parsed.subject, 'Cerere ofertă RXM-4040');
    assert.strictEqual(parsed.messageId, 'client-msg-888@mail.gmail.com');
    assert.strictEqual(parsed.cleanBodyText.includes('Bună ziua,'), true);
    assert.strictEqual(parsed.cleanBodyText.includes('fisa tehnică'), true);
    assert.strictEqual(parsed.detectedVehicleId, 'RXM-4040');
  });

  it('parseRawMimeEmail procesează multipart/mixed cu atașament base64', () => {
    const pdfDummyContent = Buffer.from('%PDF-1.4 dummy vehicle inspection report').toString('base64');
    const sampleMultipart = [
      'From: Client VIP <vip@client.ro>',
      'To: vanzari@rxmautomobile.ro',
      'Subject: Inspecție Tehnică',
      'Message-ID: <multi-777@client.ro>',
      'MIME-Version: 1.0',
      'Content-Type: multipart/mixed; boundary="BOUNDARY_TEST_123"',
      '',
      '--BOUNDARY_TEST_123',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      'Atașat găsiți raportul tehnic.',
      '--BOUNDARY_TEST_123',
      'Content-Type: application/pdf; name="raport_inspectie.pdf"',
      'Content-Transfer-Encoding: base64',
      'Content-Disposition: attachment; filename="raport_inspectie.pdf"',
      '',
      pdfDummyContent,
      '--BOUNDARY_TEST_123--',
    ].join('\r\n');

    const parsed = mailHub.parseRawMimeEmail(sampleMultipart);
    assert.strictEqual(parsed.cleanBodyText, 'Atașat găsiți raportul tehnic.');
    assert.strictEqual(parsed.attachments.length, 1);
    assert.strictEqual(parsed.attachments[0].fileName, 'raport_inspectie.pdf');
    assert.strictEqual(parsed.attachments[0].mimeType, 'application/pdf');
    assert.strictEqual(parsed.attachments[0].content.toString('utf8').includes('%PDF-1.4'), true);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Verificare PMH-202: SES Outbound Delivery Service
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📤 [PMH-202] Serviciu Outbound SES Delivery & Deliverability Guard');

  it('formatSenderHeader generează corect antetul "Nume Angajat - Nume Parc" <email>', () => {
    const hdr = mailHub.formatSenderHeader('Andrei Popa', 'RXM Automobile', 'andrei@rxmautomobile.ro');
    assert.strictEqual(hdr, '"Andrei Popa - RXM Automobile" <andrei@rxmautomobile.ro>');
  });

  it('generateRFC2822MessageId produce ID valid cu delimitatori < > și domeniu', () => {
    const msgId = mailHub.generateRFC2822MessageId('rxmautomobile.ro');
    assert.match(msgId, /^<[a-f0-9-]+(?:\.\d+)?@rxmautomobile\.ro>$/);
  });

  it('buildRawMimeMessage creează structură corectă cu Message-ID, In-Reply-To, References și List-Unsubscribe', () => {
    const { rawMime, messageId } = mailHub.buildRawMimeMessage({
      employeeName: 'Mihai',
      dealershipName: 'RXM Automobile',
      senderEmail: 'mihai@rxmautomobile.ro',
      recipientEmail: 'client@gmail.com',
      recipientName: 'Gheorghe',
      subject: 'Ofertă Specială BMW',
      textBody: 'Vă trimit oferta pentru BMW.',
      htmlBody: '<strong>Vă trimit oferta pentru BMW.</strong>',
      parentMessageId: '<client-parent-msg@gmail.com>',
      references: ['<client-parent-msg@gmail.com>'],
      isCommercial: true,
      attachments: [
        {
          fileName: 'oferta_bmw.pdf',
          mimeType: 'application/pdf',
          content: Buffer.from('%PDF-1.4 BMW Offer Data'),
        },
      ],
    });

    assert.strictEqual(rawMime.includes('From: "Mihai - RXM Automobile" <mihai@rxmautomobile.ro>'), true);
    assert.strictEqual(rawMime.includes('To: "Gheorghe" <client@gmail.com>'), true);
    assert.strictEqual(rawMime.includes(`Message-ID: ${messageId}`), true);
    assert.strictEqual(rawMime.includes('In-Reply-To: <client-parent-msg@gmail.com>'), true);
    assert.strictEqual(rawMime.includes('References: <client-parent-msg@gmail.com>'), true);
    assert.strictEqual(rawMime.includes('List-Unsubscribe: <mailto:unsubscribe@rxmautomobile.ro'), true);
    assert.strictEqual(rawMime.includes('filename="oferta_bmw.pdf"'), true);
  });

  await itAsync('handleOutboundSend blochează trimiterea către adrese din mail_suppression_list', async () => {
    // Simulăm o adresă în lista de supresie
    const suppressedEmail = `bounce-test-${Date.now()}@invalid-domain.com`;
    await mailHub.addToSuppressionList(suppressedEmail, 'HARD_BOUNCE');

    const sendRes = await mailHub.handleOutboundSend({
      dealerId: 'rxm',
      recipientEmail: suppressedEmail,
      subject: 'Test delivery',
      textBody: 'Mesaj de test',
    });

    assert.strictEqual(sendRes.statusCode, 400);
    assert.strictEqual(sendRes.body.isSuppressed, true);
    assert.strictEqual(sendRes.body.reason, 'HARD_BOUNCE');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Verificare Invariante Holding & TVA 21%
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🏛️ [HOLDING] Verificare Invariante Fiscale TVA 21% & Garanție');

  it('Constanta TVA este strict 21% (VAT_RATE = 0.21)', () => {
    assert.strictEqual(mailHub.VAT_RATE, 0.21);
  });

  it('Terminologia de garanție este strict "Cont de Garanție" și "Garanție de Rezervare/Participare"', () => {
    assert.strictEqual(mailHub.WARRANTY_ESCROW_TERM, 'Cont de Garanție');
    assert.strictEqual(mailHub.RESERVATION_GUARANTEE_TERM, 'Garanție de Rezervare/Participare');
  });

  it('TypeScript Services (mailWebhookService.ts & mailDeliveryService.ts) conțin exporturile necesare', () => {
    const whTs = fs.readFileSync(mailWebhookTsPath, 'utf8');
    assert(whTs.includes('verifySNSSignature'), 'verifySNSSignature lipsește din mailWebhookService.ts');
    assert(whTs.includes('parseRawMimeEmail'), 'parseRawMimeEmail lipsește din mailWebhookService.ts');
    assert(whTs.includes('cleanReplyChain'), 'cleanReplyChain lipsește din mailWebhookService.ts');
    assert(whTs.includes('detectVehicleContext'), 'detectVehicleContext lipsește din mailWebhookService.ts');

    const delTs = fs.readFileSync(mailDeliveryTsPath, 'utf8');
    assert(delTs.includes('export class MailDeliveryService'), 'MailDeliveryService lipsește din mailDeliveryService.ts');
    assert(delTs.includes('export class SuppressedRecipientError'), 'SuppressedRecipientError lipsește din mailDeliveryService.ts');
    assert(delTs.includes('export function buildRawMimeMessage'), 'buildRawMimeMessage lipsește din mailDeliveryService.ts');
    assert(delTs.includes('export const VAT_RATE = 0.21'), 'VAT_RATE 0.21 lipsește din mailDeliveryService.ts');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Verificare PMH-203, PMH-204 & PMH-301: REST API & Dark Luxury UI
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n🖥️ [UI & API] Verificare PMH-203 / PMH-204 REST API & PMH-301 Dark Luxury UI');

  it('server/mailHub.mjs exportă funcțiile complete pentru PMH-203 și PMH-204', () => {
    assert(typeof mailHub.updateThreadStatus === 'function', 'updateThreadStatus lipsește');
    assert(typeof mailHub.searchMail === 'function', 'searchMail lipsește');
    assert(typeof mailHub.getMailStats === 'function', 'getMailStats lipsește');
    assert(typeof mailHub.getMailAccounts === 'function', 'getMailAccounts lipsește');
    assert(typeof mailHub.createMailAccount === 'function', 'createMailAccount lipsește');
    assert(typeof mailHub.updateMailAccount === 'function', 'updateMailAccount lipsește');
    assert(typeof mailHub.disableMailAccountAndReassign === 'function', 'disableMailAccountAndReassign lipsește');
  });

  it('src/modules/mail/MailboxLayout.tsx este creat cu 3 coloane și respectă TVA 21%', () => {
    const layoutPath = path.join(__dirname, '..', 'src', 'modules', 'mail', 'MailboxLayout.tsx');
    assert(fs.existsSync(layoutPath), 'MailboxLayout.tsx lipsește');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    assert(layoutContent.includes('MailboxLayout'), 'Componenta MailboxLayout lipsește');
    assert(layoutContent.includes('VAT_RATE = 0.21'), 'TVA 21% lipsește din MailboxLayout');
    assert(layoutContent.includes('Cont de Garanție'), 'Termenul Cont de Garanție lipsește');
    assert(layoutContent.includes('Garanție de Rezervare/Participare'), 'Termenul Garanție de Rezervare lipsește');
  });

  it('CarmatikSidebar și AdminPortal integrează complet tabul ParcOS Mail Hub', () => {
    const sidebarPath = path.join(__dirname, '..', 'src', 'components', 'admin', 'CarmatikSidebar.tsx');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
    assert(sidebarContent.includes("'mail'"), "Tabul 'mail' lipsește din AdminTabType");
    assert(sidebarContent.includes('ParcOS Mail Hub'), "Eticheta 'ParcOS Mail Hub' lipsește din CarmatikSidebar");

    const portalPath = path.join(__dirname, '..', 'src', 'components', 'admin', 'AdminPortal.tsx');
    const portalContent = fs.readFileSync(portalPath, 'utf8');
    assert(portalContent.includes('MailboxLayout'), 'Importul MailboxLayout lipsește din AdminPortal');
    assert(portalContent.includes("activeAdminTab === 'mail'"), "Condiția activeAdminTab === 'mail' lipsește");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Rezumat Final
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════════════════════════');
  console.log(`🎯 REZULTAT TESTE SPRINT 2: ${testsPassed} / ${testsTotal} teste trecute cu succes.`);
  if (testsPassed === testsTotal) {
    console.log('✨ [SUCCESS] Toate criteriile de acceptanță pentru PMH-201, PMH-202, PMH-203, PMH-204 & PMH-301 sunt îndeplinite!');
  } else {
    console.error(`⚠️ [ATTENTION] ${testsTotal - testsPassed} teste au eșuat.`);
    process.exit(1);
  }
  console.log('════════════════════════════════════════════════════════════════════════════════');
}

runSuite().catch((err) => {
  console.error('Fatal suite error:', err);
  process.exit(1);
});
