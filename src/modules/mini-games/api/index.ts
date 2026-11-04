import { createLocalApi } from './local';
import { MiniGamesApi } from './contracts';

/**
 * Точка подмены транспорта.
 *
 * Сейчас работает локальный мок. Когда появится Intervallum-Core,
 * достаточно добавить createHttpApi() и переключить реализацию здесь —
 * экраны и рендереры останутся без изменений.
 */
export const miniGamesApi: MiniGamesApi = createLocalApi();

export type { GradeRequest, GradeResponse, MiniGamesApi } from './contracts';
