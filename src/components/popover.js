// src/components/popover.js
import { registerComponent } from '../engine.js';

const tpl = /*html*/`
<style>
  :host{display:inline-block;font:inherit}
  .trigger{all:unset;cursor:pointer;padding:.45rem .6rem;border:1px solid #e5e7eb;border-radius:.5rem;background:#f9fafb}
  .trigger:hover{background:#f3f4f6}
  .panel{padding:.8rem 1rem;border:1px solid #e5e7eb;border-radius:.6rem;background:#fff;box-shadow:0 10px 25px rgba(0,0,0,.10);max-inline-size:min(90vw,520px)}
  .head{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:.5rem}
  .title{font-weight:700}
  .close{all:unset;cursor:pointer;border-radius:.4rem;padding:.2rem .4rem}
  .close:hover{background:#f3f4f6}
  .content{line-height:1.45}
  .panel:popover-open{animation:popIn .12s ease-out}
  @keyframes popIn{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:translateY(0)}}
  .backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);display:none;z-index:2147483638}
  .backdrop[open]{display:block}
</style>

[[
  var pid = it.id || ('pop_'+Math.random().toString(36).slice(2));
  var hasTrigger   = !(it.trigger === 'false' || it.trigger === false);
  var manual       = (it.manual === '' || it.manual === true || it.manual === 'true');
  var withBackdrop = (it.backdrop === '' || it.backdrop === true || it.backdrop === 'true');
]]

[[ if (withBackdrop) { ]] <div class="backdrop" id="bd-[[= pid ]]"></div> [[ } ]]

[[ if (hasTrigger) { ]]
  <button class="trigger" type="button" aria-haspopup="dialog" aria-expanded="false">
    [[= it.label || 'Abrir' ]]
  </button>
[[ } ]]

<div id="[[= pid ]]" class="panel" popover="[[= manual ? 'manual' : 'auto' ]]" role="dialog" aria-modal="[[= withBackdrop ? 'true' : 'false' ]]">
  <div class="head">
    <div class="title">[[= it.title || '' ]]</div>
    <button class="close" type="button" aria-label="Cerrar">✕</button>
  </div>
  <div class="content">
    [[= it.html || (it.$ && it.$.slot && it.$.slot.default) || '' ]]
  </div>
</div>

<script>
(() => {
  // Dentro del shadow
  const root  = (typeof document !== 'undefined' && document) || this;
  const host  = root.host || root; // <x-popover>
  const panel = root.querySelector('.panel');
  const pid   = panel?.id;
  const bd    = root.getElementById('bd-'+pid);
  const trig  = root.querySelector('.trigger');
  const close = root.querySelector('.close');

  // Trigger interno
  if (trig && panel) {
    trig.addEventListener('click', () => {
      if (panel.matches(':popover-open')) panel.hidePopover?.(); else panel.showPopover?.();
    });
    panel.addEventListener('toggle', () => {
      const open = panel.matches(':popover-open');
      trig.setAttribute('aria-expanded', open ? 'true':'false');
    });
  }

  // Trigger externo via atributo for="btnId" (atraviesa shadow)
  const forSel = host.getAttribute('for');
  if (forSel && panel) {
    const trg = (forSel.startsWith('#') ? document.querySelector(forSel) : document.getElementById(forSel));
    const action = host.getAttribute('for-action') || 'toggle';
    if (trg) {
      if (trg._xpopHandler) trg.removeEventListener('click', trg._xpopHandler);
      trg._xpopHandler = (e) => {
        e.preventDefault();
        const open = panel.matches(':popover-open');
        if (action === 'show')      panel.showPopover?.();
        else if (action === 'hide') panel.hidePopover?.();
        else open ? panel.hidePopover?.() : panel.showPopover?.();
      };
      trg.addEventListener('click', trg._xpopHandler);

      trg.setAttribute('aria-haspopup', 'dialog');
      trg.setAttribute('aria-expanded', panel.matches(':popover-open') ? 'true':'false');
      panel.addEventListener('toggle', () => {
        const open = panel.matches(':popover-open');
        trg.setAttribute('aria-expanded', open ? 'true':'false');
      });
    }
  }

  // Backdrop
  if (bd && panel) {
    bd.addEventListener('click', () => { panel.hidePopover?.(); bd.removeAttribute('open'); });
    panel.addEventListener('toggle', () => {
      const open = panel.matches(':popover-open');
      if (open) bd.setAttribute('open',''); else bd.removeAttribute('open');
    });
  }

  // Close button
  close?.addEventListener('click', () => panel.hidePopover?.());

  // Escape para cerrar
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel?.matches(':popover-open')) panel.hidePopover?.();
  }, { capture:true });

  // Posicionamiento simple
  const pos = host.getAttribute('pos') || host.getAttribute('position');
  if (pos) {
    const s = panel.style;
    s.position='fixed'; const pad=16;
    if (pos==='top'){ s.top=pad+'px'; s.left='50%'; s.transform='translateX(-50%)'; }
    else if (pos==='bottom'){ s.bottom=pad+'px'; s.left='50%'; s.transform='translateX(-50%)'; }
    else if (pos==='left'){ s.left=pad+'px'; s.top='50%'; s.transform='translateY(-50%)'; }
    else if (pos==='right'){ s.right=pad+'px'; s.top='50%'; s.transform='translateY(-50%)'; }
    else { s.top='50%'; s.left='50%'; s.transform='translate(-50%,-50%)'; }
  }
})();
</script>
`;

registerComponent('x-popover', tpl, { shadow:true });
