import type { CourseCategory } from '@prisma/client';

export const CATEGORY_DISPLAY: Record<CourseCategory, string> = {
  tech: 'Technology',
  health: 'Health',
  leadership: 'Leadership',
  environment: 'Environment',
  agriculture: 'Agriculture',
  skill_dev: 'Skill Development',
  basic_digital: 'Basic Digital',
};

export const ALL_CATEGORY_LABELS: string[] = Object.values(CATEGORY_DISPLAY);

export const CATEGORY_BY_LABEL: Record<string, CourseCategory> = Object.fromEntries(
  Object.entries(CATEGORY_DISPLAY).map(([db, label]) => [label, db as CourseCategory]),
);
