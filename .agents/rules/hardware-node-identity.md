# Canonical Hardware Node Identities (CARVANA SRL Mesh)

> **Regulă Permanentă de Identitate Hardware:**
> Fiecare mașină fizică din rețeaua holding are o identitate unică și bine definită:

| Hostname OS | Alias Holding | Tip Hardware | Rol Principal |
|---|---|---|---|
| **`zbook-norby`** | **`Zety`** | **HP ZBook Workstation Laptop (mașina curentă)** | Feature Dev, Showroom Client Projects (RXM), Dealer Onboarding |
| **`Desktop-Norby`** | **`Desy`** | PC Desktop Workstation (GPU RTX) | GPU Render DaVinci Resolve, AutoLicit Master, Video Reels |
| **`Laptop-Mao`** | **`Lapy`** | Laptop secundar | AutoLit Node, Feature Dev secundar |
| **`Node-Samy`** | **`Samy`** | Samsung Galaxy A51 (Termux ARM64) | Scraping Worker, Proxy rezidențial |
| **`152.53.158.65`** | **`Vima`** | Netcup Cloud VPS (Docker / Coolify) | Traefik, Directus CMS, Production Web |

### Reguli de Plic Slack / Inter-Agent Mesh:
- Când transmiți mesaje de pe această mașină (`zbook-norby`), folosește întotdeauna:
  `FROM: Zety (zbook-norby)` (NU `Laptop-Mao`, NU `Lapy`).
- `Laptop-Mao` este aliasul istoric pentru `Lapy`.
