import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { PixElement } from '../core/pix-element.js';

@customElement('pix-card')
export class PixCard extends PixElement {
  static styles = css`
    :host {
      display: block;
      --pix-bg: var(--pix-bg, #fff);
      --pix-fg: var(--pix-fg, #111);
      --pix-radius: var(--pix-radius, 16px);
      --pix-pad: var(--pix-pad, 1rem);
      --pix-border: var(--pix-border, 1px solid color-mix(in srgb, currentColor 15%, transparent));
      --pix-shadow: var(--pix-shadow, 0 4px 14px rgba(0,0,0,.08));
    }
    .card {
      background: var(--pix-bg);
      color: var(--pix-fg);
      border-radius: var(--pix-radius);
      border: var(--pix-border);
      box-shadow: var(--pix-shadow);
      padding: var(--pix-pad);
    }
    header { font-weight: 600; margin-bottom: .5rem; }
    footer { margin-top: .75rem; opacity: .85; font-size: .9em; }
  `;

  render() {
    return html`
      <article class="card" part="card">
        <header part="header"><slot name="header"></slot></header>
        <section part="content"><slot></slot></section>
        <footer part="footer"><slot name="footer"></slot></footer>
      </article>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'pix-card': PixCard; } }
