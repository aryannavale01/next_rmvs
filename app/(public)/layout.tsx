import PublicLayoutWrapper from '@/components/public-layout-wrapper';
import { getOrgConfig } from '@/lib/org-config';

export const dynamic = 'force-dynamic';

function darkenHex(hex: string, amount: number): string {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const config = await getOrgConfig();

  if (config.maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Site Under Maintenance</h1>
          <p className="text-gray-600 mb-2">{config.maintenanceMessage}</p>
          <p className="text-sm text-gray-400">We&apos;re updating our website. Please reach us directly at ashwininavale83@gmail.com in the meantime.</p>
        </div>
      </div>
    );
  }

  const brandHover = darkenHex(config.brandColor, 0.15);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root { --brand-primary: ${config.brandColor}; --brand-primary-hover: ${brandHover}; --color-brand-primary: ${config.brandColor}; --color-brand-primary-hover: ${brandHover}; }` }} />
      <PublicLayoutWrapper config={config}>{children}</PublicLayoutWrapper>
    </>
  );
}
