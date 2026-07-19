'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface MetricCardConfig {
  id: string;
  label: string;
  value: number | string;
  icon: LucideIcon;
  suffix?: string;
}

interface MetricCardsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  cards: MetricCardConfig[];
  columns?: 2 | 3 | 4 | 5 | 6 | 8;
}

export default function MetricCards({
  activeFilter,
  onFilterChange,
  cards,
  columns = 5,
}: MetricCardsProps) {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    8: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8',
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-3.5 w-full`}>
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-24 select-none relative group ${
              isActive
                ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/10 scale-[1.02]'
                : 'bg-card border-border hover:border-primary/50 hover:bg-primary-light/30 text-foreground hover:shadow-xs'
            }`}
          >
            <div className="flex justify-between items-start gap-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block transition-opacity ${
                  isActive ? 'text-primary-foreground/80' : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                {card.label}
              </span>
              <IconComponent
                className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-primary-foreground/70' : 'text-muted-foreground group-hover:text-primary'
                }`}
              />
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <p className="text-2xl font-extrabold font-mono tracking-tight leading-none">
                {card.value}{card.suffix || ''}
              </p>
              {isActive && (
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground/60 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-foreground"></span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
