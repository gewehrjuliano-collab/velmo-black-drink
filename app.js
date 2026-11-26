const products = {
  morango: [
    {label: '1 pote', description: '40% de desconto', url: 'https://pay.hest.com.br/0477b52d-41ef-4199-b664-d7f1a0582acb'},
    {label: '3 meses', description: 'Kit de Black Friday', url: 'https://pay.hest.com.br/3a2e2ceb-96cb-47ad-9107-ab9ac6e236aa'},
    {label: '5 meses', description: 'Kit de Black Friday', url: 'https://pay.hest.com.br/e9c27337-07bd-4844-87ae-ebd0e1ae868a'}
  ],
  tangerina: [
    {label: '1 mês', description: 'Kit de Black Friday', url: 'https://pay.hest.com.br/74b16719-8fc8-4d2e-9dad-4297efb6d54a'},
    {label: '3 meses', description: 'Kit de Black Friday', url: 'https://pay.hest.com.br/e7e5e669-cbaf-49d5-8063-4d9517f35a47'},
    {label: '5 meses', description: 'Kit de Black Friday', url: 'https://pay.hest.com.br/0cfd3e53-a2f4-4bf0-8976-709bbe694ab6'}
  ]
};
let flavor = 'morango';
let selected = 0;
const options = document.querySelector('#kit-options');
function updateOrder() {
  const product = products[flavor][selected];
  const displayFlavor = flavor === 'morango' ? 'Morango' : 'Tangerina';
  document.querySelector('#order-name').textContent = `${displayFlavor} · ${product.label}`;
  document.querySelector('#visual-flavor').textContent = displayFlavor.toUpperCase();
  document.querySelector('#buy-link').href = product.url;
  document.querySelector('#buy-link').setAttribute('aria-label', `Comprar Velmo Black Drink ${displayFlavor}, ${product.label}`);
  const pot = document.querySelector('.shop-pot');
  pot.classList.toggle('citrus-product', flavor === 'tangerina');
  pot.classList.toggle('strawberry-product', flavor === 'morango');
  document.querySelector('#shop-image').alt = `Pote de Velmo Black Drink sabor ${displayFlavor.toLowerCase()}`;
  document.querySelector('#shop-image').src = `assets/velmo-${flavor}.webp`;
  const fruit = document.querySelector('#shop-fruit');
  fruit.src = `assets/frutas-${flavor}.webp`;
  fruit.classList.toggle('tangerine-fruit', flavor === 'tangerina');
  fruit.classList.toggle('strawberry-fruit', flavor === 'morango');
  document.querySelector('#kit-art').setAttribute('aria-label', `Velmo Black Drink sabor ${displayFlavor.toLowerCase()}`);
}
function renderOptions() {
  options.replaceChildren();
  const legend = document.createElement('legend'); legend.textContent = 'Escolha seu kit'; options.append(legend);
  products[flavor].forEach((product, index) => {
    const label = document.createElement('label'); label.className = 'kit-option';
    const input = document.createElement('input'); input.type = 'radio'; input.name = 'kit'; input.value = String(index); input.checked = index === selected;
    const text = document.createElement('span');
    const title = document.createElement('strong'); title.textContent = product.label;
    const detail = document.createElement('small'); detail.textContent = product.description;
    text.append(title, detail);
    label.append(input, text);
    input.addEventListener('change', () => { selected = index; updateOrder(); });
    options.append(label);
  });
  updateOrder();
}
document.querySelectorAll('input[name="flavor"]').forEach(input => input.addEventListener('change', () => { flavor = input.value; selected = 0; renderOptions(); }));
document.querySelectorAll('[data-flavor]').forEach(link => link.addEventListener('click', () => {
  flavor = link.dataset.flavor; selected = 0;
  document.querySelector(`input[name="flavor"][value="${flavor}"]`).checked = true;
  renderOptions();
}));
renderOptions();
document.querySelector('#year').textContent = new Date().getFullYear();

const proofMotion = matchMedia('(prefers-reduced-motion: reduce)');
const movingGalleries = [];
document.querySelectorAll('.proof-gallery').forEach(gallery => {
  if (proofMotion.matches) return;
  const originals = Array.from(gallery.children);
  originals.forEach(card => {
    const copy = card.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.tabIndex = -1;
    gallery.append(copy);
  });
  gallery.classList.add('is-running');
  const state = {gallery, count: originals.length, paused: false, interactingUntil: 0};
  gallery.addEventListener('mouseenter', () => { state.paused = true; });
  gallery.addEventListener('mouseleave', () => { state.paused = false; });
  gallery.addEventListener('focusin', () => { state.paused = true; });
  gallery.addEventListener('focusout', event => { if (!gallery.contains(event.relatedTarget)) state.paused = false; });
  gallery.addEventListener('touchstart', () => { state.interactingUntil = performance.now() + 4000; }, {passive: true});
  gallery.addEventListener('wheel', () => { state.interactingUntil = performance.now() + 3000; }, {passive: true});
  movingGalleries.push(state);
});
let lastProofFrame;
function moveProofs(now) {
  const elapsed = lastProofFrame ? Math.min(now - lastProofFrame, 50) : 0;
  lastProofFrame = now;
  if (!document.hidden && !proofMotion.matches && !document.querySelector('#proof-lightbox').open) {
    movingGalleries.forEach(state => {
      if (state.paused || now < state.interactingUntil) { state.position = state.gallery.scrollLeft; return; }
      const gallery = state.gallery;
      const card = gallery.querySelector('.proof-card');
      const gap = parseFloat(getComputedStyle(gallery).columnGap) || 18;
      const cycle = (card.getBoundingClientRect().width + gap) * state.count;
      state.position = (state.position ?? gallery.scrollLeft) + elapsed * 0.026;
      if (state.position >= cycle) state.position -= cycle;
      gallery.scrollLeft = state.position;
    });
  }
  requestAnimationFrame(moveProofs);
}
if (movingGalleries.length) requestAnimationFrame(moveProofs);
const proofDialog = document.querySelector('#proof-lightbox');
let proofTrigger;
document.querySelectorAll('[data-proof]').forEach(button => button.addEventListener('click', () => {
  proofTrigger = button;
  const image = document.querySelector('#expanded-proof');
  image.src = button.querySelector('img').src;
  image.alt = button.querySelector('img').alt;
  image.style.clipPath = button.querySelector('img').style.clipPath;
  document.querySelector('#expanded-contact').hidden = !button.querySelector('.anonymous-contact');
  document.querySelector('#proof-caption').textContent = button.dataset.caption;
  proofDialog.showModal();
}));
function closeProof() { proofDialog.close(); proofTrigger?.focus(); }
document.querySelector('#close-proof').addEventListener('click', closeProof);
proofDialog.addEventListener('click', event => {
  if (event.target !== proofDialog) return;
  const rect = proofDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeProof();
});
document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => {
  const gallery = document.getElementById(button.dataset.gallery);
  const moving = movingGalleries.find(state => state.gallery === gallery);
  if (moving) moving.interactingUntil = performance.now() + 3000;
  const card = gallery.querySelector('.proof-card');
  const gap = parseFloat(getComputedStyle(gallery).columnGap) || 18;
  gallery.scrollBy({ left: Number(button.dataset.scroll) * (card.getBoundingClientRect().width + gap), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}));
