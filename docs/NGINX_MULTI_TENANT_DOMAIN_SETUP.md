# ParcOS Multi-Tenant Nginx Edge Routing & Domain Mapping
> **Platformă:** ParcOS (Dealership Operating System) & RXM Automobile  
> **Server Țintă:** Netcup VPS (`152.53.158.65`) — Ubuntu 22.04 LTS  
> **Data:** Octombrie 2026  
> **Statut:** Producție & Multi-Tenant Onboarding  

---

## 1. Arhitectură & Principii Invariante

### ⚠️ Invariante Stricte de Infrastructură
1. **STRICT Netcup VPS (`152.53.158.65`):** Toate containerele ParcOS (`rxm_showroom`, `rxm-api`, `rxm-postgres`), domeniul principal `parcos.ro`, site-ul fondator `rxmautomobile.ro` și toate domeniile dealerilor SaaS sunt găzduite **exclusiv pe Netcup VPS**.
2. **Izolare Hetzner VPS (`204.168.200.48`):** Hetzner găzduiește exclusiv AutoLicit.ro / Carvana Holding. Niciun domeniu sau container ParcOS nu rulează pe Hetzner.
3. **Container Unic Multi-Tenant:** Toate domeniile dealerilor (`rxmautomobile.ro`, `mpiauto.ro`, `dealers.parcos.ro`) sunt direcționate către **același container Docker** ParcOS (port `5173` sau `3001`). Diferențierea identității, brandingului, inventarului și temei vizuale se face la runtime pe baza domeniului și a antetului `X-Dealer-Slug`.
4. **Calcul Financiar 21% TVA & Garanție:** Toate tenanturile afișează strict `VAT_RATE = 0.21` (TVA deductibil 21%) și terminologia **„Cont de Garanție”** (fără termeni neautorizați).

```
   [ Client Browser ]
           │
           ▼
[ Cloudflare Edge / DNS ]
           │
           ▼
[ Netcup VPS 152.53.158.65:443 (Nginx) ]
           │
           ├── Host: rxmautomobile.ro  ──► Injectează: X-Dealer-Slug: rxm
           ├── Host: mpiauto.ro        ──► Injectează: X-Dealer-Slug: mpi_auto
           ├── Host: *.parcos.ro       ──► Injectează: X-Dealer-Slug: (subdomeniu)
           └── Host: parcos.ro         ──► Fără slug fix (Hub SaaS & SuperAdmin)
           │
           ▼
[ Docker Container: parcos_showroom (127.0.0.1:5173) ]
           │
           ├── Backend: /api/tenant-config (Rezolvă dealer din Host sau X-Dealer-Slug)
           └── Frontend: React SPA (Aplică tema, layout-ul și datele tenantului)
```

---

## 2. Tabel de Mapare Domenii & Chiriași Activi

| Slug Tenant | Nume Dealer | Domeniu Public | Tip Certificat SSL | Netcup Proxy Port | Rol / Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `rxm` | **RXM Automobile** | `rxmautomobile.ro`<br>`www.rxmautomobile.ro` | Let's Encrypt / Cloudflare | `127.0.0.1:5173` | Flagship Showroom / Producție |
| `mpi_auto` | **MPI Auto Cluj** | `mpiauto.ro`<br>`www.mpiauto.ro` | Let's Encrypt / Cloudflare | `127.0.0.1:5173` | Dealer SaaS Pro / Activ |
| `top_auto` | **Top Auto Transilvania** | `topautotransilvania.ro` | Let's Encrypt / Cloudflare | `127.0.0.1:5173` | Dealer SaaS Enterprise / Activ |
| `autonord_cluj` | **AutoNord Cluj** | `autonord.ro` | Let's Encrypt / Cloudflare | `127.0.0.1:5173` | Dealer SaaS Starter / Staging |
| `parcos` | **ParcOS Platform** | `parcos.ro`<br>`www.parcos.ro` | Cloudflare Edge SSL | `127.0.0.1:5173` | SaaS Landing & SuperAdmin Hub |
| `*` | **Subdomenii Demo** | `*.parcos.ro` | Wildcard Let's Encrypt | `127.0.0.1:5173` | Sandbox / Prezentări Parcuri |

---

## 3. Template Blocuri Nginx (`/etc/nginx/sites-available/`)

### A. Dealer Fondator: `rxmautomobile.ro` (`/etc/nginx/sites-available/rxmautomobile.ro`)

```nginx
# HTTP Redirection to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name rxmautomobile.ro www.rxmautomobile.ro;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Virtual Host
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name rxmautomobile.ro www.rxmautomobile.ro;

    # SSL Certificates (Let's Encrypt sau Cloudflare Origin)
    ssl_certificate /etc/letsencrypt/live/rxmautomobile.ro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rxmautomobile.ro/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Gzip & Performanță Asset-uri
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Securitate & Headers Edge
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rădăcină Aplicație ParcOS Showroom
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;

        # WebSocket Support (pentru live updates & hot-reload în stage)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Forwarding Headers Standard
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 🎯 REZOLVARE TENANT LA EDGE PENTRU PARCOS:
        proxy_set_header X-Dealer-Slug rxm;

        # Timeout-uri generoase pentru operațiuni de import / OCR
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # Cache agresiv pentru imagini și fonturi statice
    location ~* \.(jpg|jpeg|png|webp|svg|ico|woff2|woff|ttf)$ {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Dealer-Slug rxm;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

### B. Dealer Partener SaaS: `mpiauto.ro` (`/etc/nginx/sites-available/mpiauto.ro`)

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name mpiauto.ro www.mpiauto.ro;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mpiauto.ro www.mpiauto.ro;

    ssl_certificate /etc/letsencrypt/live/mpiauto.ro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mpiauto.ro/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 🎯 Rezoluție Edge pentru MPI Auto:
        proxy_set_header X-Dealer-Slug mpi_auto;
    }
}
```

---

### C. Platforma Hub Central & SuperAdmin: `parcos.ro` (`/etc/nginx/sites-available/parcos.ro`)

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name parcos.ro www.parcos.ro;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name parcos.ro www.parcos.ro;

    ssl_certificate /etc/letsencrypt/live/parcos.ro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/parcos.ro/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Pe parcos.ro NU setăm un X-Dealer-Slug forțat.
        # Aplicația deschide pagina de SaaS prezentare & SuperAdmin Hub,
        # permițând comutarea între dealeri prin ?dealer=<slug>.
    }
}
```

---

### D. Subdomenii Wildcard pentru Demo & Sandbox: `*.parcos.ro`

```nginx
server {
    listen 80;
    server_name ~^(?<subdomain>.+)\.parcos\.ro$;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ~^(?<subdomain>.+)\.parcos\.ro$;

    ssl_certificate /etc/letsencrypt/live/parcos.ro-wildcard/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/parcos.ro-wildcard/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Trimite subdomeniul extras ca dealer slug
        proxy_set_header X-Dealer-Slug $subdomain;
    }
}
```

---

## 4. Mecanismul de Transmitere Edge ➔ Frontend

1. **La nivel de Nginx Edge:**  
   Blocul virtual host injectează antetul HTTP `X-Dealer-Slug: <slug>`.
2. **La nivel de Backend API (`/api/tenant-config`):**  
   Rutina `resolveTenant(req, urlObj)` din [`server/api.mjs`](file:///c:/Projects/parcos/server/api.mjs) citește `req.headers['x-dealer-slug']` și returnează obiectul `dealer` specificat.
3. **La nivel de Frontend SPA (`TenantContext.tsx`):**  
   Funcția `detectInitialTenant()` verifică în ordine:
   - **Prioritate 0:** Tagul `<meta name="x-dealer-slug" content="...">` injectat server-side.
   - **Prioritate 1:** Parametrul query URL `?dealer=<slug>` (activ în modul SuperAdmin / testare).
   - **Prioritate 2:** Subdomeniul curent (`hostname`).
   - **Prioritate 3:** `localStorage('rxm_tenant_id')`.
   - **Fallback:** `rxm`.
4. **La nivel de SEO & Social Media (`seoTenantInjector.ts`):**  
   Funcția `updateSeoMetadata(tenant)` injectează dinamic meta description, canonical URL (`https://{tenant.domain}/`), OpenGraph cards și JSON-LD `@type: "AutoDealer"`.

---

## 5. Ghid Operațional: Comenzi pe Netcup VPS (`152.53.158.65`)

### Conectare SSH:
```bash
ssh root@152.53.158.65
```

### Activare site nou de dealer:
```bash
# 1. Creează fișierul de configurare
nano /etc/nginx/sites-available/mpiauto.ro

# 2. Activează link-ul simbolic în sites-enabled
ln -s /etc/nginx/sites-available/mpiauto.ro /etc/nginx/sites-enabled/

# 3. Validare sintaxă Nginx (MANDATORIU înainte de reload)
nginx -t

# 4. Generare certificat SSL Let's Encrypt
certbot --nginx -d mpiauto.ro -d www.mpiauto.ro --non-interactive --agree-tos --email office@carvana.ro

# 5. Reîncărcare Nginx fără întrerupere de trafic
systemctl reload nginx
```

### Verificare Live via cURL:
```bash
# Verificare răspuns și antet Nginx
curl -I https://rxmautomobile.ro/
curl -I https://mpiauto.ro/

# Verificare API config cu slug
curl -s https://mpiauto.ro/api/tenant-config | jq .dealer.name
```
