'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/admin-context';
import {
  Users, BookOpen, Award, Calendar, Layers, Bell, Percent,
  PlusCircle, FileSpreadsheet, Settings,
  Clock, ChevronRight,
} from 'lucide-react';
import MetricCards from '@/components/MetricCards';
import { getStatusStyle } from '@/lib/status-styles';

export default function AdminRootPage() {
  const router = useRouter();
  const { members, courses, enrollments, certificates, teachers, coupons, notifications, activityLogs } = useAdmin();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [hoveredArea, setHoveredArea] = useState<number | null>(null);

  const totalMembers = members.length;
  const activeCourses = courses.filter(c => c.status === 'Published').length;
  const totalCerts = certificates.length;
  const pendingEnrollments = enrollments.filter(e => e.status === 'Pending').length;
  const totalTeachers = teachers.length;
  const totalEnrollments = enrollments.length;
  const totalCoupons = coupons.length;
  const totalNotifs = notifications.length;

  const barChartData = [
    { month: 'Jan', value: 12 }, { month: 'Feb', value: 18 }, { month: 'Mar', value: 15 },
    { month: 'Apr', value: 25 }, { month: 'May', value: 32 }, { month: 'Jun', value: 28 }, { month: 'Jul', value: 35 },
  ];
  const lineChartData = [
    { month: 'Jan', value: 4 }, { month: 'Feb', value: 8 }, { month: 'Mar', value: 12 },
    { month: 'Apr', value: 15 }, { month: 'May', value: 20 }, { month: 'Jun', value: 18 }, { month: 'Jul', value: 24 },
  ];
  const areaChartData = [
    { month: 'Jan', value: 45 }, { month: 'Feb', value: 58 }, { month: 'Mar', value: 68 },
    { month: 'Apr', value: 82 }, { month: 'May', value: 98 }, { month: 'Jun', value: 110 }, { month: 'Jul', value: 132 },
  ];

  const quickActions = [
    { label: 'Add Member', icon: PlusCircle, onClick: () => router.push('/admin/members') },
    { label: 'New Training', icon: PlusCircle, onClick: () => router.push('/admin/training') },
    { label: 'Issue Certificate', icon: Award, onClick: () => router.push('/admin/certificates') },
    { label: 'View Enrollments', icon: FileSpreadsheet, onClick: () => router.push('/admin/enrollments') },
    { label: 'Website Content', icon: Settings, onClick: () => router.push('/admin/website-content') },
  ];

  const getMemberName = (id: string) => members.find(m => m.id === id)?.full_name || 'Unknown';
  const getCourseName = (id: string) => courses.find(c => c.id === id)?.title || 'Unknown';

  return (
    <div className="space-y-6 font-sans">
      {/* Stat Cards */}
      <MetricCards
        activeFilter=""
        onFilterChange={(id) => {
          const routes: Record<string, string> = {
            members: '/admin/members', courses: '/admin/training', certs: '/admin/certificates',
            pending: '/admin/enrollments', teachers: '/admin/teachers', enrollments: '/admin/enrollments',
            coupons: '/admin/coupons', alerts: '/admin/notifications',
          };
          if (routes[id]) router.push(routes[id]);
        }}
        columns={4}
        cards={[
          { id: 'members', label: 'Total Members', value: totalMembers, icon: Users },
          { id: 'courses', label: 'Active Trainings', value: activeCourses, icon: BookOpen },
          { id: 'certs', label: 'Certificates', value: totalCerts, icon: Award },
          { id: 'pending', label: 'Pending Apps', value: pendingEnrollments, icon: Calendar },
          { id: 'teachers', label: 'NGO Teachers', value: totalTeachers, icon: Layers },
          { id: 'enrollments', label: 'Enrollments', value: totalEnrollments, icon: FileSpreadsheet },
          { id: 'coupons', label: 'Coupons', value: totalCoupons, icon: Percent },
          { id: 'alerts', label: 'Alerts Sent', value: totalNotifs, icon: Bell },
        ]}
      />

      {/* Quick Actions */}
      <div className="bg-card border border-border p-5 rounded-xl">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">NGO Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickActions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className={`flex items-center gap-3 p-3 bg-background border border-border hover:border-primary hover:bg-primary-light/20 text-foreground rounded-lg text-left transition-all text-xs font-semibold ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <a.icon className="w-5 h-5 text-primary shrink-0" />
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Training Applications</h4>
            <span className="text-[10px] bg-primary-light text-primary border border-primary-light rounded-sm px-1.5 py-0.5 font-bold uppercase">Monthly</span>
          </div>
          <div className="h-44 w-full">
            <svg className="w-full h-full" viewBox="0 0 300 160">
              <line x1="0" y1="40" x2="300" y2="40" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="120" x2="300" y2="120" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="140" x2="300" y2="140" stroke="#E2E8F0" strokeWidth="1" />
              {barChartData.map((d, i) => {
                const barWidth = 24;
                const gap = (300 - (barChartData.length * barWidth)) / (barChartData.length + 1);
                const x = gap + i * (barWidth + gap);
                const barHeight = (d.value / 40) * 120;
                const y = 140 - barHeight;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={barWidth} height={barHeight} rx="3"
                      fill={hoveredBar === i ? '#1E56A0' : '#2563EB'}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)} />
                    <text x={x + barWidth / 2} y="155" textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">{d.month}</text>
                    {hoveredBar === i && (
                      <g>
                        <rect x={x - 12} y={y - 22} width="48" height="18" rx="4" fill="#0F1B33" />
                        <text x={x + 12} y={y - 10} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">{d.value} apps</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Certificates Issued</h4>
            <span className="text-[10px] bg-primary-light text-primary border border-primary-light rounded-sm px-1.5 py-0.5 font-bold uppercase">Trend</span>
          </div>
          <div className="h-44 w-full">
            <svg className="w-full h-full" viewBox="0 0 300 160">
              <line x1="0" y1="40" x2="300" y2="40" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="120" x2="300" y2="120" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="140" x2="300" y2="140" stroke="#E2E8F0" strokeWidth="1" />
              {(() => {
                const points = lineChartData.map((d, i) => ({
                  x: (300 / (lineChartData.length - 1)) * i,
                  y: 140 - (d.value / 30) * 120,
                }));
                const dPath = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
                return (
                  <>
                    <path d={dPath} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r={hoveredLine === i ? 6 : 4} fill="#2563EB" stroke="#ffffff" strokeWidth="2"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredLine(i)} onMouseLeave={() => setHoveredLine(null)} />
                        <text x={p.x} y="155" textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">{lineChartData[i].month}</text>
                        {hoveredLine === i && (
                          <g>
                            <rect x={p.x - 22 > 0 ? p.x - 22 : 2} y={p.y - 24} width="44" height="18" rx="4" fill="#0F1B33" />
                            <text x={p.x - 22 > 0 ? p.x : 24} y={p.y - 12} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">{lineChartData[i].value} certs</text>
                          </g>
                        )}
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Area Chart */}
        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Member Growth</h4>
            <span className="text-[10px] bg-primary-light text-primary border border-primary-light rounded-sm px-1.5 py-0.5 font-bold uppercase">Cumulative</span>
          </div>
          <div className="h-44 w-full">
            <svg className="w-full h-full" viewBox="0 0 300 160">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="40" x2="300" y2="40" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="120" x2="300" y2="120" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="140" x2="300" y2="140" stroke="#E2E8F0" strokeWidth="1" />
              {(() => {
                const points = areaChartData.map((d, i) => ({
                  x: (300 / (areaChartData.length - 1)) * i,
                  y: 140 - (d.value / 150) * 120,
                }));
                const dLine = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
                const dArea = `${dLine} L ${points[points.length - 1].x} 140 L 0 140 Z`;
                return (
                  <>
                    <path d={dArea} fill="url(#areaGrad)" />
                    <path d={dLine} fill="none" stroke="#2563EB" strokeWidth="2.5" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r={hoveredArea === i ? 6 : 3.5} fill="#2563EB" stroke="#ffffff" strokeWidth="2"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredArea(i)} onMouseLeave={() => setHoveredArea(null)} />
                        <text x={p.x} y="155" textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">{areaChartData[i].month}</text>
                        {hoveredArea === i && (
                          <g>
                            <rect x={p.x - 22 > 0 ? p.x - 22 : 2} y={p.y - 24} width="44" height="18" rx="4" fill="#0F1B33" />
                            <text x={p.x - 22 > 0 ? p.x : 24} y={p.y - 12} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">{areaChartData[i].value} total</text>
                          </g>
                        )}
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      {/* Tables and Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Applications */}
            <div className="bg-card border border-border p-5 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Recent Applications</h4>
                <button onClick={() => router.push('/admin/enrollments')} className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-4">
                {enrollments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No enrollments yet</p>
                )}
                {enrollments.slice(0, 3).map(e => (
                  <div key={e.id} className="flex justify-between items-center text-sm pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{getMemberName(e.member_id)}</p>
                      <p className="text-xs text-muted-foreground truncate">{getCourseName(e.course_id)}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ml-2 ${getStatusStyle(e.status)}`}>
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Members */}
            <div className="bg-card border border-border p-5 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Recent Members</h4>
                <button onClick={() => router.push('/admin/members')} className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-4">
                {members.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No members registered yet</p>
                )}
                {members.slice(0, 3).map(m => (
                  <div key={m.id} className="flex justify-between items-center text-sm pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">{m.village}, {m.district}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono bg-muted border border-border rounded-md px-2 py-0.5 shrink-0 ml-2">{m.created_at}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Certificates */}
            <div className="bg-card border border-border p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Certificates</h4>
                <button onClick={() => router.push('/admin/certificates')} className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {certificates.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No certificates yet</p>
                )}
                {certificates.slice(0, 3).map(c => (
                  <div key={c.id} className="flex justify-between items-center text-xs pb-2.5 border-b border-border last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-foreground">{getMemberName(c.member_id)}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{c.certificate_no}</p>
                    </div>
                    <span className="text-[10px] text-success-text font-bold">Approved</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-card border border-border p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Notifications</h4>
                <button onClick={() => router.push('/admin/notifications')} className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {notifications.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No notifications yet</p>
                )}
                {notifications.slice(0, 3).map(n => (
                  <div key={n.id} className="text-xs pb-2.5 border-b border-border last:border-0 last:pb-0">
                    <p className="font-semibold text-foreground truncate">{n.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{n.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> System Activity Log
            </h4>
            <button onClick={() => router.push('/admin/activity-logs')} className="text-[10px] text-primary font-semibold hover:underline">View All</button>
          </div>
          <div className="relative pl-4 border-l-2 border-border space-y-6">
            {activityLogs.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
            )}
            {activityLogs.slice(0, 7).map(log => (
              <div key={log.id} className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-card border-2 border-primary rounded-full" />
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold">{log.timestamp}</span>
                  <p className="text-xs font-bold text-foreground mt-0.5">{log.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{log.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
