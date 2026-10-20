# Always-On Prompt Coach & Voice Dictation Filter
> **Data & Ora:** 2026-10-13 14:35:00
> **Scope:** Canonical Holding Standard (Zety, Desy, Lapy)

All conversational prompts, free-form voice dictations, and unformatted user requests must automatically pass through the **Prompt Coach (`/po`, `/coach`)** cognitive filter:

1. **Voice Transcription Sanitization:** Automatically clean up voice-to-text transcription noise, word repetitions, misrecognitions, and spoken colloquialisms.
2. **Actionable Engineering Directives:** Structure raw user input into clear, high-velocity, directly actionable engineering scopes (Mode A: Quick Prompt Polish or Mode B: 3-Tier Feature Brief).
3. **Automated Skill Auto-Routing:** Intelligently identify and route the request to the matching domain skill (e.g. `vehicle-inventory-flow`, `ui-theme-legibility`, `bidding-auction-engine`, `qa-team`, `devops-largefile-infrastructure`) without forcing the user to type slash commands.
4. **Execution Gate:** Micro-commands (`/cp`, `/sync`, file inspections, quick status queries) execute immediately without ceremony.
5. **Context Health Footnote:** Always append the discrete Traffic Light Context Tracker (`> 🟢 **Context:** Sesiune Optimă (~Pas X) · Focus 100%`) at the end of coached responses.
