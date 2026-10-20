# Checklist Conectivitate, Drepturi & Mediu de Teren — Nod Zeti (HP ZBook)
> **Data & Ora:** 2026-10-09 14:30:00
> **Platform Persona:** Mao (Holding Distributed Architect)
> **Hardware Node:** `Node-ZBook` / `Node-Zety` (HP ZBook Workstation)

Acest document verifică și ghidează pregătirea nodului **Zeti** înainte de a merge pe teren la întâlnirea cu RXM Automobile (sau alți clienți B2B).

---

## 🌐 1. Conectivitate & Rețea (Calumea Net & Holding Mesh)

| Canal / Serviciu | Stare Necesitată | Verificare / Comandă |
|---|---|---|
| **Calumea Net (Tailscale/VPN)** | Conectat activ | `tailscale status` -> verifică prezența nodurilor `Desktop-Norby`, `Laptop-Mao`, `VPS-Linux-Production` |
| **Slack Mesh Daemon** | Ingestie activă | Verifică dacă `slack-mesh-daemon.mjs` rulează pentru a primi instrucțiuni în timp real din `#ag-agent` |
| **Google Drive Mount** | Montat pe litera `I:` | Verifică accesul la `I:\My Drive\CARVANA_SRL\` |

---

## 🔑 2. Drepturi & Acces VPS (Coolify / Hetzner)

- **SSH Access la VPS (`Vima` - 204.168.200.48):**
  - Cheia SSH privată a lui ZBook trebuie să fie în `~/.ssh/authorized_keys` pe VPS.
  - Test rapid: `ssh root@204.168.200.48` (trebuie să intre fără parolă).
- **Coolify API / Web Panel:**
  - Acces la panoul Coolify (`http://204.168.200.48:8000` sau domeniu securizat).
  - Verificat permisiunile de editare variabile și comenzi de build.
- **Cloudflare DNS Management:**
  - Token Cloudflare cu drepturi `Zone:DNS:Edit` disponibil în `.env` sau browser.

---

## 💻 3. Mediu Local Offline-Resilient (Zero-Fail pe Teren)

Pe teren (la biroul sau showroom-ul dealerului) este posibil ca conexiunea Wi-Fi să fie lentă sau indisponibilă. ZBook trebuie să funcționeze **100% autonom**:

1. **Repo sincronizat pe `main`:**
   ```bash
   git pull origin main
   ```
2. **Dependencies instalate & Build verificat:**
   ```bash
   npm install
   npx tsc --noEmit
   ```
3. **Pornire Demo Local:**
   ```bash
   npm run dev
   ```
   Site-ul este accesibil instant la `http://localhost:5000` cu baza de date locală și imaginile stadiate din `staged_imports/rxm_automobile/`, indiferent dacă există conexiune la internet.

---

## 📋 4. Comandă de Preluare Sarcină pe Zeti:

Când pornești ZBook în sesiune de lucru, tastează direct:
```bash
/takeover-n
```
sau deschide fișierele din:
`I:\My Drive\CARVANA_SRL\06_PROJECTS_EXTERNAL_CLIENTS\RXM_Automobile\`
