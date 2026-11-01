import { describe, it, expect } from 'vitest';
import { FORCE_TASKS } from '../data/tasks';
import { DEFAULT_TOLERANCES, validatePlacement } from './validator';
import { insideRegion, regionOrigin } from './placement';
import { DrawnVector, ForceTask } from '../types';

const fixture = (task: ForceTask, scale = 1): DrawnVector[] =>
  task.refs.map(r => ({
    type: r.type,
    ...regionOrigin(r.region),
    dx: r.dx * scale,
    dy: r.dy * scale,
  }));

describe('Physics test suite: 83 fixtures and boundary assertions', () => {
  for (const task of FORCE_TASKS) {
    for (const scale of [0.4, 0.7, 1, 1.5, 2]) {
      it(`${task.title} scale ${scale}`, () => {
        expect(validatePlacement(task, fixture(task, scale), DEFAULT_TOLERANCES).passed).toBe(true);
      });
    }

    for (const ref of task.refs) {
      it(`${task.title} ${ref.type} application boundary`, () => {
        const p = regionOrigin(ref.region);
        if (ref.region.kind === 'point') {
          expect(insideRegion({ x: p.x + ref.region.radius, y: p.y }, ref.region)).toBe(true);
          expect(insideRegion({ x: p.x + ref.region.radius + 0.01, y: p.y }, ref.region)).toBe(false);
        } else {
          expect(insideRegion(ref.region.a, ref.region)).toBe(true);
          expect(insideRegion(ref.region.b, ref.region)).toBe(true);
          expect(insideRegion({ x: p.x + 200, y: p.y + 200 }, ref.region)).toBe(false);
        }
      });
    }

    it(`${task.title} missing force fails`, () => {
      expect(validatePlacement(task, fixture(task).slice(1), DEFAULT_TOLERANCES).passed).toBe(false);
    });

    it(`${task.title} reversed force fails`, () => {
      const v = fixture(task);
      v[0].dx *= -1;
      v[0].dy *= -1;
      expect(validatePlacement(task, v, DEFAULT_TOLERANCES).passed).toBe(false);
    });

    const gravity = task.refs.find(r => r.type === 'gravity');
    for (let i = 0; i < task.refs.length; i++) {
      if (gravity && task.refs[i].type !== 'gravity' && !insideRegion(regionOrigin(gravity.region), task.refs[i].region)) {
        it(`${task.title} contact origin cannot be replaced with center`, () => {
          const v = fixture(task);
          const center = regionOrigin(gravity.region);
          Object.assign(v[i], center);
          const result = validatePlacement(task, v, DEFAULT_TOLERANCES);
          expect(result.passed).toBe(false);
          expect(result.issuesByType[v[i].type][0].code).toBe('origin');
        });
      }
    }
  }

  it('Relative-length error names both forces', () => {
    const v = fixture(FORCE_TASKS[1]);
    v[0].dy *= 2.2;
    const result = validatePlacement(FORCE_TASKS[1], v, DEFAULT_TOLERANCES);
    expect(result.badTypes.includes('gravity') && result.badTypes.includes('normal')).toBe(true);
    expect(result.issuesByType.gravity[0].code).toBe('ratio');
  });

  it('Ratio tolerance boundary is multiplicative and reciprocal', () => {
    const edge = 1 + DEFAULT_TOLERANCES.lengthTolerance / 100;
    for (const factor of [edge - 0.01, 1 / (edge - 0.01)]) {
      const v = fixture(FORCE_TASKS[1]);
      v[0].dy *= factor;
      expect(validatePlacement(FORCE_TASKS[1], v, DEFAULT_TOLERANCES).passed).toBe(true);
    }
    for (const factor of [edge + 0.01, 1 / (edge + 0.01)]) {
      const v = fixture(FORCE_TASKS[1]);
      v[0].dy *= factor;
      expect(validatePlacement(FORCE_TASKS[1], v, DEFAULT_TOLERANCES).passed).toBe(false);
    }
  });

  it('Magnetic conductor field to right and current toward viewer gives upward Ampere force', () => {
    const task = FORCE_TASKS.find(t => t.kind === 'magnetic')!;
    expect(task).toBeDefined();
    const answer: DrawnVector[] = [
      { type: 'gravity', x: 180, y: 200, dx: 0, dy: 85 },
      { type: 'amper', x: 180, y: 200, dx: 0, dy: -85 },
    ];
    expect(validatePlacement(task, answer, DEFAULT_TOLERANCES).passed).toBe(true);
    answer[1].dy = 85;
    expect(validatePlacement(task, answer, DEFAULT_TOLERANCES).passed).toBe(false);
  });

  it('Radiation pressure on sail pushes away from light source', () => {
    const task = FORCE_TASKS.find(t => t.kind === 'sail')!;
    expect(task).toBeDefined();
    const answer: DrawnVector[] = [
      { type: 'radiation', x: 213, y: 190, dx: 90, dy: 0 },
      { type: 'tension', x: 213, y: 190, dx: -90, dy: 0 },
    ];
    expect(validatePlacement(task, answer, DEFAULT_TOLERANCES).passed).toBe(true);
    answer[0].dx = -90;
    expect(validatePlacement(task, answer, DEFAULT_TOLERANCES).passed).toBe(false);
  });

  it('Lever authored forces balance translation and torque about the support', () => {
    const task = FORCE_TASKS.find(t => t.kind === 'lever')!;
    const v = fixture(task);
    expect(v.reduce((s, f) => s + f.dy, 0)).toBe(0);
    expect(v.reduce((s, f) => s + (f.x - 120) * f.dy - (f.y - 208) * f.dx, 0)).toBe(0);
  });
});
