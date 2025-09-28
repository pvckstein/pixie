// src/index.js
import { loadDoT, applyDoTPatch } from './engine.js';

// Parchea doT ANTES de registrar componentes (por si algún comp quisiera compilar ya)
const doT = await loadDoT();
applyDoTPatch(doT);

// Registra tus componentes (cada uno compila perezosamente al conectarse)
import './components/popover.js';

// (a futuro) import './components/tooltip.js'; etc.
