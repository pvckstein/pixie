// src/index.js
import { loadDoT, applyDoTPatch } from './engine.js';
const doT = await loadDoT();
applyDoTPatch(doT);
import './components/popover.js';
import './components/collapse.js';

