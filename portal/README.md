# Education Portal (Education Shell seed)

Static CBSE10 / academy UI served on **yogabrata.com** (`/portal/...`).  
Source of truth moves here from external `101-web` per [docs/phase2/UI_AND_EDUCATION_SHELL.md](../docs/phase2/UI_AND_EDUCATION_SHELL.md).

## Deploy to yogabrata.com (GitHub Pages)

Copy or symlink into the `101-web` / Pages repo:

```text
portal/assets/*           → site root /portal/assets/
portal/education/cbse10/* → /portal/education/cbse10/
```

After deploy, verify:

```bash
curl -sI https://yogabrata.com/portal/assets/academy-forum.js | head -1
curl -sI https://yogabrata.com/portal/education/cbse10/forum.html | head -1
```

## Forum + Sahadeva fix (Jun 2026)

| Issue | Fix |
|-------|-----|
| Forum scripts 404 | `forum.html` used `../../assets/` → must be `../../../assets/` |
| `portal.css` 404 | Same path fix |
| Misleading guest login | Removed `yoga/yoga` sign-in banner |
| Static Sahadeva card | `sahadeva-assistant.js` → live chat via `/education/actors/chat` |

## Files

| Path | Role |
|------|------|
| `education/cbse10/forum.html` | Discussion forum page |
| `assets/academy-forum.js` | Thread list loader |
| `assets/sahadeva-assistant.js` | Sidebar AI assistant |
| `assets/academy-config.js` | SKU routes + API base |
| `assets/portal.js` | Open portal navigation |

Forum data remains at `/portal/data/cbse10-forum.json` on the Pages host.
