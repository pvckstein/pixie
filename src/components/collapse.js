// src/components/collapse.js
import { registerComponent } from '../engine.js';

const tpl = /*html*/`
<style>
  :host{ display:block; font:inherit }

  details {
    position: relative;
    border: 1px solid grey;
    border-radius: .5rem;
    padding: 1rem 1rem; /* espacio lateral y arriba */
    transition: border-color .2s ease-in-out, box-shadow .2s ease-in-out;
  }

  details:focus-within {
    outline: none;
    }

  summary {
    position: relative;
    cursor: pointer;
    list-style: none; /* oculta marker en navegadores viejos */
    display: flex;
    align-items: center;
    gap: .5rem;
    user-select: none;
  }

  /* Oculta ::marker por si acaso */
  summary::marker { content: none; }

  /* Icono + por defecto */
  summary::before {
    content: "+";
    inline-size: 1rem;
    text-align: center;
    transition: transform .2s ease;
  }

  /* Wrapper del contenido (lo animaremos con max-height) */
  .content {
    overflow: hidden;
    max-height: 0;
    transition: max-height .35s ease, margin-top .2s ease;
    margin-top: 0;
  }

  /* Estado abierto (estilos “visuals”; la animación la gestiona JS) */
  details[open] summary::before {
    transform: rotate(45deg);
  }

  /* Tip: si no quieres bordes dobles al anidar, puedes usar :host-context() fuera del shadow */
</style>

<details part="root">
  <summary part="summary">
    [[ /* título por attr o por slot="summary" */ ]]
    <slot name="summary">
      [[= it.title || it.label || 'Detalles' ]]
    </slot>
  </summary>

  <div class="content" part="content">
    <slot></slot>
  </div>
</details>
`;

/**
 * setup()
 * - Soporta atributos:
 *   - open            → abierto por defecto
 *   - group="nombre"  → cierra otros <x-collapse> con el mismo group (acordeón simple)
 *   - icon="▶"        → personaliza el símbolo del summary::before
 *   - duration="350"  → duración ms de la animación (max-height)
 * - Accesible: aria-expanded y aria-controls sincronizados
 */
function setup(root, host) {
  const $details = root.querySelector('details');
  const $summary = root.querySelector('summary');
  const $content = root.querySelector('.content');

  if (!$details || !$summary || !$content) return;

  // --- Parámetros/atributos ---
  const isOpenAttr = host.hasAttribute('open');
  const groupName  = host.getAttribute('group') || '';
  const iconChar   = host.getAttribute('icon');      // opcional, ejemplo: "▶"
  const durAttr    = parseInt(host.getAttribute('duration') || '350', 10);
  const DURATION   = isFinite(durAttr) ? Math.max(0, durAttr) : 350;

  // Aplica icono custom si se pidió (mediante CSS vars inyectadas)
  if (iconChar) {
    // Usamos una CSS var para reescribir el content via ::before con attr(data-icon)
    // (no se puede usar var() directamente en content; lo resolvemos con data-attr)
    $summary.dataset.icon = iconChar;
    // shadow stylesheet extra:
    const style = document.createElement('style');
    style.textContent = `
      summary::before { content: attr(data-icon); }
    `;
    root.appendChild(style);
  }

  // --- ARIA wiring básico ---
  const contentId = `${(host.id || 'xc')}-content-${Math.random().toString(36).slice(2)}`;
  $content.id = contentId;
  $summary.setAttribute('aria-controls', contentId);
  $summary.setAttribute('role', 'button');

  // Abierto por defecto si host tiene [open]
  if (isOpenAttr) {
    $details.setAttribute('open', '');
    // Preparar estado visual “abierto” (sin salto)
    $content.style.maxHeight = 'none';
    $content.style.marginTop = '1rem';
    $summary.setAttribute('aria-expanded', 'true');
  } else {
    $summary.setAttribute('aria-expanded', 'false');
  }

  // --- Animación “altura auto” con max-height ---
  const animateOpen = () => {
    // medida real
    const full = $content.scrollHeight;
    // set desde 0 → a altura
    $content.style.transition = `max-height ${DURATION}ms ease, margin-top 200ms ease`;
    $content.style.maxHeight = full + 'px';
    $content.style.marginTop = '1rem';
    // después de la animación, fija a 'none' para que crezca con su contenido
    window.clearTimeout(animateOpen._t);
    animateOpen._t = window.setTimeout(() => {
      // si sigue abierto, quitamos el tope
      if ($details.hasAttribute('open')) {
        $content.style.maxHeight = 'none';
      }
    }, DURATION);
  };

  const animateClose = () => {
    // de la altura actual (si none, medir y fijar primero)
    if ($content.style.maxHeight === 'none') {
      const full = $content.scrollHeight;
      $content.style.maxHeight = full + 'px';
      // forzar reflow
      // eslint-disable-next-line no-unused-expressions
      $content.offsetHeight;
    }
    $content.style.transition = `max-height ${DURATION}ms ease, margin-top 150ms ease`;
    $content.style.maxHeight = '0px';
    $content.style.marginTop = '0';
  };

  // --- Cierre de hermanos (modo acordeón) ---
  function closeSiblingsInGroup() {
    if (!groupName) return;
    const all = document.querySelectorAll(`x-collapse[group="${CSS.escape(groupName)}"]`);
    all.forEach(host2 => {
      if (host2 === host) return;
      const root2 = host2.shadowRoot;
      const det2  = root2?.querySelector('details');
      const con2  = root2?.querySelector('.content');
      const sum2  = root2?.querySelector('summary');
      if (det2?.hasAttribute('open')) {
        det2.removeAttribute('open');
        if (con2) {
          // animación de cierre en el otro
          if (con2.style.maxHeight === 'none') {
            con2.style.maxHeight = con2.scrollHeight + 'px';
            con2.offsetHeight;
          }
          con2.style.transition = `max-height ${DURATION}ms ease, margin-top 150ms ease`;
          con2.style.maxHeight = '0px';
          con2.style.marginTop = '0';
        }
        sum2?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --- Eventos ---
  // Usamos click del summary para controlar animación manual (en lugar del toggle nativo)
  $summary.addEventListener('click', (ev) => {
    ev.preventDefault(); // evitamos que el <details> cambie estado antes de nuestra animación
    const isOpen = $details.hasAttribute('open');

    if (isOpen) {
      // cerrar
      animateClose();
      // cuando termine, quitar [open]
      window.clearTimeout($summary._t);
      $summary._t = window.setTimeout(() => {
        $details.removeAttribute('open');
      }, DURATION - 10);
      $summary.setAttribute('aria-expanded', 'false');
    } else {
      // abrir
      // si es acordeón, cierra hermanos antes
      closeSiblingsInGroup();
      $details.setAttribute('open', '');
      // animar apertura
      // fijamos maxHeight temporal → luego a 'none'
      $content.style.maxHeight = '0px';
      $content.style.marginTop = '0';
      // reflow
      $content.offsetHeight;
      animateOpen();
      $summary.setAttribute('aria-expanded', 'true');
    }
  });

  // Soporte por si programáticamente se cambia [open]
  // (ej. host.setAttribute('open','') o removeAttribute)
  const obs = new MutationObserver(() => {
    const isOpen = $details.hasAttribute('open');
    if (isOpen) {
      $summary.setAttribute('aria-expanded', 'true');
      if ($content.style.maxHeight !== 'none') animateOpen();
    } else {
      $summary.setAttribute('aria-expanded', 'false');
      if ($content.style.maxHeight !== '0px') animateClose();
    }
  });
  obs.observe($details, { attributes: true, attributeFilter: ['open'] });

  // Accesibilidad: cerrar con Escape si está abierto y el foco está dentro
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $details.hasAttribute('open')) {
      animateClose();
      window.setTimeout(() => $details.removeAttribute('open'), Math.min(DURATION, 300));
      $summary.setAttribute('aria-expanded', 'false');
      // devuelve el foco al summary
      $summary.focus?.();
    }
  }, { capture: true });
}

registerComponent('x-collapse', tpl, { shadow: true, setup });
