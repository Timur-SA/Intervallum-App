# Рендереры заданий

Каждый тип задания — самостоятельный компонент с единым контрактом.
Карта, сессии, прогрессия, грейдинг и босс о них ничего не знают:
`SessionRunner` берёт компонент из `registry.tsx`.

## Контракт

```ts
interface TaskViewProps<T extends AnyTask> {
  task: T;                    // задание нужного типа
  step: number;               // индекс текущего задания (0-based)
  total: number;              // всего заданий в фазе
  seed?: string;              // сид сессии для перемешивания вариантов
  headerRight?: ReactNode;    // слот в шапке (таймер босса)
  onDone: (grade: GradeResponse) => void;
}
```

`GradeResponse`:

```ts
{
  outcome: 'correct' | 'partial' | 'wrong';
  score: number;              // 0..1, доля засчитанного ответа
  xpByTopic: Partial<Record<TopicId, number>>;
  correctAnswer: TaskAnswer | null;
}
```

## Как заменить рендерер

1. Написать компонент с этим контрактом.
2. Подменить соответствующую строку в `registry.tsx`:

```ts
export const TASK_RENDERERS: Record<string, TaskRenderer> = {
  interactive: MyFormulaView, // было InteractiveTaskView
};
```

Больше ничего менять не нужно.

## Текущие адаптеры

| Тип | Файл | Внешняя зависимость |
|---|---|---|
| `forces` | `ForceTaskView.tsx` | `modules/force-lab` (канвас, валидатор) |
| `interactive` | `InteractiveTaskView.tsx` | `modules/formula-trainer` (движок формул) |

Эти два файла — единственное место, где мини-игры знают о внешних модулях.
Если другой разработчик делает свою версию — достаточно заменить один файл
и одну строку в реестре.
