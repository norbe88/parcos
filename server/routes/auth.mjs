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
  normalizeSlug
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
    const isParcosContext = reqTenant === 'parcos' || rawHost.includes('parcos.ro');

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
            error: 'Parola introdusă este parola de showroom. Pe consola SuperAdmin ParcOS este necesară parola de platformă (Olaf.0311).'
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
    // 2.1 Verificare Master SuperAdmin Override pe showroom (Olaf.0311 funcționează ca master key)
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

    // 2.2 Verificare Parolă Showroom Admin (Luna.RXM)
    let isDealerMatch = false;
    try {
      isDealerMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(ADMIN_PASSWORD_HASH));
    } catch {
      isDealerMatch = (inputHash === ADMIN_PASSWORD_HASH);
    }

    if (!isDealerMatch) {
      sendJson(res, 401, {
        success: false,
        error: 'Parolă incorectă. Accesul este rezervat exclusiv administratorilor showroom-ului.'
      });
      return true;
    }

    const dealerToken = generateSessionToken('dealer_admin');
    sendJson(res, 200, {
      success: true,
      token: dealerToken,
      role: 'dealer_admin',
      dealerSlug: reqTenant || 'rxm',
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
    if (isAuthorizedAdmin(req)) {
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
