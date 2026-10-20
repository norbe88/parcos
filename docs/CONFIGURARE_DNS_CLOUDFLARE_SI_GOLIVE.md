# Ghid Tehnic de Go-Live, Configurare DNS Cloudflare & Automatizare Nod S9
> **Data & Ora:** 2026-10-10 11:25:00  
> **Target VPS Producție:** `152.53.158.65` (Coolify v4 / Traefik Reverse Proxy)  
> **Domeniu Țintă:** `rxmautomobile.ro` (sau `rxmauto.ro` / subdomeniu `autolit.ro/rxm`)  
> **Arhitectură:** Docker Container + Cloudflare Edge CDN + S9 GSM Mobile Edge Worker  

---

## 🌐 1. Configurare Cloudflare DNS (Edge & SSL)

### 1.1 Înregistrare & Mapare Înregistrări DNS (Zone: `rxmautomobile.ro`)

În panoul Cloudflare (contul CARVANA SRL), se adaugă sau se confirmă următoarele înregistrări:

| Tip | Nume | Conținut / Țintă | Proxy Status | TTL | Scop |
|:---:|:---:|:---:|:---:|:---:|:---|
| **A** | `@` (root) | `152.53.158.65` | 🟧 **Proxied** | Auto | Rutare domeniu principal către VPS Traefik |
| **CNAME** | `www` | `rxmautomobile.ro` | 🟧 **Proxied** | Auto | Redirecționare www |
| **CNAME** | `staging` | `152.53.158.65` | 🟧 **Proxied** | Auto | Mediu de previzualizare & testare |

### 1.2 Reguli de Securitate & SSL / TLS:
- **Criptare SSL/TLS:** Setat pe **Full (Strict)**;
- **Always Use HTTPS:** Activat (Redirect automat de la HTTP la HTTPS);
- **HTTP/3 & 0-RTT:** Activat pentru încărcare ultra-rapidă pe rețele mobile 4G/5G;
- **Cache Level:** *Standard* cu *Bypass Cache on Cookie* pentru ruta `/admin`.

---

## 🐳 2. Configurare Coolify v4 & Docker Compose

### 2.1 Structura Fișierului `docker-compose.yml` de Producție:

```yaml
version: '3.8'

services:
  rxm-showroom:
    image: node:20-alpine
    container_name: rxm-automobile-showroom
    restart: unless-stopped
    working_dir: /app
    volumes:
      - ./dist:/app/dist:ro
      - ./public/data:/app/public/data:ro
    environment:
      - NODE_ENV=production
      - PORT=3000
    command: npx serve -s dist -l 3000
    networks:
      - coolify
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rxm-web.rule=Host(`rxmautomobile.ro`) || Host(`www.rxmautomobile.ro`)"
      - "traefik.http.routers.rxm-web.entrypoints=websecure"
      - "traefik.http.routers.rxm-web.tls=true"
      - "traefik.http.routers.rxm-web.tls.certresolver=letsencrypt"
      - "traefik.http.services.rxm-web.loadbalancer.server.port=3000"

networks:
  coolify:
    external: true
```

---

## 📱 3. Interval & Automatizare Verificare OLX (Nodul Mobil S9 / Samy)

### 3.1 Intervalul Optim de Verificare (Zero Ban pe Cartelă SIM):
Pentru un parc auto de 10-30 mașini, cererile nu trebuie trimise des:
- **Interval între rulări complete:** **2 – 4 ore** (sau de 3 ori pe zi: `09:00`, `14:00`, `19:00`);
- **Pauză umană (Jitter) între vehicule consecutive:** **3.0s – 5.0s** cu User-Agent mobil;
- **Protocol de citire:** Cerere `HEAD` prin `curl -I` (descarcă doar antetele HTTP, fără imagini sau HTML, consumând sub 2 KB per mașină).

### 3.2 Programare Cron pe Nodul S9 (prin Termux sau Node Script):

Comanda de rulare în Termux pe telefonul S9 Rack:
```bash
# Rulare programată la fiecare 3 ore în intervalul 08:00 - 20:00
0 9,12,15,18,21 * * * cd /data/data/com.termux/files/home/s9-worker && node s9_gentle_olx_checker.cjs >> sync.log 2>&1
```

La finalizarea fiecărei rulări, fișierul `olx_live_status.json` este sincronizat automat cu folderul `public/data/` al site-ului prin webhook HTTP sau Google Drive Holding mount.

---

## ✅ 4. Checklist Tehnic de Validare Finală (Pre-Launch)

- [ ] Domeniul `rxmautomobile.ro` rezolvă către Cloudflare;
- [ ] Certificatul SSL este valid (lacăt verde în browser);
- [ ] Galeria foto Lightbox deschide pozele la rezoluție maximă în sub o secundă;
- [x] Panoul Admin este izolat pe ruta securizată `/admin` (protejat prin ecran de autentificare cu parolă);
- [ ] Tab-ul `Sincronizare OLX` afișează corect ultimul snapshot al nodului S9;
- [ ] Formularul de programare test drive trimite corect evenimentul în calendar.
