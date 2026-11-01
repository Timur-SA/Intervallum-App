export interface VariableMeta {
  name: string;
  unit: string;
}

export interface EquationSide {
  num: string[];
  den: string[];
}

export interface EquationStructure {
  left: EquationSide;
  right: EquationSide;
}

export interface PhysicalLaw {
  id: string;
  name: string;
  category: 'Электричество' | 'Механика' | 'Термодинамика';
  latex: string;
  structure: EquationStructure;
  variables: Record<string, VariableMeta>;
}

export interface TaskGiven {
  symbol: string;
  value: number;
  unit: string;
  displayLabel: string;
}

export interface TaskFind {
  symbol: string;
  unit: string;
  value: number;
  targetFormula: string;
}

export interface PhysicsTask {
  id: string;
  title: string;
  category: 'Электричество' | 'Механика' | 'Термодинамика';
  difficulty: 1 | 2 | 3;
  description: string;
  givens: TaskGiven[];
  find: TaskFind;
  hint: string;
  explanation: string;
}

export interface VariableValueState {
  value: number | null;
  source: 'given' | 'link' | 'manual' | null;
  ref: { cardId: number; symbol: string } | null;
  name: string;
  unit: string;
}

export interface ComputedResult {
  symbol: string;
  value: number;
  unit: string;
}

export interface FormulaCard {
  id: number;
  law: PhysicalLaw;
  structure: EquationStructure;
  values: Record<string, VariableValueState>;
  computed: ComputedResult | null;
}
