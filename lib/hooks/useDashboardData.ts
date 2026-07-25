import useSWR from 'swr';
import { fetcher, SWR_DEFAULTS } from '@/lib/swr-fetcher';
import { Application, Certificate, AppNotification, Activity, Course } from '@/lib/store';

interface DashboardResponse {
  applications: Application[];
  certificates: Certificate[];
  notifications: AppNotification[];
  activities: Activity[];
}

interface CoursesResponse {
  courses: Course[];
}

export function useDashboardData() {
  const dashboard = useSWR<DashboardResponse>('/api/dashboard', fetcher, SWR_DEFAULTS);
  const courses = useSWR<CoursesResponse>('/api/dashboard/courses', fetcher, SWR_DEFAULTS);

  return {
    applications: dashboard.data?.applications ?? [] as Application[],
    certificates: dashboard.data?.certificates ?? [] as Certificate[],
    notifications: dashboard.data?.notifications ?? [] as AppNotification[],
    activities: dashboard.data?.activities ?? [] as Activity[],
    courses: courses.data?.courses ?? [] as Course[],
    isLoadingDashboard: dashboard.isLoading,
    isLoadingCourses: courses.isLoading,
    errorDashboard: dashboard.error as Error | undefined,
    errorCourses: courses.error as Error | undefined,
    refresh: () => { dashboard.mutate(); courses.mutate(); },
    refreshDashboard: dashboard.mutate,
    refreshCourses: courses.mutate,
  };
}
