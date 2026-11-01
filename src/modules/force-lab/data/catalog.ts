import { ForceCatalogItem, ForceType } from '../types';

export const FORCE_CATALOG: Record<ForceType, ForceCatalogItem> = {
  gravity: {
    id: 'gravity',
    name: 'Сила тяжести',
    tex: String.raw`\vec{F}_{\text{т}}`,
    formula: String.raw`F_{\text{т}}=mg`,
    topic: 'mechanics',
  },
  normal: {
    id: 'normal',
    name: 'Реакция опоры',
    tex: String.raw`\vec{N}`,
    note: 'Перпендикулярна поверхности',
    topic: 'mechanics',
  },
  elastic: {
    id: 'elastic',
    name: 'Сила упругости',
    tex: String.raw`\vec{F}_{\text{упр}}`,
    formula: String.raw`F_{\text{упр}}=k|\Delta l|`,
    topic: 'mechanics',
  },
  friction: {
    id: 'friction',
    name: 'Сила трения',
    tex: String.raw`\vec{F}_{\text{тр}}`,
    formula: String.raw`F_{\text{тр}}=\mu N`,
    note: 'При скольжении',
    topic: 'mechanics',
  },
  tension: {
    id: 'tension',
    name: 'Натяжение нити',
    tex: String.raw`\vec{T}`,
    note: 'Вдоль нити',
    topic: 'mechanics',
  },
  electric: {
    id: 'electric',
    name: 'Электрическая сила',
    tex: String.raw`\vec{F}_{\text{э}}`,
    formula: String.raw`\vec{F}=q\vec{E}`,
    topic: 'electrostatics',
  },
  coulomb: {
    id: 'coulomb',
    name: 'Кулоновская сила',
    tex: String.raw`\vec{F}_{\text{к}}`,
    formula: String.raw`F=k\frac{|q_1q_2|}{r^2}`,
    topic: 'electrostatics',
  },
  amper: {
    id: 'amper',
    name: 'Сила Ампера',
    tex: String.raw`\vec{F}_{\text{А}}`,
    formula: String.raw`F_{\text{А}}=I\ell B\sin\alpha`,
    topic: 'magnetism',
  },
  radiation: {
    id: 'radiation',
    name: 'Сила светового давления',
    tex: String.raw`\vec{F}_{\text{св}}`,
    formula: String.raw`F_{\text{св}}=\frac{2P}{c}`,
    note: 'Идеальное зеркало, свет по нормали',
    topic: 'optics',
  },
};
