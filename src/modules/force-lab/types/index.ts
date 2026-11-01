export type ForceType =
  | 'gravity'
  | 'normal'
  | 'elastic'
  | 'friction'
  | 'tension'
  | 'electric'
  | 'coulomb'
  | 'amper'
  | 'radiation';

export type PhysicsTopic = 'mechanics' | 'electrostatics' | 'magnetism' | 'optics';

export interface ForceCatalogItem {
  id: ForceType;
  name: string;
  tex: string;
  formula?: string;
  note?: string;
  topic: PhysicsTopic;
}

export type Point = { x: number; y: number };

export type Region =
  | { kind: 'point'; x: number; y: number; radius: number; hint: string }
  | { kind: 'segment'; a: Point; b: Point; radius: number; hint: string };

export interface ReferenceVector {
  type: ForceType;
  interaction: string;
  region: Region;
  dx: number;
  dy: number;
}

export interface ForceTask {
  id: string;
  title: string;
  condition: string;
  kind: 'incline' | 'table' | 'hanging' | 'magnetic' | 'sail' | 'lever';
  topic?: PhysicsTopic;
  body: 'block' | 'load' | 'wire' | 'sail' | 'lever';
  assessment: string;
  refs: ReferenceVector[];
}

export interface DrawnVector {
  type: ForceType;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface PlacementCheck {
  valid: boolean;
  target: Point;
  distance: number;
  tolerance: number;
}

export interface Issue {
  code: 'origin' | 'direction' | 'ratio' | 'missing' | 'extra';
  message: string;
  placement?: PlacementCheck;
  angleDegrees?: number | null;
  otherType?: ForceType;
}

export interface ValidationResult {
  passed: boolean;
  badTypes: ForceType[];
  messages: string[];
  issuesByType: Record<string, Issue[]>;
}

export interface ReviewEntry {
  type: ForceType;
  drawn: DrawnVector | null;
  expected: DrawnVector | null;
  region: Region | null;
  issues: Issue[];
  other: DrawnVector | null;
  scale: number;
}
