import { ForceTask, Point, Region } from '../types';

const angle = (25 * Math.PI) / 180;
const slopePoint = (x: number, y: number): Point => ({
  x: 180 + x * Math.cos(angle) + y * Math.sin(angle),
  y: 205 - x * Math.sin(angle) + y * Math.cos(angle),
});

const pointRegion = (center: Point, hint: string, radius = 13): Region => ({
  kind: 'point',
  ...center,
  radius,
  hint,
});

const contactRegion = (a: Point, b: Point, hint: string): Region => ({
  kind: 'segment',
  a,
  b,
  radius: 11,
  hint,
});

const centerHint = 'начни стрелку в центре масс бруска';

export const FORCE_TASKS: ForceTask[] = [
  {
    id: 'incline',
    title: 'Брусок на склоне',
    condition: 'Брусок покоится на гладкой плоскости. Пружина растянута.',
    kind: 'incline',
    body: 'block',
    assessment: 'on-body-no-torque',
    refs: [
      {
        type: 'gravity',
        interaction: 'earth',
        region: pointRegion({ x: 180, y: 205 }, centerHint, 16),
        dx: 0,
        dy: 110,
      },
      {
        type: 'normal',
        interaction: 'slope',
        region: contactRegion(
          slopePoint(-41, 36),
          slopePoint(41, 36),
          'начни стрелку на границе контакта бруска с плоскостью'
        ),
        dx: -110 * Math.cos(angle) * Math.sin(angle),
        dy: -110 * Math.cos(angle) ** 2,
      },
      {
        type: 'elastic',
        interaction: 'spring',
        region: pointRegion(slopePoint(41, 0), 'начни стрелку у крепления пружины к бруску'),
        dx: 110 * Math.sin(angle) * Math.cos(angle),
        dy: -110 * Math.sin(angle) ** 2,
      },
    ],
  },
  {
    id: 'table',
    title: 'Брусок на столе',
    condition: 'Брусок покоится на горизонтальном столе. Других тел сверху нет.',
    kind: 'table',
    body: 'block',
    assessment: 'on-body-no-torque',
    refs: [
      {
        type: 'gravity',
        interaction: 'earth',
        region: pointRegion({ x: 180, y: 190 }, centerHint, 16),
        dx: 0,
        dy: 95,
      },
      {
        type: 'normal',
        interaction: 'table',
        region: contactRegion(
          { x: 135, y: 227 },
          { x: 225, y: 227 },
          'начни стрелку на границе контакта бруска со столом'
        ),
        dx: 0,
        dy: -95,
      },
    ],
  },
  {
    id: 'hanging',
    title: 'Груз на нити',
    condition: 'Груз неподвижно висит на вертикальной нити.',
    kind: 'hanging',
    body: 'load',
    assessment: 'on-body-no-torque',
    refs: [
      {
        type: 'gravity',
        interaction: 'earth',
        region: pointRegion({ x: 180, y: 200 }, 'начни стрелку в центре масс груза', 16),
        dx: 0,
        dy: 100,
      },
      {
        type: 'tension',
        interaction: 'thread',
        region: pointRegion({ x: 180, y: 165 }, 'начни стрелку у крепления нити к грузу'),
        dx: 0,
        dy: -100,
      },
    ],
  },
  {
    id: 'magnetic',
    title: 'Проводник в магнитном поле',
    condition: 'Ток направлен к нам (точка), поле — вправо. Проводник неподвижен: магнитная сила уравновешивает тяжесть.',
    kind: 'magnetic',
    topic: 'magnetism',
    body: 'wire',
    assessment: 'on-body-no-torque',
    refs: [
      {
        type: 'gravity',
        interaction: 'earth',
        region: pointRegion({ x: 180, y: 200 }, 'начни стрелку в центре масс проводника', 16),
        dx: 0,
        dy: 95,
      },
      {
        type: 'amper',
        interaction: 'magnetic-field',
        region: pointRegion({ x: 180, y: 200 }, 'начни стрелку на проводнике', 16),
        dx: 0,
        dy: -95,
      },
    ],
  },
  {
    id: 'sail',
    title: 'Свет давит на парус',
    condition: 'Зеркальный парус неподвижен на натянутой нити. Свет падает слева. Тяготением пренебречь.',
    kind: 'sail',
    topic: 'optics',
    body: 'sail',
    assessment: 'on-body-no-torque',
    refs: [
      {
        type: 'radiation',
        interaction: 'light',
        region: contactRegion({ x: 213, y: 142 }, { x: 213, y: 238 }, 'начни стрелку на освещённой поверхности паруса'),
        dx: 95,
        dy: 0,
      },
      {
        type: 'tension',
        interaction: 'thread',
        region: pointRegion({ x: 213, y: 190 }, 'начни стрелку у крепления нити к парусу'),
        dx: -95,
        dy: 0,
      },
    ],
  },
  {
    id: 'lever',
    title: 'Рычаг и нить',
    condition: 'Однородный рычаг неподвижен. Его удерживают опора и вертикальная нить.',
    kind: 'lever',
    body: 'lever',
    assessment: 'authored-lever-equilibrium',
    refs: [
      {
        type: 'gravity',
        interaction: 'earth',
        region: pointRegion({ x: 180, y: 200 }, 'начни стрелку в центре масс рычага', 16),
        dx: 0,
        dy: 100,
      },
      {
        type: 'normal',
        interaction: 'pivot',
        region: pointRegion({ x: 120, y: 208 }, 'начни стрелку в месте контакта рычага с опорой', 11),
        dx: 0,
        dy: -50,
      },
      {
        type: 'tension',
        interaction: 'thread',
        region: pointRegion({ x: 240, y: 192 }, 'начни стрелку у крепления нити к рычагу'),
        dx: 0,
        dy: -50,
      },
    ],
  },
];
