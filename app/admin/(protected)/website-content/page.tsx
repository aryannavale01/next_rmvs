'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { WebsiteItem } from '@/lib/admin-types';
import {
  Globe, Plus, Pencil, Trash2, X, BookOpen, GraduationCap, Users, Quote,
  Phone, Image, FolderOpen, MapPin, Eye, Check,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

type TabKey = 'courses' | 'programs' | 'leadership' | 'testimonials' | 'contact_social' | 'gallery' | 'resources' | 'locations';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; isItems: boolean }[] = [
  { key: 'courses', label: 'Trainings', icon: <BookOpen className="w-3.5 h-3.5" />, isItems: true },
  { key: 'programs', label: 'Programs', icon: <GraduationCap className="w-3.5 h-3.5" />, isItems: true },
  { key: 'leadership', label: 'Leadership', icon: <Users className="w-3.5 h-3.5" />, isItems: true },
  { key: 'testimonials', label: 'Testimonials', icon: <Quote className="w-3.5 h-3.5" />, isItems: true },
  { key: 'contact_social', label: 'Contact & Social', icon: <Phone className="w-3.5 h-3.5" />, isItems: false },
  { key: 'gallery', label: 'Gallery', icon: <Image className="w-3.5 h-3.5" aria-hidden="true" />, isItems: true },
  { key: 'resources', label: 'Resources', icon: <FolderOpen className="w-3.5 h-3.5" />, isItems: true },
  { key: 'locations', label: 'Locations', icon: <MapPin className="w-3.5 h-3.5" />, isItems: true },
];

const VISIBILITY_OPTIONS: WebsiteItem['visibility'][] = ['Homepage Only', 'Programs Page Only', 'Both Pages'];

const visibilityBadge = (v: WebsiteItem['visibility']) => {
  const map = {
    'Homepage Only': 'bg-primary-light text-primary',
    'Programs Page Only': 'bg-warning-bg text-warning-text',
    'Both Pages': 'bg-success-bg text-success-text',
  };
  return map[v];
};

export default function AdminWebsiteContentPage() {
  const { websiteContent, updateWebsiteContent } = useAdmin();

  const [activeTab, setActiveTab] = useState<TabKey>('courses');
  const [editingItem, setEditingItem] = useState<WebsiteItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyItem: WebsiteItem = { id: '', title: '', description: '', visibility: 'Both Pages' };
  const [form, setForm] = useState<WebsiteItem>(emptyItem);

  const [contactForm, setContactForm] = useState({ ...websiteContent.contact_social });

  const currentItems = (() => {
    const val = websiteContent[activeTab];
    if (Array.isArray(val)) return val as WebsiteItem[];
    return null;
  })();

  const openAdd = () => {
    setForm({ ...emptyItem });
    setEditingItem(null);
    setShowForm(true);
  };

  const openEdit = (item: WebsiteItem) => {
    setForm({ ...item });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSaveItem = async () => {
    if (!form.title.trim()) return;
    const items = currentItems || [];
    let updated: WebsiteItem[];
    if (editingItem) {
      updated = items.map(it => it.id === editingItem.id ? { ...form } : it);
    } else {
      updated = [{ ...form, id: `web-${Date.now()}-${crypto.randomUUID().slice(0, 8)}` }, ...items];
    }
    await updateWebsiteContent(activeTab as keyof typeof websiteContent, updated);
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    const items = (currentItems || []).filter(it => it.id !== id);
    await updateWebsiteContent(activeTab as keyof typeof websiteContent, items);
    setDeleteConfirm(null);
  };

  const handleSaveContact = async () => {
    await updateWebsiteContent('contact_social', contactForm);
  };

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setShowForm(false);
    setEditingItem(null);
    setDeleteConfirm(null);
    if (key === 'contact_social') {
      setContactForm({ ...websiteContent.contact_social });
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Website Content</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage CMS content displayed on public pages</p>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-xl p-3">
        <div role="tablist" className="flex flex-wrap gap-1.5">
          {TABS.map(tab => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              onClick={() => handleTabChange(tab.key)}
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

      {/* Contact & Social Tab */}
      {activeTab === 'contact_social' && (
        <div id="tabpanel-contact_social" role="tabpanel" aria-labelledby="tab-contact_social" className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-foreground">Contact & Social Information</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Update contact details and social media links shown on the website</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            {([
              ['address', 'Address'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['facebook', 'Facebook URL'],
              ['twitter', 'Twitter URL'],
              ['linkedin', 'LinkedIn URL'],
              ['instagram', 'Instagram URL'],
            ] as const).map(([field, label]) => (
              <div key={field} className={field === 'address' ? 'col-span-2' : ''}>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
                <input
                  value={contactForm[field]}
                  onChange={e => setContactForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveContact}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"
            >
              <Check className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Items Tabs */}
      {activeTab !== 'contact_social' && (
        <div id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="space-y-4">
          {/* Add Button */}
          <div className="flex justify-end">
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          </div>

          {/* Inline Add/Edit Form */}
          {showForm && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="p-1 rounded-md hover:bg-muted" aria-label="Cancel edit">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Enter title"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    value={form.description || ''}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Visibility</label>
                  <select
                    value={form.visibility}
                    onChange={e => setForm(f => ({ ...f, visibility: e.target.value as WebsiteItem['visibility'] }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-card"
                  >
                    {VISIBILITY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-5">
                <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">
                  Cancel
                </button>
                <button onClick={handleSaveItem} className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {(!currentItems || currentItems.length === 0) ? (
              <EmptyState
                icon={Globe}
                title="No content items"
                description="Add items to populate the public website sections."
                actionText="Add Item"
                onAction={() => { setShowForm(true); }}
              />
            ) : (
              <div className="divide-y divide-border">
                {currentItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Eye className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground truncate">{item.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${visibilityBadge(item.visibility)}`}>
                          {item.visibility}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary"
                        aria-label="Edit item"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item.id)}
                        className="p-1.5 rounded-md hover:bg-destructive-bg text-muted-foreground hover:text-destructive"
                        aria-label="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive-bg flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-2">Delete Item?</h3>
            <p className="text-xs text-muted-foreground mb-6">This action cannot be undone. The item will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-primary-light">
                Cancel
              </button>
              <button onClick={() => handleDeleteItem(deleteConfirm)} className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive/90 rounded-lg">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
