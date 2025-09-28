// src/engine.js
let _doT = null;
let _patched = false;

export async function loadDoT() {
  if (_doT) return _doT;
  if (window.doT) { _doT = window.doT; return _doT; }
  const mod = await import('https://cdn.jsdelivr.net/npm/dot/doT.min.js');
  _doT = (mod.default || window.doT || mod);
  return _doT;
}

export function applyDoTPatch(doT) {
  if (_patched) return;
  doT.templateSettings = {
    evaluate:    /\[\[([\s\S]+?)\]\]/g,
    interpolate: /\[\[=([\s\S]+?)\]\]/g,
    encode:      /\[\[!([\s\S]+?)\]\]/g,
    use:         /\[\[#([\s\S]+?)\]\]/g,
    define:      /\[\[##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\]\]/g,
    conditional: /\[\[\?(\?)?\s*([\s\S]*?)\s*\]\]/g,
    iterate:     /\[\[~\s*(?:\]\]|([\s\S]+?)\s*:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\]\])/g,
    varname: 'it',
    strip: true,
    append: true
  };
  _patched = true;
}

function slotsToObj(host) {
  return { default: host.innerHTML };
}

// ⬇️ AÑADIDO: acepta { shadow, setup }
export function registerComponent(name, tpl, { shadow = true, setup } = {}) {
  if (customElements.get(name)) return;

  class DotComponent extends HTMLElement {
    constructor() {
      super();
      if (shadow) this.attachShadow({ mode: 'open' });
      this._compiled = null;
    }

    async connectedCallback() {
      const doT = await loadDoT();
      if (!_patched) applyDoTPatch(doT);
      if (!this._compiled) this._compiled = doT.template(tpl);
      this._render();
    }

    _getIt() {
      const it = {};
      for (const { name, value } of this.attributes) it[name] = value ?? '';
      it.$ = { slot: slotsToObj(this) };
      return it;
    }

    _render() {
      const it = this._getIt();
      const html = this._compiled(it);
      const root = this.shadowRoot || this;
      root.innerHTML = html;

      try {
        if (typeof setup === 'function') setup(root, this);
      } catch (e) {
        console.warn(`[${name}] setup error:`, e);
      }
    }
  }

  customElements.define(name, DotComponent);
}
