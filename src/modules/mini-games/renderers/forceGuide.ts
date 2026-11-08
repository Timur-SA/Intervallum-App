import { regionOrigin } from '../../force-lab/engine/placement';
import { validatePlacement } from '../../force-lab/engine/validator';
import type { DrawnVector, ForceTask, ForceType } from '../../force-lab/types';

interface ForceGuideStep {
  title: string;
  instruction: string;
  origin?: { x: number; y: number };
}

export function getForceGuideStep(
  task: ForceTask,
  vectors: DrawnVector[],
  selectedForce: ForceType | null,
): ForceGuideStep {
  if (task.kind !== 'table') {
    if (selectedForce && !vectors.some(vector => vector.type === selectedForce)) {
      return {
        title: 'Проведи стрелку',
        instruction: 'Начни там, где сила приложена к телу, и тяни в сторону её действия. Начало и наконечник стрелки можно двигать.',
      };
    }

    return vectors.length ? {
      title: 'Сравни стрелки',
      instruction: 'Проверь, что учтены все взаимодействия. Равным силам соответствуют равные длины стрелок. Затем нажми «Проверить».',
    } : {
      title: 'Найди, что действует на тело',
      instruction: 'Посмотри, что тянет, толкает или поддерживает тело. Выбери соответствующую силу в каталоге.',
    };
  }

  const { issuesByType } = validatePlacement(task, vectors);
  const needsPlacement = (type: ForceType) =>
    issuesByType[type]?.some(issue => issue.code !== 'ratio');

  if (needsPlacement('gravity')) {
    const gravity = task.refs.find(ref => ref.type === 'gravity');
    return {
      title: '1 из 3 · Сила тяжести',
      instruction: selectedForce === 'gravity'
        ? 'Начни в центре бруска и протяни стрелку вертикально вниз.'
        : 'Земля тянет брусок вниз. В каталоге выбери «Сила тяжести».',
      origin: selectedForce === 'gravity' && gravity ? regionOrigin(gravity.region) : undefined,
    };
  }

  if (needsPlacement('normal')) {
    const normal = task.refs.find(ref => ref.type === 'normal');
    return {
      title: '2 из 3 · Реакция опоры',
      instruction: selectedForce === 'normal'
        ? 'Начни в точке контакта бруска со столом и потяни вертикально вверх.'
        : 'Стол толкает брусок перпендикулярно поверхности. В каталоге выбери «Реакция опоры».',
      origin: selectedForce === 'normal' && normal ? regionOrigin(normal.region) : undefined,
    };
  }

  return {
    title: '3 из 3 · Сравни длины',
    instruction: 'Брусок покоится, поэтому эти две силы уравновешиваются. Сделай стрелки одинаковой длины и нажми «Проверить».',
  };
}
