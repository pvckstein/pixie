// src/engine.js
let _doT = null;
let _patched = false;

// Carga doT si no existe global (usa CDN ES module simple)
export async function loadDoT() {
  if (_doT) return _doT;
  // Si ya existe global (por ejemplo lo inyectas tú), úsalo
  if (window.doT) { _doT = window.doT; return _doT; }

  // Carga mínima de doT ESM (puedes cambiar a tu propio hosting)
  const mod = await import('https://cdn.jsdelivr.net/npm/dot/doT.min.js');
  _doT = (mod.default || window.doT || mod);
  return _doT;
}

// Parchea delimitadores a [[ ... ]] (idempotente)
export function applyDoTPatch(doT) {
  if (_patched) return;
  doT.templateSettings = {
    evaluate:    /\[\[([\s\S]+?)\]\]/g,           // [[ ... ]]
    interpolate: /\[\[=([\s\S]+?)\]\]/g,          // [[= ... ]]
    encode:      /\[\[!([\s\S]+?)\]\]/g,          // [[! ... ]]
    use:         /\[\[#([\s\S]+?)\]\]/g,          // [[# ... ]]
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
  // Devuelve { default: HTMLString }
  // (si quisieras slots con name, amplia esto)
  const html = host.innerHTML;
  return { default: html };
}

// Registro genérico de componentes con render perezoso
export function registerComponent(name, tpl, { shadow = true } = {}) {
  if (customElements.get(name)) return;

  class DotComponent extends HTMLElement {
    static get observedAttributes() { return []; }

    constructor() {
      super();
      if (shadow) this.attachShadow({ mode: 'open' });
      this._compiled = null;
      this._renderedOnce = false;
    }

    async connectedCallback() {
      await this._ensureDoT();
      this._render();
    }

    async _ensureDoT() {
      if (!_doT) await loadDoT();
      if (!_patched) applyDoTPatch(_doT);
      if (!this._compiled) this._compiled = _doT.template(tpl);
    }

    _getIt() {
      // Pasa los atributos como props (string) y el slot
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

      // Ejecuta los <script> internos del template (si hay)
      // para permitir lógica inline (como en tu popover original)
      root.querySelectorAll('script').forEach(scr => {
        const code = scr.textContent || '';
        if (!code.trim()) return;
        // ejecuta en un IIFE con 'document' del shadow
        const fn = new Function(code);
        fn.call(root); // 'this' será el root; dentro puedes usar document.currentScript
      });
    }
  }

  customElements.define(name, DotComponent);
}
