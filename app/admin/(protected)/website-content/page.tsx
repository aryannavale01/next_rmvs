'use client';

import { useState } from 'react';
import {
  Globe, GraduationCap, Users, Quote, Phone, Image, FolderOpen, MapPin,
  Award, Link, FileText,
} from 'lucide-react';
import ProgramsTab from './programs-tab';
import LeadershipTab from './leadership-tab';
import TestimonialsTab from './testimonials-tab';
import GalleryTab from './gallery-tab';
import ResourcesTab from './resources-tab';
import LocationsTab from './locations-tab';
import ContactSocialTab from './contact-social-tab';
import PartnersTab from './partners-tab';
import MilestonesTab from './milestones-tab';
import OrgDocumentsTab from './org-documents-tab';

type TabKey = 'programs' | 'leadership' | 'testimonials' | 'gallery' | 'resources' | 'locations' | 'contact_social' | 'partners' | 'milestones' | 'org_documents';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'programs', label: 'Programs', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { key: 'leadership', label: 'Leadership', icon: <Users className="w-3.5 h-3.5" /> },
  { key: 'testimonials', label: 'Testimonials', icon: <Quote className="w-3.5 h-3.5" /> },
  { key: 'gallery', label: 'Gallery', icon: <Image className="w-3.5 h-3.5" /> },
  { key: 'resources', label: 'Resources', icon: <FolderOpen className="w-3.5 h-3.5" /> },
  { key: 'locations', label: 'Locations', icon: <MapPin className="w-3.5 h-3.5" /> },
  { key: 'partners', label: 'Partners', icon: <Link className="w-3.5 h-3.5" /> },
  { key: 'milestones', label: 'Milestones', icon: <Award className="w-3.5 h-3.5" /> },
  { key: 'org_documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'contact_social', label: 'Contact & Social', icon: <Phone className="w-3.5 h-3.5" /> },
];

export default function AdminWebsiteContentPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('programs');

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Website Content</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage CMS content displayed on public pages</p>
        </div>
        <Globe className="w-5 h-5 text-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl p-3">
        <div role="tablist" className="flex flex-wrap gap-1.5">
          {TABS.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-primary-light text-muted-foreground hover:bg-primary-light'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'programs' && <ProgramsTab />}
      {activeTab === 'leadership' && <LeadershipTab />}
      {activeTab === 'testimonials' && <TestimonialsTab />}
      {activeTab === 'gallery' && <GalleryTab />}
      {activeTab === 'resources' && <ResourcesTab />}
      {activeTab === 'locations' && <LocationsTab />}
      {activeTab === 'partners' && <PartnersTab />}
      {activeTab === 'milestones' && <MilestonesTab />}
      {activeTab === 'org_documents' && <OrgDocumentsTab />}
      {activeTab === 'contact_social' && <ContactSocialTab />}
    </div>
  );
}
