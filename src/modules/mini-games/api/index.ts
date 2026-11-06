import { createResilientApi } from './http';
import { MiniGamesApi } from './contracts';

/**
 * Core is the primary grading transport. If the Core API is unavailable,
 * the local implementation keeps the mini-games usable offline.
 */
export const miniGamesApi: MiniGamesApi = createResilientApi();

export type { GradeRequest, GradeResponse, MiniGamesApi } from './contracts';
export { getCoreUserId } from './http';
