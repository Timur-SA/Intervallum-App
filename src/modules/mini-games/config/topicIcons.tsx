import React from 'react';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Atom,
  BatteryCharging,
  Cable,
  CircleDot,
  Droplet,
  Factory,
  Flame,
  Heater,
  Magnet,
  MoveRight,
  Navigation,
  Plus,
  Scale,
  Snowflake,
  Thermometer,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import { TopicId } from '../domain/types';

/**
 * Логичная иконка для каждого уровня-темы.
 * Разделы и босс используют свои иконки в JourneyMapScreen.
 */
export const TOPIC_ICONS: Record<TopicId, React.ComponentType<{ size?: number }>> = {
  'uniform-motion': MoveRight,
  relativity: Navigation,
  'accelerated-motion': TrendingUp,
  'free-fall': ArrowDownToLine,
  momentum: CircleDot,
  'mechanical-energy': BatteryCharging,
  'work-power': Wrench,
  lever: Scale,
  density: Droplet,

  'heat-amount': Thermometer,
  'aggregate-states': Snowflake,
  'heat-balance': ArrowLeftRight,
  'thermal-energy': Flame,
  'fuel-engines': Factory,

  coulomb: Atom,
  'charge-conservation': Plus,
  resistance: Cable,
  ohm: Zap,
  'joule-lenz': Heater,
  ampere: Magnet,
};
