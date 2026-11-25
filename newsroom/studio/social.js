/** Social cards and file downloads. */
export function download(data, name, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export const FORMATS = { 'Instagram Portrait': [1080, 1350], 'Instagram Square': [1080, 1080], 'Instagram Story': [1080, 1920], 'Facebook Landscape': [1080, 566], 'WhatsApp Card': [1080, 1080], 'YouTube Thumbnail': [1080, 608] };
const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(Error('A photograph could not be loaded.')); i.src = src; });

export async function socialCard(story, publicationName, format) {
  await document.fonts.load('700 44px Bengali');
  const [W, H] = FORMATS[format] || FORMATS['Instagram Square'], small = H < 800;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f4f1e9'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#174e42'; g.fillRect(0, 0, W, small ? 105 : 140);
  g.fillStyle = '#fff'; g.font = 'bold 38px Bengali'; g.fillText(publicationName, 50, small ? 67 : 88, 980);
  let y = small ? 145 : 195;
  const m = (story.media || []).find(x => x.type.startsWith('image/'));
  if (m) {
    const i = await load(m.url), max = small ? 130 : 380, k = Math.min(980 / i.width, max / i.height);
    g.drawImage(i, 50 + (980 - i.width * k) / 2, y, i.width * k, i.height * k);
    y += max + 35;
  }
  const wrap = size => {
    g.font = `bold ${size}px Bengali`;
    const out = []; let line = '';
    for (const w of story.title.split(/\s+/)) {
      if (line && g.measureText(line + ' ' + w).width > 980) { out.push(line); line = w; } else line += (line ? ' ' : '') + w;
    }
    return line ? [...out, line] : out;
  };
  let size = small ? 38 : 52, lines = wrap(size);
  while (lines.length * size * 1.55 > H - y - 95 && size > 26) lines = wrap(size -= 2);
  g.fillStyle = '#192d28'; g.font = `bold ${size}px Bengali`;
  for (const l of lines) { g.fillText(l, 50, y + size, 980); y += size * 1.55; }
  g.fillStyle = '#64716a'; g.font = '22px Bengali';
  g.fillText(story.demo ? 'কাল্পনিক নমুনা • প্রকাশযোগ্য সংবাদ নয়' : [story.byline, story.location].filter(Boolean).join(' • '), 50, H - 40, 980);
  const blob = await new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(Error('Image export failed.')), 'image/png'));
  download(blob, `story-${story.id}-${format.toLowerCase().replaceAll(' ', '-')}.png`);
}

/** Read an upload; photographs are brought down to print size so the workspace stays quick. */
export async function readMedia(file) {
  if (file.size > 15 * 1024 * 1024) throw Error('Each file must be below 15 MB.');
  if (!/^(image\/(jpeg|png|webp)|audio\/|video\/mp4)/.test(file.type)) throw Error('Use JPG, PNG, WebP, audio or MP4.');
  const raw = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = no; r.readAsDataURL(file); });
  if (!file.type.startsWith('image/')) return { type: file.type, url: raw };
  const i = await load(raw), max = 2400, k = Math.min(1, max / Math.max(i.width, i.height));
  if (k === 1 && file.size < 1.5e6) return { type: file.type, url: raw };
  const c = document.createElement('canvas');
  c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.drawImage(i, 0, 0, c.width, c.height);
  return { type: 'image/jpeg', url: c.toDataURL('image/jpeg', 0.88) };
}
