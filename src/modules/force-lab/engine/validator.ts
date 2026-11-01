import {
  DrawnVector,
  ForceTask,
  ForceType,
  Issue,
  ReviewEntry,
  ValidationResult,
} from '../types';
import { FORCE_CATALOG } from '../data/catalog';
import { applicationPlacement, insideRegion, regionOrigin } from './placement';

export interface Tolerances {
  angleTolerance: number; // degrees, default 15
  lengthTolerance: number; // percentage, default 80 (meaning 1.8 ratio factor)
}

export const DEFAULT_TOLERANCES: Tolerances = {
  angleTolerance: 15,
  lengthTolerance: 80,
};

export function validatePlacement(
  task: ForceTask,
  vectors: DrawnVector[],
  tolerances: Tolerances = DEFAULT_TOLERANCES
): ValidationResult {
  const refs = task.refs;
  const badTypes: ForceType[] = [];
  const messages: string[] = [];
  const issuesByType: Record<string, Issue[]> = {};

  const issue = (
    type: ForceType,
    code: Issue['code'],
    message: string,
    details: Partial<Issue> = {}
  ) => {
    if (!badTypes.includes(type)) badTypes.push(type);
    if (!issuesByType[type]) issuesByType[type] = [];
    issuesByType[type].push({ code, message, ...details });
  };

  // 1. Missing forces
  const missing = refs.filter(r => !vectors.some(v => v.type === r.type));
  if (missing.length) {
    messages.push(
      'Не хватает сил: ' +
        missing.map(r => FORCE_CATALOG[r.type].name.toLowerCase()).join(', ') +
        '.'
    );
  }
  missing.forEach(r =>
    issue(r.type, 'missing', 'Добавь эту силу: она действует на тело.')
  );

  // 2. Extra forces
  const extras = vectors.filter(v => !refs.some(r => r.type === v.type));
  extras.forEach(v => {
    const message =
      FORCE_CATALOG[v.type]?.name + ': в этой ситуации не действует на тело.';
    issue(v.type, 'extra', message);
    messages.push(message);
  });

  // 3. Application point & direction for drawn matching forces
  const pairs = refs
    .map(r => ({ r, v: vectors.find(v => v.type === r.type) }))
    .filter((p): p is { r: typeof p.r; v: DrawnVector } => Boolean(p.v));

  for (const { r, v } of pairs) {
    const length = Math.hypot(v.dx, v.dy);
    const refLength = Math.hypot(r.dx, r.dy);
    const cos = (v.dx * r.dx + v.dy * r.dy) / (length * refLength);
    const issuesList: string[] = [];
    const placement = applicationPlacement(v, r.region);

    if (!placement.valid) {
      issuesList.push(r.region.hint);
      issue(v.type, 'origin', r.region.hint, { placement });
    }

    const cosLimit = Math.cos((tolerances.angleTolerance * Math.PI) / 180);
    if (!Number.isFinite(cos) || cos < cosLimit) {
      issuesList.push('поправь направление');
      const angleDeg = Number.isFinite(cos)
        ? (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
        : null;
      issue(v.type, 'direction', 'поправь направление', {
        angleDegrees: angleDeg,
      });
    }

    if (issuesList.length) {
      messages.push(FORCE_CATALOG[v.type].name + ': ' + issuesList.join('; ') + '.');
    }
  }

  // 4. Relative length ratios among all pairs
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const a = pairs[i];
      const b = pairs[j];
      const sa = Math.hypot(a.v.dx, a.v.dy) / Math.hypot(a.r.dx, a.r.dy);
      const sb = Math.hypot(b.v.dx, b.v.dy) / Math.hypot(b.r.dx, b.r.dy);

      if (
        !(sa > 0 && sb > 0) ||
        Math.abs(Math.log(sa / sb)) > Math.log1p(tolerances.lengthTolerance / 100)
      ) {
        const message =
          'Проверь соотношение длин: ' +
          FORCE_CATALOG[a.v.type].name.toLowerCase() +
          ' и ' +
          FORCE_CATALOG[b.v.type].name.toLowerCase() +
          '.';
        issue(a.v.type, 'ratio', message, { otherType: b.v.type });
        issue(b.v.type, 'ratio', message, { otherType: a.v.type });
        messages.push(message);
      }
    }
  }

  return {
    passed: messages.length === 0,
    badTypes,
    messages,
    issuesByType,
  };
}

export function referenceVectors(
  task: ForceTask,
  vectors: DrawnVector[]
): DrawnVector[] {
  const pairs = task.refs
    .map(r => ({ r, v: vectors.find(v => v.type === r.type) }))
    .filter((p): p is { r: typeof p.r; v: DrawnVector } => Boolean(p.v));

  const denominator = pairs.reduce(
    (sum, { r }) => sum + r.dx * r.dx + r.dy * r.dy,
    0
  );
  const fittedScale = denominator
    ? pairs.reduce(
        (sum, { r, v }) => sum + Math.hypot(v.dx, v.dy) * Math.hypot(r.dx, r.dy),
        0
      ) / denominator
    : 1;

  let scale = Number.isFinite(fittedScale) && fittedScale > 0 ? fittedScale : 1;

  const references: DrawnVector[] = task.refs.map(r => {
    const drawn = vectors.find(v => v.type === r.type);
    const canonical = regionOrigin(r.region);
    const origin =
      drawn && insideRegion(drawn, r.region) ? { x: drawn.x, y: drawn.y } : canonical;
    return { type: r.type, x: origin.x, y: origin.y, dx: r.dx, dy: r.dy };
  });

  const bounds = { left: 18, right: 342, top: 28, bottom: 318 };
  for (const v of references) {
    if (v.dx > 0) scale = Math.min(scale, (bounds.right - v.x) / v.dx);
    if (v.dx < 0) scale = Math.min(scale, (bounds.left - v.x) / v.dx);
    if (v.dy > 0) scale = Math.min(scale, (bounds.bottom - v.y) / v.dy);
    if (v.dy < 0) scale = Math.min(scale, (bounds.top - v.y) / v.dy);
  }
  scale = Math.max(0, scale);

  return references.map(v => ({
    ...v,
    dx: v.dx * scale,
    dy: v.dy * scale,
  }));
}

export function reviewComparisons(
  task: ForceTask,
  vectors: DrawnVector[],
  result: ValidationResult
): ReviewEntry[] {
  const ordered = [...task.refs.map(r => r.type), ...vectors.map(v => v.type)];
  const distinct = [...new Set(ordered)];

  return distinct
    .filter(type => result.issuesByType[type]?.length)
    .map(type => {
      const ref = task.refs.find(r => r.type === type);
      const drawn = vectors.find(v => v.type === type) || null;
      const issues = result.issuesByType[type];
      const ratio = issues.find(i => i.code === 'ratio');
      const other = ratio ? vectors.find(v => v.type === ratio.otherType) : null;
      const otherRef = other ? task.refs.find(r => r.type === other.type) : null;

      let scale = 1;
      if (other && otherRef && Math.hypot(other.dx, other.dy) > 0) {
        scale = Math.hypot(other.dx, other.dy) / Math.hypot(otherRef.dx, otherRef.dy);
      } else if (ref && drawn && Math.hypot(drawn.dx, drawn.dy) > 0) {
        scale = Math.hypot(drawn.dx, drawn.dy) / Math.hypot(ref.dx, ref.dy);
      } else {
        const scales = task.refs
          .flatMap(r => {
            const v = vectors.find(item => item.type === r.type);
            return v && Math.hypot(v.dx, v.dy) > 0
              ? [Math.hypot(v.dx, v.dy) / Math.hypot(r.dx, r.dy)]
              : [];
          })
          .sort((a, b) => a - b);
        if (scales.length) scale = scales[Math.floor(scales.length / 2)];
      }

      let expected: DrawnVector | null = null;
      if (ref) {
        const canonical = regionOrigin(ref.region);
        const origin = drawn
          ? insideRegion(drawn, ref.region)
            ? drawn
            : applicationPlacement(drawn, ref.region).target
          : canonical;
        expected = {
          type,
          x: origin.x,
          y: origin.y,
          dx: ref.dx * scale,
          dy: ref.dy * scale,
        };
      }

      return {
        type,
        drawn,
        expected,
        region: ref?.region || null,
        issues,
        other: other || null,
        scale,
      };
    });
}
