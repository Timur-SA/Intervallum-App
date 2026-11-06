import { MathText } from '../../../shared/components/MathView';
import React from 'react';
import { CellSimple, Checkbox, Radio } from '@maxhub/max-ui';
import { Check, X } from 'lucide-react';

export type OptionMark = 'none' | 'correct' | 'wrong';

interface AnswerOptionProps {
  name: string;
  value: string;
  text: string;
  selected: boolean;
  multiple?: boolean;
  locked?: boolean;
  mark?: OptionMark;
  onSelect: () => void;
}

/**
 * Строка варианта ответа на базе CellSimple из MAX UI.
 * Radio/Checkbox отвечают за семантику и доступность, а состояния
 * (выбрано / верно / ошибка) задаются модификаторами mg-option.
 */
export const AnswerOption: React.FC<AnswerOptionProps> = ({
  name,
  value,
  text,
  selected,
  multiple = false,
  locked = false,
  mark = 'none',
  onSelect,
}) => {
  const className = [
    'mg-option',
    selected ? 'mg-option--selected' : '',
    mark === 'correct' ? 'mg-option--correct' : '',
    mark === 'wrong' ? 'mg-option--wrong' : '',
    locked ? 'mg-option--locked' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const control = multiple ? (
    <Checkbox name={name} value={value} checked={selected} onChange={onSelect} />
  ) : (
    <Radio name={name} value={value} checked={selected} onChange={onSelect} />
  );

  return (
    <CellSimple
      as="label"
      className={className}
      height="normal"
      title={<MathText text={text} />}
      before={control}
      after={
        mark === 'correct' ? (
          <Check size={18} color="var(--success)" aria-hidden />
        ) : mark === 'wrong' ? (
          <X size={18} color="var(--danger)" aria-hidden />
        ) : null
      }
    />
  );
};
