# 🔬 NOTEBOOKLM RESEARCH BRIEF: Automated Live Production Verification via Chrome
> **Data & Ora:** 2026-10-19 18:55:00  
> **Platform Persona:** Mao (AI Research Architect & Knowledge Engineer)  
> **Target Scope:** RXM Automobile Live Production (`https://rxmautomobile.ro`) on Netcup VPS (`152.53.158.65`)

---

## 🎯 1. STRATEGIC SIGNAL & OBJECTIVE
To provide an autonomous, continuous verification framework where the AI agent (Antigravity) can launch a real browser (Chrome DevTools / Playwright / Browser Subagent) against the live production environment immediately following any deployment or security hardening event.

### Core Problems Addressed:
1. **Silent CSP Regressions:** Content Security Policy changes in Nginx frequently break iframes (TikTok reels, YouTube HD, Google Maps) or media streaming without throwing typical HTTP 500 errors.
2. **Data Isolation vs. Client Cache Desynchronization:** Sanitizing public endpoints must never corrupt admin cache or wipe database records upon updates.
3. **Authentication Boundary Verification:** Automated regression checks must prove that public visitors cannot mutate inventory or view financial metrics, while verified administrators retain full access.

---

## 🏗️ 2. THE CHROME LIVE VERIFICATION ENGINE ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ANTIGRAVITY CHROME RUNTIME (CDP)                     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│ 1. Header & CSP     │   │ 2. Live DOM &       │   │ 3. Console & Network│
│    Interceptor      │   │    Iframe Validator │   │    Security Traps   │
│ • frame-src audit   │   │ • TikTok 9:16 frame │   │ • CSP Violations    │
│ • connect-src audit │   │ • Google Maps embed │   │ • 401/403 Regressions│
│ • HSTS & Permissions│   │ • Audio controller  │   │ • Unhandled Promise │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

### Component A: The Real-Time CSP Violation Trap
Instead of relying solely on visual inspection, Chrome allows injecting a runtime listener for `SecurityPolicyViolationEvent`:
```javascript
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('[CSP VIOLATION TRAPPED]', {
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    originalPolicy: e.originalPolicy,
    disposition: e.disposition
  });
});
```
Any blocked iframe, inline script, or external CDN call is immediately flagged with the exact directive that blocked it.

### Component B: DOM & Iframe Handshake Verification
1. **TikTok Video Embed:**
   - URL schema: `https://www.tiktok.com/player/v1/<videoId>`
   - Requirements: `frame-src 'self' https://www.tiktok.com https://*.tiktok.com; media-src 'self' data: blob: https:;`
   - Audio trigger: Test `postMessage({ type: 'unMute' }, '*')` and volume initialization at 60%.
2. **Interactive Google Maps Showroom Embed:**
   - URL schema: `https://maps.google.com/maps?q=...&output=embed`
   - Requirements: `frame-src 'self' ... https://maps.google.com https://www.google.com;`
3. **YouTube HD Walkaround Embed:**
   - URL schema: `https://www.youtube.com/embed/...`
   - Requirements: `frame-src 'self' ... https://www.youtube.com https://*.youtube.com;`

### Component C: Dual-Role Authentication & Data Isolation Gate
The verification runner executes tests under two distinct personas:
1. **Persona Public Visitor:**
   - Hits `GET /api/vehicles`.
   - Asserts: `purchasePriceEur === undefined`, `expenses === undefined`, `auditLog === undefined`, `vin` masked with `***`.
   - Attempts `POST /api/vehicles`. Asserts: HTTP `401 Unauthorized`.
2. **Persona Dealer Administrator:**
   - Authenticates via `POST /api/auth/login` with secret credentials.
   - Asserts: `token` returned and stored.
   - Hits `GET /api/admin/vehicles` with `Bearer <token>`.
   - Asserts: Full vehicle records, including `purchasePriceEur`, `expenses`, and unmasked VIN.

---

## 📋 3. INVARIANTS COMPLIANCE
- **Strict 21% VAT:** All price evaluations must adhere strictly to `VAT_RATE = 0.21`.
- **Cont de Garanție:** Reservation terminology must strictly use "Cont de Garanție".
- **Netcup VPS Host:** Target host is strictly `152.53.158.65` (`rxmautomobile.ro`).
