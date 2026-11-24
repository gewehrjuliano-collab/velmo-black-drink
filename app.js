const products = {
  morango: [
    {label: '1 pote', description: 'Para começar sua rotina', cash: 209.90, installment: 21.61, url: 'https://pay.hest.com.br/6650a276-740d-407b-8af1-67c9f785ba76'},
    {label: '2+2', description: '4 potes no total', cash: 365.60, installment: 37.50, url: 'https://pay.hest.com.br/0c210347-44d5-4fbb-9e41-2d170ca71a4e'},
    {label: '3+3', description: '6 potes no total', cash: 491.80, installment: 50.37, url: 'https://pay.hest.com.br/978c81b9-73b6-415e-889e-fe4c66d251a5'},
    {label: '12 meses', description: 'Opção para uma rotina prolongada', cash: 851.80, installment: 87.11, url: 'https://pay.hest.com.br/f7ec560f-582c-47e6-a076-6a14c8774b12'}
  ],
  tangerina: [
    {label: '1 mês', description: 'Para começar sua rotina', cash: 209.90, installment: 21.61, url: 'https://pay.hest.com.br/dbd46528-eaab-4825-98c6-9f97b78a45e2'},
    {label: '2+2', description: '4 potes no total', cash: 365.60, installment: 37.50, url: 'https://pay.hest.com.br/ae9123c3-fc44-4a5a-b1ed-2d2017d8b27e'},
    {label: '5 meses', description: 'Mais tempo de constância', cash: 461.90, installment: 47.32, url: 'https://pay.hest.com.br/769740ab-8090-40ec-86e8-37f59cb1d68b'},
    {label: '12 meses', description: 'Opção para uma rotina prolongada', cash: 851.80, installment: 87.11, url: 'https://pay.hest.com.br/dd8ca541-10fd-4585-b85d-1c463a77611b'}
  ]
};
const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
let flavor = 'morango';
let selected = 0;
const options = document.querySelector('#kit-options');
function updateOrder() {
  const product = products[flavor][selected];
  const displayFlavor = flavor === 'morango' ? 'Morango' : 'Tangerina';
  document.querySelector('#order-name').textContent = `${displayFlavor} · ${product.label}`;
  document.querySelector('#visual-flavor').textContent = displayFlavor.toUpperCase();
  document.querySelector('#buy-link').href = product.url;
  document.querySelector('#order-price').textContent = `12x de ${money(product.installment)}`;
  document.querySelector('#order-cash').textContent = `ou ${money(product.cash)} à vista`;
  document.querySelector('#buy-link').setAttribute('aria-label', `Comprar Velmo Black Drink ${displayFlavor}, ${product.label}`);
  const pot = document.querySelector('.shop-pot');
  pot.classList.toggle('citrus-product', flavor === 'tangerina');
  pot.classList.toggle('strawberry-product', flavor === 'morango');
  document.querySelector('#shop-image').alt = `Pote de Velmo Black Drink sabor ${displayFlavor.toLowerCase()}`;
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
    const pricing = document.createElement('span'); pricing.className = 'option-pricing';
    const installments = document.createElement('strong'); installments.textContent = `12x de ${money(product.installment)}`;
    const cash = document.createElement('small'); cash.textContent = `ou ${money(product.cash)} à vista`;
    pricing.append(installments, cash);
    label.append(input, text, pricing);
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
