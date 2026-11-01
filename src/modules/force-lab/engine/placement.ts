import { PlacementCheck, Point, Region } from '../types';

export function applicationPlacement(p: Point, region: Region): PlacementCheck {
  let target: Point = { x: (region as any).x ?? 0, y: (region as any).y ?? 0 };

  if (region.kind === 'segment') {
    const dx = region.b.x - region.a.x;
    const dy = region.b.y - region.a.y;
    const denom = dx * dx + dy * dy || 1;
    const t = Math.max(
      0,
      Math.min(1, ((p.x - region.a.x) * dx + (p.y - region.a.y) * dy) / denom)
    );
    target = { x: region.a.x + t * dx, y: region.a.y + t * dy };
  } else if (region.kind === 'point') {
    target = { x: region.x, y: region.y };
  }

  const distance = Math.hypot(p.x - target.x, p.y - target.y);
  return {
    valid: Number.isFinite(distance) && distance <= region.radius + 1e-9,
    target,
    distance,
    tolerance: region.radius,
  };
}

export const insideRegion = (p: Point, region: Region): boolean =>
  applicationPlacement(p, region).valid;

export const regionOrigin = (region: Region): Point => {
  if (region.kind === 'point') return { x: region.x, y: region.y };
  return { x: (region.a.x + region.b.x) / 2, y: (region.a.y + region.b.y) / 2 };
};
