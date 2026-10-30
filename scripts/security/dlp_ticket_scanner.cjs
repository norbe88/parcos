#!/usr/bin/env node
/**
 * CARVANA SRL Holding — QA Security & DLP Gate Scanner
 * 
 * Data & Ora: 2026-10-25 09:03:00
 * Platform Persona: Mao (Platform Native AI Developer)
 * 
 * Misiune:
 * Scanează tichetele tehnice, specificațiile, comentariile și descrierile pentru a preveni
 * scurgerile de secrete (Hardcoded Secrets), bypass-uri de securitate interne și date PII
 * înainte de publicare sau atribuire către echipe mixte / contractori externi.
 * 
 * Usage:
 *   node scripts/security/dlp_ticket_scanner.cjs --check <path-to-file-or-dir>
 *   node scripts/security/dlp_ticket_scanner.cjs --redact <path-to-file-or-dir> [--inplace]
 *   node scripts/security/dlp_ticket_scanner.cjs --json <path-to-file>
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. REGEX & HEURISTIC RULES TAXONOMY
// ============================================================================

const SECRET_PATTERNS = [
  {
    id: 'STRIPE_LIVE_KEY',
    category: 'Hardcoded Secret',
    severity: 'CRITICAL',
    regex: /\b(?:sk|rk)_live_[0-9a-zA-Z]{24,}\b/g,
    placeholder: '<REDACTED_STRIPE_LIVE_KEY>',
    description: 'Cheie privată Stripe de Producție (Live Key)'
  },
  {
    id: 'STRIPE_TEST_KEY',
    category: 'Hardcoded Secret',
    severity: 'HIGH',
    regex: /\b(?:sk|rk)_test_[0-9a-zA-Z]{24,}\b/g,
    placeholder: '<REDACTED_STRIPE_TEST_KEY>',
    description: 'Cheie privată Stripe de Test'
  },
  {
    id: 'GOOGLE_GEMINI_KEY',
    category: 'Hardcoded Secret',
    severity: 'CRITICAL',
    regex: /\bAIzaSy[0-9a-zA-Z-_]{33}\b/g,
    placeholder: '<REDACTED_GEMINI_API_KEY>',
    description: 'Google AI / Gemini API Key'
  },
  {
    id: 'AWS_ACCESS_KEY',
    category: 'Hardcoded Secret',
    severity: 'CRITICAL',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    placeholder: '<REDACTED_AWS_ACCESS_KEY>',
    description: 'AWS Access Key ID'
  },
  {
    id: 'OPENAI_KEY',
    category: 'Hardcoded Secret',
    severity: 'CRITICAL',
    regex: /\bsk-(?:proj-)?[a-zA-Z0-9_-]{32,}\b/g,
    placeholder: '<REDACTED_OPENAI_API_KEY>',
    description: 'OpenAI API Secret Key'
  },
  {
    id: 'ANTHROPIC_KEY',
    category: 'Hardcoded Secret',
    severity: 'CRITICAL',
    regex: /\bsk-ant-api03-[a-zA-Z0-9_-]{80,}\b/g,
    placeholder: '<REDACTED_ANTHROPIC_KEY>',
    description: 'Anthropic API Secret Key'
  },
  {
    id: 'GITHUB_PAT',
    category: 'Hardcoded Secret',
    severity: 'CRITICAL',
    regex: /\b(?:ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{70,})\b/g,
    placeholder: '<REDACTED_GITHUB_TOKEN>',
    description: 'GitHub Personal Access Token'
  },
  {
    id: 'SLACK_TOKEN',
    category: 'Hardcoded Secret',
    severity: 'CRITICAL',
    regex: /\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*\b/g,
    placeholder: '<REDACTED_SLACK_TOKEN>',
    description: 'Slack Bot / User Access Token'
  },
  {
    id: 'JWT_TOKEN',
    category: 'Hardcoded Secret',
    severity: 'HIGH',
    regex: /\beyJ[A-Za-z0-9-_=]{10,}\.eyJ[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_.+/=]{10,}\b/g,
    placeholder: '<REDACTED_JWT_TOKEN>',
    description: 'JSON Web Token (JWT) cu payload semnat'
  },
  {
    id: 'DB_CONNECTION_STRING',
    category: 'Hardcoded Secret',
    severity: 'CRITICAL',
    regex: /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^\s"'<>]+:[^\s"'<>]+@[^\s"'<>]+\b/g,
    placeholder: '<REDACTED_DATABASE_URI>',
    description: 'URI conexiune bază de date cu credențiale în clar'
  },
  {
    id: 'PRIVATE_KEY_BLOCK',
    category: 'Hardcoded Secret',
    severity: 'CRITICAL',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    placeholder: '<REDACTED_SSH_PRIVATE_KEY>',
    description: 'Bloc de cheie privată SSH / RSA / PGP'
  },
  {
    id: 'CLEARTEXT_PASSWORD',
    category: 'Hardcoded Secret',
    severity: 'HIGH',
    regex: /(?:password|passwd|pwd|parola)\s*[:=]\s*["']?([A-Za-z0-9!@#$%^&*()_+=-]{6,})["']?/gi,
    placeholder: '<REDACTED_PASSWORD>',
    description: 'Parolă în clar specificată în text',
    customHandler: (match, p1) => {
      // Exclude placeholders and common mock values
      const val = p1.toLowerCase();
      if (val.includes('redacted') || val.includes('mock') || val === 'password' || val === 'secret' || val === 'change_me') {
        return null;
      }
      return match.replace(p1, '<REDACTED_PASSWORD>');
    }
  }
];

const INTERNAL_PROCESS_PATTERNS = [
  {
    id: 'UNAUTHENTICATED_ENDPOINT_BYPASS',
    category: 'Procese Interne / Arhitectură',
    severity: 'HIGH',
    regex: /(?:fara autentificare|without auth|no auth|bypass(?: la)? proxy|bypass(?: la)? waf|bypass(?: la)? autentificare)/gi,
    placeholder: '<REDACTED_INTERNAL_BYPASS>',
    description: 'Specificare metodă de bypass la securitate sau endpoint intern fără autentificare'
  },
  {
    id: 'WIKI_OR_SLACK_CREDENTIALS',
    category: 'Procese Interne / Arhitectură',
    severity: 'HIGH',
    regex: /(?:parola de pe wiki|parola din slack|cont(?:ul)? de admin cu parola|folositi contul de admin|gasiti parola in)/gi,
    placeholder: '<REDACTED_INTERNAL_CREDENTIAL_REFERENCE>',
    description: 'Referință internă la parole distribuite pe Wiki, Slack sau canale nesecurizate'
  },
  {
    id: 'EXPOSED_INTERNAL_PORT',
    category: 'Procese Interne / Arhitectură',
    severity: 'MEDIUM',
    regex: /(?:portul (?:8080|22|5432|27017|6379|3306) (?:deschis|deschide|lasat deschis)|acces root direct|ssh fara cheie)/gi,
    placeholder: '<REDACTED_INTERNAL_PORT_EXPOSURE>',
    description: 'Instrucțiune de deschidere a unui port intern de baze de date sau acces administrativ direct'
  }
];

const PII_PATTERNS = [
  {
    id: 'ROMANIAN_CNP',
    category: 'PII (Date Personale Identificabile)',
    severity: 'HIGH',
    regex: /\b[1-8]\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{6}\b/g,
    placeholder: '<MOCK_CNP>',
    description: 'Cod Numeric Personal (CNP) românesc potențial real în date de test',
    validator: (cnp) => {
      // Algoritm validare checksum CNP
      const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cnp[i], 10) * weights[i];
      }
      let rem = sum % 11;
      let control = rem === 10 ? 1 : rem;
      return control === parseInt(cnp[12], 10);
    }
  },
  {
    id: 'CREDIT_CARD_NUMBER',
    category: 'PII (Date Personale Identificabile)',
    severity: 'CRITICAL',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    placeholder: '<MOCK_CARD_NUMBER>',
    description: 'Număr card bancar real detectat în descriere sau exemple',
    validator: (card) => {
      // Exclude simple repetitions (e.g. 0000000000000000, 1111111111111111)
      if (/^(\d)\1+$/.test(card)) return false;
      // Luhn algorithm
      let sum = 0;
      let shouldDouble = false;
      for (let i = card.length - 1; i >= 0; i--) {
        let digit = parseInt(card.charAt(i), 10);
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      return (sum % 10) === 0;
    }
  },
  {
    id: 'ROMANIAN_IBAN',
    category: 'PII (Date Personale Identificabile)',
    severity: 'HIGH',
    regex: /\bRO\d{2}[A-Z]{4}[0-9A-Z]{16}\b/g,
    placeholder: '<MOCK_IBAN>',
    description: 'IBAN bancar românesc real'
  }
];

// ============================================================================
// 2. AUDIT & REDACTION LOGIC
// ============================================================================

/**
 * Scanează textul și returnează un raport detaliat de audit și versiunea curățată.
 */
function scanAndSanitize(content, ticketTitle = 'Tichet Fără Titlu') {
  const issues = [];
  const architectureRisks = [];
  let sanitizedContent = content;

  // 1. Scanare Secrete
  for (const rule of SECRET_PATTERNS) {
    let match;
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    while ((match = regex.exec(content)) !== null) {
      // Nu raporta dacă e deja redactat
      if (match[0].includes('REDACTED') || match[0].includes('MOCK')) continue;

      if (rule.customHandler) {
        const replacement = rule.customHandler(match[0], match[1]);
        if (replacement) {
          issues.push({
            ruleId: rule.id,
            category: rule.category,
            severity: rule.severity,
            description: rule.description,
            line: getLineNumber(content, match.index)
          });
          sanitizedContent = sanitizedContent.replace(match[0], replacement);
        }
      } else {
        issues.push({
          ruleId: rule.id,
          category: rule.category,
          severity: rule.severity,
          description: rule.description,
          line: getLineNumber(content, match.index)
        });
        sanitizedContent = sanitizedContent.replace(match[0], rule.placeholder);
      }
    }
  }

  // 2. Scanare Procese Interne / Arhitectură
  for (const rule of INTERNAL_PROCESS_PATTERNS) {
    let match;
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    while ((match = regex.exec(content)) !== null) {
      if (match[0].includes('REDACTED') || match[0].includes('MOCK')) continue;

      architectureRisks.push({
        ruleId: rule.id,
        category: rule.category,
        severity: rule.severity,
        description: rule.description,
        snippet: match[0],
        line: getLineNumber(content, match.index)
      });
      sanitizedContent = sanitizedContent.replace(match[0], rule.placeholder);
    }
  }

  // 3. Scanare PII
  for (const rule of PII_PATTERNS) {
    let match;
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    while ((match = regex.exec(content)) !== null) {
      if (match[0].includes('REDACTED') || match[0].includes('MOCK')) continue;

      if (rule.validator && !rule.validator(match[0])) {
        // Valoarea nu trece algoritmul strict de validare, cel mai probabil este mock
        continue;
      }

      issues.push({
        ruleId: rule.id,
        category: rule.category,
        severity: rule.severity,
        description: rule.description,
        line: getLineNumber(content, match.index)
      });
      sanitizedContent = sanitizedContent.replace(match[0], rule.placeholder);
    }
  }

  // Calcul Verdict
  let verdict = '🟢 CLEAN';
  const hasCritical = issues.some(i => i.severity === 'CRITICAL') || architectureRisks.some(i => i.severity === 'CRITICAL');
  const hasHighOrMedium = issues.length > 0 || architectureRisks.length > 0;

  if (hasCritical) {
    verdict = '🔴 BLOCKED - CRITICAL LEAK';
  } else if (hasHighOrMedium) {
    verdict = '🟡 NEEDS REVISION';
  }

  // Generare Raport Standardizat Markdown
  const auditReport = generateAuditReport(ticketTitle, verdict, issues, architectureRisks, sanitizedContent);

  return {
    ticketTitle,
    verdict,
    isClean: verdict === '🟢 CLEAN',
    isBlocked: verdict.includes('🔴 BLOCKED'),
    needsRevision: verdict.includes('🟡 NEEDS REVISION'),
    issues,
    architectureRisks,
    sanitizedContent,
    auditReport
  };
}

function getLineNumber(text, index) {
  return text.substring(0, index).split('\n').length;
}

function generateAuditReport(ticketTitle, verdict, issues, architectureRisks, sanitizedContent) {
  let issuesSection = '- Nicio vulnerabilitate sau secret detectat în text.';
  if (issues.length > 0) {
    issuesSection = issues.map(i => `- [${i.severity}] A fost detectat: ${i.description} (Linia ${i.line}). Secretul a fost mascat.`).join('\n');
  }

  let archSection = '- Nicio metodă de bypass intern sau risc arhitectural detectat.';
  if (architectureRisks.length > 0) {
    archSection = architectureRisks.map(a => `- [${a.severity}] ${a.description} (Linia ${a.line}). Risc de acces neautorizat dacă tichetul este accesibil extern.`).join('\n');
  }

  return `---
### 🔒 Security Audit: ${ticketTitle}

**Verdict de Securitate:** ${verdict}

**🚨 Probleme de Securitate Identificate:**
${issuesSection}

**⚠️ Expunere Procese Interne / Arhitectură:**
${archSection}

**🛠️ Versiunea Curățată (Sanitized Version):**
${verdict === '🟢 CLEAN' ? '*(Tichetul conține exclusiv date curate; nu a fost necesară nicio redactare)*' : sanitizedContent}
---`;
}

// ============================================================================
// 3. CLI RUNNER
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
CARVANA SRL — QA Security & DLP Gate Scanner
===========================================
Utilizare:
  node scripts/security/dlp_ticket_scanner.cjs --check <path_to_file_or_dir>
  node scripts/security/dlp_ticket_scanner.cjs --redact <path_to_file_or_dir> [--inplace]
  node scripts/security/dlp_ticket_scanner.cjs --json <path_to_file>

Opțiuni:
  --check    Rulează un audit pasiv (read-only) și afișează raportul de securitate.
  --redact   Înlocuiește automat secretele găsite cu tokeni mock/redactați.
  --inplace  Suprascrie fișierul original cu versiunea curățată și adaugă secțiunea de audit.
  --json     Afișează rezultatele scanării în format JSON.
    `);
    process.exit(0);
  }

  const isCheck = args.includes('--check');
  const isRedact = args.includes('--redact');
  const isJson = args.includes('--json');
  const isInplace = args.includes('--inplace');

  // Find target path
  let targetPath = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) {
      targetPath = args[i];
      break;
    }
  }

  if (!targetPath) {
    console.error('❌ Eroare: Nu a fost specificată o cale către fișier sau director.');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), targetPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Eroare: Calea nu există: ${fullPath}`);
    process.exit(1);
  }

  const filesToScan = [];
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    collectMarkdownFiles(fullPath, filesToScan);
  } else {
    filesToScan.push(fullPath);
  }

  if (filesToScan.length === 0) {
    console.log('ℹ️ Niciun fișier markdown (.md) găsit pentru scanare.');
    process.exit(0);
  }

  let totalBlocked = 0;
  let totalNeedsRevision = 0;
  let totalClean = 0;
  const jsonResults = [];

  for (const file of filesToScan) {
    const rawContent = fs.readFileSync(file, 'utf8');
    const titleMatch = rawContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(file);

    const result = scanAndSanitize(rawContent, title);

    if (result.isBlocked) totalBlocked++;
    else if (result.needsRevision) totalNeedsRevision++;
    else totalClean++;

    if (isJson) {
      jsonResults.push({
        file,
        title,
        verdict: result.verdict,
        issuesCount: result.issues.length,
        risksCount: result.architectureRisks.length,
        issues: result.issues,
        risks: result.architectureRisks
      });
    } else {
      console.log(`\n======================================================================`);
      console.log(`📄 Fișier: ${path.relative(process.cwd(), file)}`);
      console.log(result.auditReport);
    }

    if (isRedact && isInplace) {
      // Actualizează fișierul cu conținutul curățat și adaugă raportul de audit dacă nu există deja
      let updatedFileContent = result.sanitizedContent;
      // Curăță audit-uri anterioare dacă existau
      const auditMarker = '### 🔒 Security Audit:';
      if (updatedFileContent.includes(auditMarker)) {
        updatedFileContent = updatedFileContent.split(auditMarker)[0].trim() + '\n\n' + result.auditReport;
      } else {
        updatedFileContent = updatedFileContent.trim() + '\n\n' + result.auditReport;
      }
      fs.writeFileSync(file, updatedFileContent, 'utf8');
      console.log(`💾 [AUTO-REDACT] Fișierul a fost actualizat cu succes: ${path.basename(file)}`);
    }
  }

  if (isJson) {
    console.log(JSON.stringify(jsonResults, null, 2));
  } else {
    console.log(`\n======================================================================`);
    console.log(`🏁 REZUMAT AUDIT SECURITATE (Total fișiere: ${filesToScan.length})`);
    console.log(`   🟢 CLEAN:          ${totalClean}`);
    console.log(`   🟡 NEEDS REVISION: ${totalNeedsRevision}`);
    console.log(`   🔴 BLOCKED:        ${totalBlocked}`);
    console.log(`======================================================================\n`);
  }

  // Return exit code 1 if any ticket is blocked or needs revision in CI/strict mode
  if (totalBlocked > 0 || (isCheck && totalNeedsRevision > 0)) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

function collectMarkdownFiles(dir, fileList) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item.startsWith('.') || item === 'node_modules') continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      collectMarkdownFiles(full, fileList);
    } else if (item.endsWith('.md')) {
      fileList.push(full);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  scanAndSanitize,
  SECRET_PATTERNS,
  INTERNAL_PROCESS_PATTERNS,
  PII_PATTERNS
};
