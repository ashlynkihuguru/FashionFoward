// FashionForward: shared data + Studio and Lookbook behavior
const LS = 'ff_looks';
let products = [];
const byId = id => products.find(p => p.id === id);
const money = n => '$' + n.toFixed(2);
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const totalOf = items => Object.values(items).reduce((a, id) => a + ((byId(id) || {}).price || 0), 0);

function getLooks() {
  try { const v = JSON.parse(localStorage.getItem(LS)); return Array.isArray(v) ? v : []; }
  catch (e) { return []; }            // empty or corrupted storage -> start fresh
}
function setLooks(a) {
  try { localStorage.setItem(LS, JSON.stringify(a)); return true; } catch (e) { return false; }
}

function avatarSVG(st, w) {
  const it = st.items || {}, c = k => it[k] && byId(it[k]) ? byId(it[k]).color : null;
  const sk = st.skin, hair = '#2A1712', top = c('top') || sk, bot = c('bottom') || sk, sh = c('shoes') || sk;
  let s = `<svg viewBox="0 0 120 400" width="${w}" height="${Math.round(w * 10 / 3)}" role="img" aria-label="Your avatar">`;
  s += `<path d="M44 30Q44 8 60 8Q76 8 76 30L78 64L42 64Z" fill="${hair}"/>`;
  s += `<path d="M42 84L30 160M78 84L90 160" stroke="${sk}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  s += `<rect x="55" y="48" width="10" height="34" fill="${sk}"/>`;
  s += `<path d="M43 80Q60 90 77 80L75 152Q60 158 45 152Z" fill="${top}" stroke="#1A1210" stroke-width="1"/>`;
  s += `<path d="M45 150L75 150L88 372L63 372L60 200L57 372L32 372Z" fill="${bot}" stroke="#1A1210" stroke-width="1"/>`;
  s += `<ellipse cx="60" cy="34" rx="13" ry="17" fill="${sk}"/><path d="M47 30Q50 14 60 14Q70 14 73 30Q64 22 47 30Z" fill="${hair}"/>`;
  s += `<path d="M30 372L58 372L58 385L26 385ZM62 372L90 372L94 385L62 385Z" fill="${sh}" stroke="#1A1210" stroke-width="1"/>`;
  if (c('eyewear')) s += `<ellipse cx="53" cy="33" rx="6" ry="4" fill="${c('eyewear')}"/><ellipse cx="67" cy="33" rx="6" ry="4" fill="${c('eyewear')}"/>`;
  if (c('jewelry')) s += `<path d="M51 70Q60 92 69 70" fill="none" stroke="${c('jewelry')}" stroke-width="2.5"/>`;
  if (c('bag')) s += `<path d="M80 152h24l-3 30H83z" fill="${c('bag')}" stroke="#1A1210" stroke-width="1.5"/><path d="M85 152q7-16 14 0" fill="none" stroke="#1A1210" stroke-width="2"/>`;
  return s + '</svg>';
}

function initStudio() {
  const $ = id => document.getElementById(id);
  const st = { skin: '#C98F6B', items: {} };
  let cat = 'top', last = null;
  function draw() {
    $('avatar').innerHTML = avatarSVG(st, 170);
    $('total').textContent = money(totalOf(st.items));
    document.querySelectorAll('#tools button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === cat));
    document.querySelectorAll('[data-skin]').forEach(b => b.setAttribute('aria-pressed', b.dataset.skin === st.skin));
    $('tiles').innerHTML = products.filter(p => p.category === cat).map(p =>
      `<button class="tile" data-id="${p.id}" aria-pressed="${st.items[cat] === p.id}"><span class="chip" style="background:${p.color}"></span><strong>${p.name}</strong><span>${p.brand} &middot; ${money(p.price)}</span></button>`).join('');
    const p = last && byId(last);
    $('info').innerHTML = '<div class="eyebrow">Selected piece</div>' + (p
      ? `<h3>${p.name}</h3><p>${p.brand} &middot; ${money(p.price)}</p><a class="pill" href="${p.url}" target="_blank" rel="noopener">&#8599; Visit site</a>`
      : '<p>Click an item to dress your avatar.</p>');
  }
  $('tools').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cat = b.dataset.cat; draw(); } });
  $('tiles').addEventListener('click', e => {
    const b = e.target.closest('.tile'); if (!b) return;
    const id = b.dataset.id, p = byId(id);
    if (st.items[p.category] === id) { delete st.items[p.category]; last = null; }   // click again to remove
    else { st.items[p.category] = id; last = id; }
    draw();
  });
  document.querySelectorAll('[data-skin]').forEach(b => b.addEventListener('click', () => { st.skin = b.dataset.skin; draw(); }));
  $('saveBtn').addEventListener('click', () => {
    if (!Object.keys(st.items).length) { $('msg').textContent = 'Add at least one item before saving.'; return; }
    const looks = getLooks();
    looks.push({ name: $('lookName').value.trim() || 'Untitled look', skin: st.skin, items: { ...st.items }, date: Date.now() });
    $('msg').textContent = setLooks(looks) ? 'Saved! Find it in your lookbook.' : 'Could not save: browser storage is unavailable.';
  });
  draw();
}

function initLookbook() {
  const el = document.getElementById('looks');
  function render() {
    const looks = getLooks();
    if (!looks.length) { el.innerHTML = '<p class="empty">No looks saved yet. <a href="studio.html">Go to the Studio</a> to make your first one.</p>'; return; }
    el.innerHTML = looks.map((l, i) => `<article class="card"><div class="hand">${i + 1}</div><div class="art">${avatarSVG(l, 90)}</div><div class="hand">${esc(l.name)}</div><p><strong>${money(totalOf(l.items))}</strong></p><button class="btn" data-del="${i}">Delete</button></article>`).join('');
  }
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    const looks = getLooks(); looks.splice(+b.dataset.del, 1); setLooks(looks); render();
  });
  render();
}

fetch('products.json').then(r => r.json()).then(d => {
  products = d;
  if (document.getElementById('tiles')) initStudio();
  if (document.getElementById('looks')) initLookbook();
}).catch(() => {
  document.body.insertAdjacentHTML('afterbegin', '<p style="background:#fff;padding:12px;margin:0">Could not load products.json. Open the site with a local server (like VS Code Live Server) or GitHub Pages instead of double-clicking the file.</p>');
});
