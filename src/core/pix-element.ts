import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';

type TokenValue = string | number | null | undefined;
export type PixTokens = Record<string, TokenValue>;

export class PixElement extends LitElement {
  @property({ attribute: false }) tokens?: PixTokens;

  protected willUpdate() {
    if (!this.tokens) return;
    for (const [key, val] of Object.entries(this.tokens)) {
      const cssVar = `--pix-${key}`;
      if (val == null) this.style.removeProperty(cssVar);
      else this.style.setProperty(cssVar, String(val));
    }
  }
}
