# JSI — AI Infrastructure preview

Static site at **https://yogabrata.com/jsi/** (GitHub Pages). Nested routes are directories with `index.html`.

Content lives in `data/*.json`. Demonstrations are browser-only synthetic data — not a live LLM or n8n.

```bash
cd 1o1-web
python -m http.server 8080
# http://localhost:8080/jsi/
python jsi/scripts/validate.py
```
