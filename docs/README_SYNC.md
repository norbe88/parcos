# 🔄 ParcOS — Ghid Sincronizare Repo Multi-Node (Zety ⟷ Desy)
> **Data & Ora:** 2026-10-26 01:31:00  
> **Holding Hub:** CARVANA SRL (`08_PROJECT_PARCOS`)  
> **Google Drive Transit:** `I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync`  

---

## 🖥️ Topologie Noduri & Căi Locale

| Nod | Dispozitiv | Rol | Cale Locală |
|---|---|---|---|
| **`Zety`** | HP ZBook Workstation (`zbook-norby`) | Feature Dev, Showroom, Testing | `C:\Projects\parcos` |
| **`Desy`** | High-Power Desktop (`Desktop-Norby`) | Master Dev, GPU, Build & QA | `C:\project\Parcos` |

---

## 🚀 Cum folosești sincronizarea pe DESY (Desktop)

### Pasul 1: Sincronizare repo pe Desy
Deschide acest folder în File Explorer pe **Desy**:
`I:\My Drive\CARVANA_SRL\08_PROJECT_PARCOS\Repo_Sync\`
Și dă dublu-click pe:
👉 **`SYNC_TO_DESY.bat`**

Scriptul va copia automat întregul repository în **`C:\project\Parcos`** (inclusiv configurațiile `.env`, `.agents`, istoricul git, branch-ul activ).

### Pasul 2: Prima pornire pe Desy (dacă e clonat pentru prima oară)
Deschide un terminal (PowerShell sau CMD) pe Desy:
```cmd
cd /d C:\project\Parcos
npm install
npm run dev
```

---

## 🔁 Sincronizare Inversă (Când lucrezi pe Desy și vrei să trimiți pe Zety)

1. **Pe Desy:** Dă dublu-click pe **`SYNC_DESY_TO_GDRIVE.bat`**  
   *(Va încărca fișierele modificate pe Google Drive)*
2. **Pe Zety:** În rădăcina proiectului `C:\Projects\parcos`, dă dublu-click pe **`SYNC_GDRIVE_TO_ZETY.bat`**  
   *(Va descărca modificările în `C:\Projects\parcos`)*

---

## 🛡️ Protecții Invariante Robocopy Active

- **Protecție `node_modules`:** `node_modules` este exclus de la tranzitul Google Drive (economisește sute de MB și zeci de mii de fișiere). Pe fiecare mașină, `node_modules` rămâne intact și nu este șters de comanda `/MIR`.
- **Protecție `.env`:** Variabilele locale de mediu (`.env`) sunt incluse în sincronizare, astfel încât cheile R2, credențialele DB și configurările sunt identice pe ambele mașini.
- **Protecție Anti-Hang:** Parametrii `/R:2 /W:2` asigură că Robocopy nu se blochează dacă un fișier este temporar deschis într-un editor.
