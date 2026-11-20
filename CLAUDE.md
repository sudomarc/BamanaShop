# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: BamanaShop

Demonstration storefront deployed to GitHub Pages at `https://sudomarc.github.io/BamanaShop/`.

### Stack
- Static HTML/CSS/JS (no framework, no build step)
- Deployed via GitHub Pages from `main` branch

### Commands
```bash
# Local preview (any static server)
npx serve .          # or python3 -m http.server
```

### Governance (from AGENTS.md)
- **Identity:** Preserve NovaCreations attribution; Sudomarc = technical maintainer (not brand creator)
- **Canonical URL:** `https://sudomarc.github.io/BamanaShop/` — use for all canonical links, sitemap, JSON-LD
- **No real payments:** This is a demo storefront; do not imply functional checkout
- **Workflow:** Branch + PR to `main`; validate canonical URLs, footer credits, JSON-LD, robots.txt, sitemap before merge
- **SEO:** Unique titles/descriptions per page; no non-canonical URLs in sitemap

### Structure
```
BamanaShop/
├── index.html         # Home page
├── politique.html     # Privacy policy
├── utilisation.html   # Terms of use
├── styles/            # CSS
├── js/                # JavaScript
├── res/               # Resources (images, etc.)
├── robots.txt
├── sitemap.xml
├── AGENTS.md          # Project governance
└── README.md
```

### Verification before merge
1. Parse all changed HTML files
2. Validate canonical URLs match `https://sudomarc.github.io/BamanaShop/`
3. Check footer credits (NovaCreations + Sudomarc)
4. Verify JSON-LD structured data reflects actual site + publisher identity
5. Validate robots.txt and sitemap.xml
6. Inspect final diff