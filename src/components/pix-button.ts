import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { PixElement } from '../core/pix-element.js';

@customElement('pix-button')
export class PixButton extends PixElement {
  static styles = css`
    :host {
      display: inline-block;

      /* === Tokens con fallback (tematizables desde fuera) === */
      --pix-color: var(--pix-color, #6e56cf);
      --pix-fg: var(--pix-fg, #fff);
      --pix-bg: var(--pix-bg, var(--pix-color));
      --pix-radius: var(--pix-radius, 12px);
      --pix-pad-x: var(--pix-pad-x, 1rem);
      --pix-pad-y: var(--pix-pad-y, .6rem);
      --pix-shadow: var(--pix-shadow, 0 2px 6px rgba(0,0,0,.15));
      --pix-border: var(--pix-border, 1px solid currentColor);
      --pix-opacity-disabled: var(--pix-opacity-disabled, .6);
      --pix-transition: var(--pix-transition, transform .12s ease, opacity .12s ease, background .12s ease);
    }

    button {
      font: inherit;
      border: 0;
      padding: var(--pix-pad-y) var(--pix-pad-x);
      border-radius: var(--pix-radius);
      background: var(--pix-bg);
      color: var(--pix-fg);
      cursor: pointer;
      box-shadow: var(--pix-shadow);
      transition: var(--pix-transition);
    }
    button:active { transform: translateY(1px); }
    button:disabled { opacity: var(--pix-opacity-disabled); cursor: not-allowed; }

    /* === Variantes por atributo del host === */
    :host([variant="outline"]) button {
      background: transparent;
      color: var(--pix-color);
      box-shadow: none;
      border: var(--pix-border);
    }
    :host([variant="ghost"]) button {
      background: transparent;
      color: var(--pix-color);
      box-shadow: none;
      border: 0;
    }
  `;

  /** "solid" | "outline" | "ghost" */
  @property({ reflect: true }) variant: 'solid' | 'outline' | 'ghost' = 'solid';
  @property({ type: Boolean, reflect: true }) disabled = false;

  render() {
    return html`
      <button
        part="button"
        ?disabled=${this.disabled}
        @click=${(e: Event) => {
          if (this.disabled) { e.preventDefault(); e.stopImmediatePropagation(); return; }
          this.dispatchEvent(new CustomEvent('pix-click', { bubbles: true, composed: true }));
        }}
      >
        <slot name="icon"></slot>
        <slot></slot>
      </button>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'pix-button': PixButton; } }
