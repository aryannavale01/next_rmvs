'use client';

import { useState } from 'react';
import { TRANSLATIONS } from '@/lib/dashboard-context';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { getPastTimestamp } from '@/lib/purity-helpers';
import {
  History,
  GraduationCap,
  FileCheck,
  Percent,
  Award,
  User,
  Clock,
} from 'lucide-react';
import { motion } from 'motion/react';
import { EmptyState, TimelineSkeleton } from '@/components/dashboard-ui';

export default function ActivityPage() {
  const { activities } = useDashboardData();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Filter tabs: 'All' | 'Today' | 'This Week' | 'This Month'
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Today' | 'This Week' | 'This Month'>('All');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <GraduationCap size={14} className="text-white" />;
      case 'document':
        return <FileCheck size={14} className="text-white" />;
      case 'coupon':
        return <Percent size={14} className="text-white" />;
      case 'certificate':
        return <Award size={14} className="text-white" />;
      default:
        return <User size={14} className="text-white" />;
    }
  };

  const formatActivityTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      // If today
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        const hours = date.getHours();
        const mins = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        return `Today at ${formattedHours}:${mins} ${ampm}`;
      }
      
      // format as standard locale date
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Filter logic
  const filteredActivities = activities.filter((act) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Today') {
      const actDate = new Date(act.time).toDateString();
      const today = new Date().toDateString();
      return actDate === today;
    }
    if (selectedFilter === 'This Week') {
      // Simple approximate check for last 7 days
      const actTime = new Date(act.time).getTime();
      const sevenDaysAgo = getPastTimestamp(7);
      return actTime >= sevenDaysAgo;
    }
    if (selectedFilter === 'This Month') {
      // Simple approximate check for last 30 days
      const actTime = new Date(act.time).getTime();
      const thirtyDaysAgo = getPastTimestamp(30);
      return actTime >= thirtyDaysAgo;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SEGMENTED FILTER TABS */}
      <div className="flex justify-center">
        <div role="tablist" className="bg-border p-1 rounded-xl flex w-full max-w-md shadow-sm border border-border">
          {(['All', 'Today', 'This Week', 'This Month'] as const).map((filter) => (
            <button
              key={filter}
              id={`tab-${filter.toLowerCase().replace(/\s+/g, '-')}`}
              role="tab"
              aria-selected={selectedFilter === filter}
              aria-controls={`tabpanel-${filter.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedFilter(filter)}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === filter
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter === 'All' ? t.all : filter === 'Today' ? t.today : filter === 'This Week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVITY TIMELINE BLOCK */}
      <div id={`tabpanel-${selectedFilter.toLowerCase().replace(/\s+/g, '-')}`} role="tabpanel" aria-labelledby={`tab-${selectedFilter.toLowerCase().replace(/\s+/g, '-')}`} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="border-b border-border pb-4">
          <h3 className="font-bold text-foreground text-base flex items-center gap-2">
            <History size={18} className="text-primary" />
            {t.timeline}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Audit log detailing transaction histories, file updates, and application progress</p>
        </div>

        {filteredActivities.length === 0 ? (
          <EmptyState
            icon={History}
            title="No recent logs found"
            description="There are no actions logged within this selected timeframe filter."
            actionText="Show All Activities"
            onAction={() => setSelectedFilter('All')}
          />
        ) : (
          <div className="relative pl-8 space-y-8 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-primary/10">
            {filteredActivities.map((act, idx) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-2"
              >
                {/* Connecting Circle Icon Dot */}
                <div className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/20 z-10 scale-95 hover:scale-105 transition-transform">
                  {getActivityIcon(act.type)}
                </div>

                {/* Left Text details */}
                <div className="pl-2 space-y-1 min-w-0 flex-1">
                  <h4 className="text-xs md:text-sm font-bold text-foreground leading-tight">
                    {act.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed pr-6">
                    {act.description}
                  </p>
                </div>

                {/* Right Time stamp */}
                <div className="pl-2 sm:pl-0 shrink-0 self-start sm:self-auto text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <Clock size={10} />
                  <span>{formatActivityTime(act.time)}</span>
                </div>

              </motion.div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
