import React from 'react';
import { Cog, Thermometer, Zap } from 'lucide-react';
import { SectionId } from '../domain/types';

/** Осмысленные иконки разделов. */
export const SECTION_ICONS: Record<SectionId, React.ComponentType<{ size?: number }>> = {
  mechanics: Cog,
  thermal: Thermometer,
  electromagnetism: Zap,
};
