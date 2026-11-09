import {sarees, blouses, accessories, rack, products, moods, bridal, reels} from './catalog.js';

const byId = id => document.getElementById(id);
const money = new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', maximumFractionDigits:0});
const price = amount => money.format(amount);
const salePrice = item => item.offer ? Math.round(item.price * (100 - item.offer) / 100) : item.price;
const image = (item, view = item.model ? 'model' : 'front', alt = '') =>
  `<img src="assets/${item.id}-${view}.webp" alt="${alt}" loading="lazy" draggable="false">`;
const icons = {
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.8-7.6 1.1-1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  bag:'<path d="M5 8h14l2 13H3L5 8Z"/><path d="M9 10V6a3 3 0 1 1 6 0v4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const filterNames = ['All pieces','Silk Sarees','Half Sarees','Blouses','Checked Sarees','Zari & Brocade'];
const sizes = ['34','36','38','40','42'];
const groups = {looks:sarees, reels, bridal};
const active = {looks:2, reels:2, bridal:2};
const compare = [sarees[5], sarees[1], sarees[2]];
const productDialog = byId('product-dialog');
const drawer = byId('drawer');
const reelDialog = byId('reel-dialog');
const film = byId('film');
const storageKey = 'saaree-store:v1';
let filter = 'All pieces';
let selectedWeave = 0;
let detail;
let drawerType;
let reelTimer;
let toastTimer;

function readState() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    return {
      saved: [...new Set((value?.saved ?? []).filter(id => Object.hasOwn(products, id)))],
      bag: (value?.bag ?? []).filter(row => Object.hasOwn(products, row.id) &&
        Number.isSafeInteger(row.quantity) && row.quantity > 0 && row.quantity <= 99 &&
        (row.size === '' || sizes.includes(row.size)) && typeof row.bundle === 'boolean'),
    };
  } catch {
    return {saved:[], bag:[]};
  }
}
const state = readState();

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Session state stays usable. */ }
  updateCounts();
}

function notify(message) {
  const node = byId('toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 2200);
}

function updateCounts() {
  const counts = {wishlist:state.saved.length, bag:state.bag.reduce((sum, row) => sum + row.quantity, 0)};
  for (const [id, count] of Object.entries(counts)) {
    const node = byId(`${id}-count`);
    node.hidden = count === 0;
    node.textContent = count;
    node.parentElement.setAttribute('aria-label', `${id === 'bag' ? 'Shopping bag' : 'Wishlist'}, ${count} items`);
  }
}

function actionButton(action, item, glyph, label, extraClass = '') {
  return `<button class="circle ${extraClass}" data-action="${action}" data-id="${item.id}" aria-label="${label} ${item.name}">${icon(glyph)}</button>`;
}

function heart(item) {
  const saved = state.saved.includes(item.id);
  return `<button class="circle heart${saved ? ' is-saved' : ''}" data-action="save" data-id="${item.id}" aria-label="Save ${item.name}" aria-pressed="${saved}">${icon('heart')}</button>`;
}

function toggleSaved(item) {
  const saved = !state.saved.includes(item.id);
  state.saved = saved ? [...state.saved,item.id] : state.saved.filter(id => id !== item.id);
  persist();
  for (const button of document.querySelectorAll(`[data-action="save"][data-id="${item.id}"]`)) {
    button.classList.toggle('is-saved', saved);
    button.setAttribute('aria-pressed', saved);
  }
  if (drawer.open && drawerType === 'wishlist') renderDrawer();
  notify(saved ? `${item.name} saved` : `${item.name} removed from wishlist`);
}

function pushToBag(item, size = '', bundle = false) {
  const row = state.bag.find(entry => entry.id === item.id && entry.size === size && entry.bundle === bundle);
  if (row) row.quantity = Math.min(99, row.quantity + 1);
  else state.bag.push({id:item.id, size, bundle, quantity:1});
}

const bagPrice = (item, bundle) => bundle ? Math.round(salePrice(item) * .9) : salePrice(item);

function addToBag(item) {
  if (item.category === 'Blouses') {
    openProduct(item.id, [item], 'drawer');
    return;
  }
  pushToBag(item);
  persist();
  if (drawer.open) renderDrawer();
  notify(`${item.name} added to bag`);
}

function getLook() {
  return [sarees[active.looks], blouses[active.looks % blouses.length], ...accessories];
}

function thumb(item) {
  return `<span class="thumb" aria-hidden="true">${item.symbol ?? image(item, 'front')}</span>`;
}

function carouselItems(group) {
  const items = groups[group];
  return [-2,-1,0,1,2].map(offset => {
    const index = (active[group] + offset + items.length) % items.length;
    return {item:items[index], index, offset, distance:Math.abs(offset)};
  });
}

function carouselStyle({offset, distance}) {
  return `style="--offset:${offset};--distance:${distance}"`;
}

function renderLooks() {
  byId('look-stage').innerHTML = carouselItems('looks').map(({item,index,offset,distance}) =>
    `<button class="look-model" ${carouselStyle({offset,distance})} data-action="select" data-group="looks" data-index="${index}" aria-label="${item.name}" aria-pressed="${offset === 0}">${image(item)}</button>`
  ).join('');
  const look = getLook();
  byId('look-counter').textContent = `${active.looks + 1} of ${sarees.length} · ${look[0].name}`;
  const subtotal = look.reduce((sum,item) => sum + salePrice(item),0);
  const total = look.reduce((sum,item) => sum + bagPrice(item,true),0);
  byId('look-panel').innerHTML = `<p class="eyebrow">THE COMPLETE DRAPE</p><h3>In this look</h3>${look.map(item =>
    `<div class="piece">${thumb(item)}<div><strong>${item.name}</strong><small>${price(salePrice(item))}</small></div>${heart(item)}${actionButton('add',item,'plus','Add')}</div>`
  ).join('')}<div class="bundle"><span>Bundle · 10% off</span><strong><s>${price(subtotal)}</s> ${price(total)}</strong></div>
    <label class="bundle-size">Blouse size <select id="bundle-size"><option value="">Choose size</option>${sizes.map(size => `<option>${size}</option>`).join('')}</select></label>
    <button class="pill primary" data-action="bundle">Add full look to bag ↗</button>`;
}

function renderSilks() {
  byId('silk-strip').innerHTML = sarees.map((item,index) =>
    `<article class="silk-card" style="--card:${item.color};--angle:${(index - 3.5) * 1.6}deg">
      <button class="silk-product" data-action="product" data-source="silks" data-id="${item.id}" aria-label="View ${item.name}">
        <strong>${item.name}</strong>${image(item)}<small>${price(salePrice(item))}</small>
      </button>${heart(item)}${actionButton('add',item,'plus','Add','plus')}
    </article>`
  ).join('');
}

function matchesFilter(item, name = filter) {
  return name === 'All pieces' || item.category === name || item.tags.includes(name);
}

function filteredRack() {
  return rack.filter(item => matchesFilter(item));
}

function renderRack() {
  byId('filters').innerHTML = filterNames.map(name =>
    `<button class="filter" data-action="filter" data-filter="${name}" aria-pressed="${filter === name}">${name} <small>${rack.filter(item => matchesFilter(item,name)).length}</small></button>`
  ).join('');
  const pieces = filteredRack();
  byId('rack-items').innerHTML = pieces.map(item =>
    `<button class="hanger" data-action="product" data-source="rack" data-id="${item.id}">
      ${image(item,'front')}<strong>${item.name}</strong><small>${price(salePrice(item))}</small>
    </button>`
  ).join('');
  byId('rack-count').textContent = `Explore the collection · ${pieces.length} ${pieces.length === 1 ? 'piece' : 'pieces'} · AI-generated studio imagery`;
}

function renderReels() {
  byId('reel-arc').innerHTML = carouselItems('reels').map(({item,index,offset,distance}) =>
    `<button class="reel-card" ${carouselStyle({offset,distance})} data-action="${offset === 0 ? 'play' : 'select'}" data-group="reels" data-index="${index}" aria-label="${offset === 0 ? 'Play' : 'Select'} ${item.title}">
      ${image(item.product)}<span class="reel-meta"><span>0${index+1}</span><span>0:06</span></span>
      ${offset === 0 ? '<span class="reel-play" aria-hidden="true">▶</span><span class="reel-progress" aria-hidden="true"></span>' : ''}
      <span class="reel-caption"><small>${item.product.fabric}</small><strong>${item.title}</strong><small>${item.scene}</small></span>
    </button>`
  ).join('');
}

function renderBridal() {
  byId('bridal-arc').innerHTML = carouselItems('bridal').map(({item,index,offset,distance}) =>
    `<button class="bridal-card" ${carouselStyle({offset,distance})} data-active="${offset === 0}" data-action="${offset === 0 ? 'product' : 'select'}" data-source="bridal" data-group="bridal" data-id="${item.id}" data-index="${index}" aria-label="${offset === 0 ? 'View' : 'Select'} ${item.name}">
      ${image(item)}${item.offer ? `<span class="offer">${item.offer}% off</span>` : ''}
    </button>`
  ).join('');
  const item = bridal[active.bridal];
  byId('bridal-info').innerHTML = `<h3>${item.name}</h3><p>${item.fabric} · ${item.note}</p><p class="cost">${price(salePrice(item))}</p>
    <div class="controls"><button class="circle" data-action="step" data-group="bridal" data-delta="-1" aria-label="Previous bridal saree">←</button>
    <button class="pill primary" data-action="add" data-id="${item.id}">Add to bag ↗</button>${heart(item)}
    <button class="circle" data-action="step" data-group="bridal" data-delta="1" aria-label="Next bridal saree">→</button></div>`;
}

function renderWeave() {
  const item = compare[selectedWeave];
  byId('weave').innerHTML = `${image(item,'front',item.name)}<div><p class="eyebrow">${item.fabric}</p><h3>${item.name}</h3>
    <p>${item.note}</p><div class="filters">${compare.map((piece,index) =>
      `<button class="filter" data-action="weave" data-index="${index}" aria-pressed="${selectedWeave === index}">${piece.name}</button>`
    ).join('')}</div><button class="pill primary" data-action="product" data-source="weave" data-id="${item.id}">View silk · ${price(salePrice(item))}</button></div>`;
}

const renderers = {looks:renderLooks,reels:renderReels,bridal:renderBridal};

function setActive(group, index) {
  const size = groups[group].length;
  active[group] = (index + size) % size;
  renderers[group]();
}

function openProduct(id, collection, source) {
  detail = {id, collection, view:'front', size:'', source, availability:false};
  renderProduct();
  if (!productDialog.open) productDialog.showModal();
}

function renderProduct() {
  const item = products[detail.id];
  const needsSize = item.category === 'Blouses';
  const title = detail.source === 'rack' ? 'ON THE RAIL' : 'THE SILK EDIT';
  productDialog.innerHTML = `<div class="dialog-head"><p class="eyebrow">${title}</p>
    <button class="circle" data-action="close" aria-label="Close product details">×</button></div>
    <div class="product-grid"><img class="product-image" src="assets/${item.id}-${detail.view}.webp" alt="${detail.view} view of ${item.name}">
    <div><p class="eyebrow">${item.fabric}</p><h3 id="product-title">${item.name}</h3>
    <p>${item.note}</p><strong>${price(salePrice(item))}</strong>
    <div class="filters" aria-label="Product view">${['front','back'].map(view =>
      `<button class="filter" data-action="view" data-view="${view}" aria-pressed="${detail.view === view}">${view === 'front' ? 'Front' : 'Back'}</button>`
    ).join('')}</div>
    ${needsSize ? `<div class="filters" aria-label="Blouse size">${sizes.map(size => `<button class="filter" data-action="size" data-size="${size}" aria-pressed="${detail.size === size}">${size}</button>`).join('')}</div>` : '<p>Unstitched drape · One size</p>'}
    <div class="detail-actions"><button class="pill primary" data-action="detail-add" ${needsSize && !detail.size ? 'disabled' : ''}>${needsSize && !detail.size ? 'Select a size' : 'Add to bag ↗'}</button>
    ${heart(item)}<button class="pill secondary" data-action="availability" aria-expanded="${detail.availability}">See availability</button></div>
    ${detail.availability ? '<p role="status">This is a showroom sample. Live stock availability is pending.</p>' : ''}
    </div></div>${detail.collection.length > 1 ? `<div class="controls">
    <button class="circle" data-action="product-step" data-delta="-1" aria-label="Previous product">←</button>
    <p>${detail.collection.findIndex(piece => piece.id === item.id) + 1} of ${detail.collection.length}</p>
    <button class="circle" data-action="product-step" data-delta="1" aria-label="Next product">→</button></div>` : ''}`;
}

function renderDrawer() {
  const isBag = drawerType === 'bag';
  drawer.innerHTML = `<div class="dialog-head"><h3 id="drawer-title">${isBag ? 'Shopping bag' : 'Wishlist'}</h3>
    <button class="circle" data-action="close" aria-label="Close ${isBag ? 'shopping bag' : 'wishlist'}">×</button></div>`;
  if (!isBag) {
    drawer.insertAdjacentHTML('beforeend',state.saved.length ? state.saved.map(id => {
      const item = products[id];
      return `<div class="drawer-row">${thumb(item)}<div><strong>${item.name}</strong><small>${price(salePrice(item))}</small></div>${heart(item)}${actionButton('add',item,'plus','Add')}</div>`;
    }).join('') : '<p class="drawer-note">Save a piece using its heart button to find it here.</p>');
    return;
  }
  if (!state.bag.length) {
    drawer.insertAdjacentHTML('beforeend','<p class="drawer-note">Your bag is empty. Explore the rack to find your first piece.</p>');
    return;
  }
  let total = 0;
  const rows = state.bag.map((row,index) => {
    const item = products[row.id];
    const unit = bagPrice(item,row.bundle);
    total += unit * row.quantity;
    return `<div class="drawer-row">${thumb(item)}<div><strong>${item.name}</strong><small>${price(unit)}${row.size ? ` · Size ${row.size}` : ''}${row.bundle ? ' · Look bundle' : ''}</small></div>
      <div class="quantity"><button class="circle" data-action="quantity" data-index="${index}" data-delta="-1" aria-label="Decrease quantity of ${item.name}">−</button>
      <span>${row.quantity}</span><button class="circle" data-action="quantity" data-index="${index}" data-delta="1" aria-label="Increase quantity of ${item.name}">+</button></div></div>`;
  });
  drawer.insertAdjacentHTML('beforeend',`${rows.join('')}<p class="drawer-total"><span>Subtotal</span><span>${price(total)}</span></p>
    <p class="drawer-note">Showroom preview. Checkout and live stock are pending.</p>`);
}

function stopReelRotation() {
  clearInterval(reelTimer);
  reelTimer = undefined;
  const button = document.querySelector('[data-action="rotate-reels"]');
  button.setAttribute('aria-pressed','false');
  button.setAttribute('aria-label','Start reel rotation');
  button.textContent = '▷';
}

function playReel(index) {
  stopReelRotation();
  film.pause();
  const reel = reels[index];
  reelDialog.innerHTML = `<div class="dialog-head"><h3 id="reel-title">${reel.title}</h3>
    <button class="circle" data-action="close" aria-label="Close reel">×</button></div>
    <video src="assets/${reel.product.id}-reel.mp4" controls playsinline preload="metadata" aria-label="${reel.title}"></video>`;
  reelDialog.showModal();
  const video = reelDialog.querySelector('video');
  video.play().catch(() => {});
}

reelDialog.addEventListener('close', () => {
  reelDialog.querySelector('video')?.pause();
});
film.addEventListener('volumechange', () => {
  const button = document.querySelector('[data-action="sound"]');
  button.setAttribute('aria-pressed', String(!film.muted));
  button.textContent = film.muted ? 'Sound off' : 'Sound on';
});

function closeMenu() {
  byId('nav-links').classList.remove('open');
  const button = document.querySelector('[data-action="menu"]');
  button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-label','Open menu');
}

function keepFocus(scope, selector) {
  scope.querySelector(selector)?.focus({preventScroll:true});
}

document.addEventListener('click', event => {
  if (event.target.closest('#nav-links a')) closeMenu();
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const {action,id,group,source} = button.dataset;
  const index = Number(button.dataset.index);
  const delta = Number(button.dataset.delta);
  const item = products[id];

  switch (action) {
    case 'menu': {
      const open = byId('nav-links').classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label',open ? 'Close menu' : 'Open menu');
      break;
    }
    case 'save': toggleSaved(item); break;
    case 'add': addToBag(item); break;
    case 'step':
    case 'select': {
      if (group === 'reels') stopReelRotation();
      setActive(group,action === 'step' ? active[group] + delta : index);
      if (!button.isConnected) {
        const selector = action === 'step'
          ? `[data-action="step"][data-group="${group}"][data-delta="${delta}"]`
          : `[data-group="${group}"][data-index="${index}"]`;
        keepFocus(document, selector);
      }
      break;
    }
    case 'filter':
      filter = button.dataset.filter;
      renderRack();
      keepFocus(byId('filters'),'[aria-pressed="true"]');
      break;
    case 'weave':
      selectedWeave = index;
      renderWeave();
      keepFocus(byId('weave'),'[aria-pressed="true"]');
      break;
    case 'product':
      openProduct(id, {rack:filteredRack(), silks:sarees, archive:sarees, bridal, weave:compare}[source], source);
      break;
    case 'product-step': {
      const collection = detail.collection;
      const position = collection.findIndex(piece => piece.id === detail.id);
      openProduct(collection[(position + delta + collection.length) % collection.length].id, collection, detail.source);
      keepFocus(productDialog,`[data-action="product-step"][data-delta="${delta}"]`);
      break;
    }
    case 'view':
    case 'size':
    case 'availability':
      if (action === 'view') detail.view = button.dataset.view;
      if (action === 'size') detail.size = button.dataset.size;
      if (action === 'availability') detail.availability = !detail.availability;
      renderProduct();
      keepFocus(productDialog, action === 'availability' ? '[data-action="availability"]' : `[data-action="${action}"][aria-pressed="true"]`);
      break;
    case 'detail-add':
      pushToBag(products[detail.id],detail.size);
      persist();
      productDialog.close();
      if (drawer.open) renderDrawer();
      notify('Added to bag');
      break;
    case 'bundle': {
      const size = byId('bundle-size').value;
      if (!size) {
        byId('bundle-size').focus();
        notify('Choose a blouse size to add the full look');
        break;
      }
      for (const piece of getLook()) pushToBag(piece,piece.category === 'Blouses' ? size : '',true);
      persist();
      notify('Full look added to bag');
      break;
    }
    case 'bag':
    case 'wishlist':
      drawerType = action;
      renderDrawer();
      drawer.showModal();
      break;
    case 'quantity': {
      const row = state.bag[index];
      row.quantity = Math.min(99,row.quantity + delta);
      if (row.quantity === 0) state.bag.splice(index,1);
      persist();
      renderDrawer();
      keepFocus(drawer, state.bag[index] ? `[data-action="quantity"][data-index="${index}"][data-delta="${delta}"]` : '[data-action="close"]');
      break;
    }
    case 'sound': film.muted = !film.muted; break;
    case 'play': playReel(index); break;
    case 'rotate-reels':
      if (reelTimer) stopReelRotation();
      else {
        reelTimer = setInterval(() => setActive('reels',active.reels + 1),3000);
        button.setAttribute('aria-pressed','true');
        button.setAttribute('aria-label','Pause reel rotation');
        button.textContent = 'Ⅱ';
      }
      break;
    case 'close': button.closest('dialog').close(); break;
  }
});

for (const dialog of [productDialog,drawer,reelDialog]) {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}

function enableSwipe(node, group) {
  let start;
  let suppressClick = false;
  node.addEventListener('pointerdown', event => {
    if (event.isPrimary && event.button === 0) start = {x:event.clientX,y:event.clientY};
  });
  node.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = undefined;
    if (Math.abs(dx) < 38 || Math.abs(dx) < Math.abs(dy)) return;
    suppressClick = true;
    if (group === 'reels') stopReelRotation();
    setActive(group,active[group] + (dx < 0 ? 1 : -1));
    setTimeout(() => { suppressClick = false; },0);
  });
  node.addEventListener('pointercancel', () => { start = undefined; });
  node.addEventListener('pointerleave', () => { start = undefined; });
  node.addEventListener('click', event => {
    if (suppressClick) event.stopImmediatePropagation();
  },true);
  node.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    if (group === 'reels') stopReelRotation();
    setActive(group,active[group] + (event.key === 'ArrowRight' ? 1 : -1));
    keepFocus(node,`[data-index="${active[group]}"]`);
  });
}

document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });
byId('moods').innerHTML = moods.map(item =>
  `<button class="mood" data-action="product" data-source="archive" data-id="${item.id}"><span class="arch">${image(item)}</span><span>${item.label}</span></button>`
).join('');
for (const [id,items] of [['film-left',sarees.slice(0,3)],['film-right',sarees.slice(3,6)]]) {
  const strip = `<div>${items.map(item => image(item)).join('')}</div>`;
  byId(id).innerHTML = `<div>${strip}${strip}</div>`;
}
renderLooks();
renderSilks();
renderRack();
renderReels();
renderBridal();
renderWeave();
updateCounts();
enableSwipe(byId('look-stage'),'looks');
enableSwipe(byId('reel-arc'),'reels');
enableSwipe(byId('bridal-arc'),'bridal');

for (const card of document.querySelectorAll('.silk-card')) {
  card.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--rx', `${(0.5 - (event.clientY - rect.top) / rect.height) * 11}deg`);
    card.style.setProperty('--ry', `${((event.clientX - rect.left) / rect.width - 0.5) * 13}deg`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
  });
}
