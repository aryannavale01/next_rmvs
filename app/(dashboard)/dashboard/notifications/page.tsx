'use client';

import { useDashboard, TRANSLATIONS } from '@/lib/dashboard-context';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  MailCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '@/components/dashboard-ui';

export default function NotificationsPage() {
  const { notifications, markAllAsRead, markAsRead, language } = useDashboard();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-success-text" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-warning-text" />;
      case 'error':
        return <XCircle size={16} className="text-destructive" />;
      default:
        return <Info size={16} className="text-primary" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success-bg border border-success/10';
      case 'warning':
        return 'bg-warning-bg border border-warning/10';
      case 'error':
        return 'bg-destructive-bg border border-destructive/10';
      default:
        return 'bg-primary-light border border-primary/10';
    }
  };

  // Group notifications
  const groups: { [key: string]: typeof notifications } = {
    'Today': notifications.filter(n => n.group === 'Today'),
    'Yesterday': notifications.filter(n => n.group === 'Yesterday'),
    'Earlier': notifications.filter(n => n.group === 'Earlier')
  };

  const hasAnyNotif = notifications.length > 0;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Inbox Alerts</span>
          <p className="text-sm font-bold text-foreground mt-1">
            You have {unreadCount} unread system notifications
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 bg-card hover:bg-primary-light border border-border hover:border-primary/30 text-xs font-semibold rounded-lg text-muted-foreground hover:text-primary transition-all shadow-sm"
          >
            <MailCheck size={14} />
            {t.markAllRead}
          </button>
        )}
      </div>

      {/* NOTIFICATION GROUPS */}
      {!hasAnyNotif ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="You do not have any notifications right now. Systems are fully aligned and running smoothly."
        />
      ) : (
        <div className="space-y-8 bg-card border border-border rounded-xl p-6 shadow-sm">
          
          {(['Today', 'Yesterday', 'Earlier'] as const).map((groupName) => {
            const groupNotifs = groups[groupName];
            if (groupNotifs.length === 0) return null;

            return (
              <div key={groupName} className="space-y-4">
                {/* Sticky Header Group */}
                <h4 className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-widest bg-card sticky top-16 py-1.5 z-10 border-b border-border">
                  {t[groupName === 'Today' ? 'today' : groupName === 'Yesterday' ? 'yesterday' : 'earlier'] || groupName}
                </h4>

                <div className="space-y-3">
                  {groupNotifs.map((notif, idx) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => markAsRead(notif.id)}
                      className={`flex gap-4 items-start p-4 border rounded-xl transition-all duration-200 cursor-pointer relative ${
                        notif.read
                          ? 'bg-card border-border hover:bg-accent'
                          : 'bg-primary-light/25 border-primary/10 hover:bg-primary-light/40 shadow-sm'
                      }`}
                    >
                      {/* Unread Alert Dot */}
                      {!notif.read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary absolute left-2 top-4 shadow-sm" />
                      )}

                      {/* Icon container */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${getIconBg(notif.type)} ml-1.5`}>
                        {getIcon(notif.type)}
                      </div>

                      {/* Text content */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-4">
                          <h5 className={`text-xs md:text-sm leading-snug truncate pr-2 ${notif.read ? 'text-foreground font-semibold' : 'text-primary font-extrabold'}`}>
                            {notif.title}
                          </h5>
                          <span className="text-[10px] text-muted-foreground font-medium shrink-0 pt-0.5">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {notif.description}
                        </p>
                      </div>

                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}
