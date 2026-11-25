# Newspaper studio

Plain ES modules, no build step. Work is stored in the browser (IndexedDB `brahmexa-newspaper-v1`).

- `engine.js` page model: 12 x 24 grid, boxes, designs, splitting, resizing, continuing, migration, backups. No DOM. Tests: `node --test newsroom/studio/`
- `flow.js` lays text out at true print size, splits it between a story's boxes, renders pages and prints
- `app.js` the four steps: Stories, Design pages, Place stories, Check & print
- `samples.js`, `library.js` fictional stories (printed with a label). Library: Hooghly, Howrah, Kolkata, plus one-, two- and three-page stories
- `social.js` social cards, uploads

A story continues by putting its id on a second box. Boxes are read in page order, so "continued on page N" always points forward.

Saved work is written to key `state-v2`. The earlier studio's `state` key is read once and never changed. Backups still carry `edition.items`, so the Brahmexa CSR copy can restore them.

When releasing, change the `?v=` number in every file that has one, and the cache name in `sw.js`.
