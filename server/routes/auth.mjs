/**
 * ParcOS — Authentication & Session Management Routes
 * Modular Route Handler: /api/auth/*, /api/superadmin/auth/verify
 */

import crypto from 'crypto';

export async function handleAuthRoutes(req, res, urlObj, pathname, {
  sendJson,
  readRequestBody,
  SUPERADMIN_PASSWORD_HASH,
  ADMIN_PASSWORD_HASH,
  SUPERADMIN_MASTER_KEY,
  generateSuperAdminSessionToken,
  generateSessionToken,
  revokeSessionToken,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
  normalizeSlug,
  resolveTenant
}) {
  // 0.1 POST /api/auth/login - Autentificare Administrator & Emitere Token Sesiune
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const rawBody = await readRequestBody(req, 1024 * 64);
    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      sendJson(res, 400, { success: false, error: 'Format JSON invalid' });
      return true;
    }

    const password = String(payload.password || '').trim();
    if (!password) {
      sendJson(res, 400, { success: false, error: 'Parola este obligatorie' });
      return true;
    }

    const inputHash = crypto.createHash('sha256').update(password).digest('hex');

    // Deducere context tenant & domeniu
    const rawHost = (req.headers['host'] || '').split(':')[0].toLowerCase().trim().replace(/^www\./, '');
    const reqTenant = normalizeSlug(payload.tenantId || payload.tenant_id || payload.dealerId || req.headers['x-tenant-id'] || '');

    // Verificare precisă: subdomeniile de showroom (*.parcos.ro, ex: mpiauto.parcos.ro) sunt CONTEXT DEALER, nu consola SuperAdmin ParcOS
    const isSubdomainDealer = rawHost.endsWith('.parcos.ro') && 
      !['parcos', 'app', 'admin', 'staging', 'sandbox', 'www'].includes(rawHost.slice(0, -'.parcos.ro'.length));

    const isPlatformConsoleHost = ['parcos.ro', 'staging.parcos.ro', 'app.parcos.ro', 'admin.parcos.ro'].includes(rawHost);

    const isParcosContext = !isSubdomainDealer && (
      reqTenant === 'parcos' || 
      (isPlatformConsoleHost && (!reqTenant || reqTenant === 'parcos'))
    );

    // 👑 CAZUL 1: AUTENTIFICARE CONSOLĂ SUPERADMIN PARCOS (parcos.ro / tenant 'parcos')
    if (isParcosContext) {
      let isSuperAdminMatch = false;
      try {
        isSuperAdminMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(SUPERADMIN_PASSWORD_HASH));
      } catch {
        isSuperAdminMatch = (inputHash === SUPERADMIN_PASSWORD_HASH);
      }
      if (!isSuperAdminMatch && (password === SUPERADMIN_MASTER_KEY || inputHash === crypto.createHash('sha256').update(SUPERADMIN_MASTER_KEY).digest('hex'))) {
        isSuperAdminMatch = true;
      }

      if (!isSuperAdminMatch) {
        let isDealerPwd = false;
        try {
          isDealerPwd = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(ADMIN_PASSWORD_HASH));
        } catch {
          isDealerPwd = (inputHash === ADMIN_PASSWORD_HASH);
        }
        if (isDealerPwd) {
          sendJson(res, 401, {
            success: false,
            error: 'Parola introdusă este pentru showroom individual. Pe consola SuperAdmin ParcOS este necesară parola de administrator de platformă.'
          });
          return true;
        }
        sendJson(res, 401, {
          success: false,
          error: 'Parolă incorectă pentru Consola SuperAdmin ParcOS. Accesul este rezervat exclusiv administratorilor Carvana SRL.'
        });
        return true;
      }

      const superToken = generateSuperAdminSessionToken();
      sendJson(res, 200, {
        success: true,
        token: superToken,
        role: 'superadmin',
        tenantId: 'parcos',
        expiresIn: 86400,
        message: '👑 Autentificare SuperAdmin ParcOS reușită'
      });
      return true;
    }

    // 🚗 CAZUL 2: AUTENTIFICARE SHOWROOM / DEALER (rxmautomobile.ro sau alt tenant)
    // 2.1 Verificare Master SuperAdmin Override pe showroom (SuperAdmin funcționează ca master key)
    let isSuperOverride = false;
    try {
      isSuperOverride = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(SUPERADMIN_PASSWORD_HASH));
    } catch {
      isSuperOverride = (inputHash === SUPERADMIN_PASSWORD_HASH);
    }
    if (!isSuperOverride && (password === SUPERADMIN_MASTER_KEY || inputHash === crypto.createHash('sha256').update(SUPERADMIN_MASTER_KEY).digest('hex'))) {
      isSuperOverride = true;
    }

    if (isSuperOverride) {
      const superToken = generateSuperAdminSessionToken();
      sendJson(res, 200, {
        success: true,
        token: superToken,
        role: 'superadmin',
        tenantId: reqTenant || 'rxm',
        expiresIn: 86400,
        message: '👑 Autentificare Master SuperAdmin Override reușită pe showroom'
      });
      return true;
    }

    // 2.2 Rezoluție Tenant Showroom
    let tenant;
    try {
      tenant = await resolveTenant(req, urlObj);
    } catch {
      tenant = null;
    }
    const dealerSlug = String(reqTenant || tenant?.slug || '').trim().toLowerCase();

    // 2.3 Verificare Parolă Showroom Admin per-Dealer
    let isDealerMatch = false;

    // A. Verificare din tenant config (adminPasswordHash sau adminPassword din DB)
    const configuredHash = tenant?.config?.adminPasswordHash;
    const configuredPlain = tenant?.config?.adminPassword;

    if (configuredHash) {
      try {
        isDealerMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(configuredHash));
      } catch {
        isDealerMatch = (inputHash === configuredHash);
      }
    } else if (configuredPlain) {
      isDealerMatch = (password === configuredPlain);
    }

    // B. Verificare parolă dedicată MPI Auto (Mircea: MPI.2026)
    if (!isDealerMatch && (dealerSlug === 'mpi_auto' || dealerSlug === 'mpi')) {
      const MPI_ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH_MPI_AUTO || '47ac7c7bfde4dc1e081a33011bd8c4e0018404a26a2ec37799d2c5715211445f'; // SHA-256('MPI.2026')
      try {
        isDealerMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(MPI_ADMIN_HASH));
      } catch {
        isDealerMatch = (inputHash === MPI_ADMIN_HASH);
      }
    }

    // C. Fallback global pentru RXM și dealeri legacy (Luna.RXM)
    if (!isDealerMatch && dealerSlug !== 'mpi_auto' && dealerSlug !== 'mpi') {
      try {
        isDealerMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(ADMIN_PASSWORD_HASH));
      } catch {
        isDealerMatch = (inputHash === ADMIN_PASSWORD_HASH);
      }
    }

    if (!isDealerMatch) {
      sendJson(res, 401, {
        success: false,
        error: 'Parolă incorectă. Accesul este rezervat exclusiv administratorilor showroom-ului.'
      });
      return true;
    }
    if (!tenant || tenant.unconfigured === true || !/^[a-z0-9_]+$/.test(dealerSlug)) {
      sendJson(res, 404, { success: false, error: 'Showroom neconfigurat' });
      return true;
    }
    const dealerToken = generateSessionToken('dealer_admin', dealerSlug);
    if (!dealerToken) {
      sendJson(res, 404, { success: false, error: 'Showroom neconfigurat' });
      return true;
    }
    sendJson(res, 200, {
      success: true,
      token: dealerToken,
      role: 'dealer_admin',
      dealerSlug,
      expiresIn: 86400,
      message: 'Autentificare administrator showroom reușită'
    });
    return true;
  }

  // 0.2 POST /api/auth/logout - Invalidare sesiune administrator
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const authHeader = req.headers['authorization'] || '';
    const tokenHeader = req.headers['x-admin-token'] || '';
    let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : (authHeader.trim() || String(tokenHeader).trim());
    revokeSessionToken(token);
    sendJson(res, 200, { success: true, message: 'Deconectare reușită' });
    return true;
  }

  // 0.3 GET /api/auth/verify - Verificare stare sesiune administrator
  if (req.method === 'GET' && pathname === '/api/auth/verify') {
    if (await isAuthorizedAdmin(req, urlObj)) {
      sendJson(res, 200, { success: true, authenticated: true });
      return true;
    }
    sendJson(res, 401, { success: false, authenticated: false, error: 'Sesiune neautorizată sau expirată' });
    return true;
  }

  // 0.35 POST & GET /api/superadmin/auth/verify - Verificare Cheie Master SuperAdmin
  if ((req.method === 'POST' || req.method === 'GET') && pathname === '/api/superadmin/auth/verify') {
    if (isAuthorizedSuperAdmin(req)) {
      sendJson(res, 200, {
        success: true,
        authorized: true,
        user: 'ParcOS Master Architect',
        role: 'superadmin',
        timestamp: new Date().toISOString()
      });
      return true;
    }
    sendJson(res, 401, {
      success: false,
      authorized: false,
      error: 'Unauthorized: Invalid SuperAdmin credentials'
    });
    return true;
  }

  return false;
}
