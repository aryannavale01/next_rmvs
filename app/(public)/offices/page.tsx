import { prisma, withRetry } from '@/lib/prisma';
import { generatePageMetadata } from '@/lib/seo';
import { MapPin, Mail, Phone } from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: 'Global Offices',
    description: 'Find CompassionGlobal regional offices around the world. Connect with our local teams in India and beyond.',
    path: '/offices',
  });
}

export default async function OfficesPage() {
  const locations = await withRetry(() =>
    prisma.location.findMany({ where: { status: { not: 'deleted' } }, orderBy: { name: 'asc' } }),
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-emerald-50/50 to-white pt-16 pb-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-brand-primary border border-emerald-200/40">
            <MapPin className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Our Locations</span>
          </div>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 tracking-tight">
            Global Offices
          </h1>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Connect with our regional teams working on the ground to empower communities worldwide.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {locations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">
              Office information will be available soon.{' '}
              <a href="/contact" className="text-brand-primary hover:underline">Contact us</a> for inquiries.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-brand-primary shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-base text-gray-950">{loc.name}</h3>
                      {loc.location && <p className="text-xs text-gray-500">{loc.location}</p>}
                    </div>
                  </div>
                  {loc.description && (
                    <p className="text-xs text-gray-400 leading-relaxed">{loc.description}</p>
                  )}
                  {loc.address && (
                    <p className="text-xs text-gray-500 leading-relaxed">{loc.address}</p>
                  )}
                  <div className="space-y-1 text-xs text-gray-400 font-medium pt-2 border-t border-gray-100/50">
                    {loc.contactEmail && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-brand-primary" /> {loc.contactEmail}
                      </p>
                    )}
                    {loc.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-brand-primary" /> {loc.phone}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
