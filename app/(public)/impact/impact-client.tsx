'use client';

import { useState, useMemo } from 'react';
import {
  X, Calendar, MapPin, Share2,
  ArrowRight, Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface GalleryItemData {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  location?: string;
  loggedDate?: string;
  isVideo?: boolean;
}

interface PartnerData {
  name: string;
  icon: string;
}

interface ImpactClientProps {
  galleryItems: GalleryItemData[];
  partners: PartnerData[];
}

export default function ImpactClient({ galleryItems, partners }: ImpactClientProps) {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<GalleryItemData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  const filteredItems = useMemo(() => {
    return galleryItems.filter(item => {
      if (item.isVideo) return false;
      return activeCategory === 'All' || item.category === activeCategory;
    });
  }, [activeCategory, galleryItems]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link Copied', description: 'Gallery item link copied to clipboard.', variant: 'success' });
    } catch {
      toast({ title: 'Copy Failed', description: 'Unable to copy link. Please copy the URL manually from the address bar.', variant: 'error' });
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const hasMoreItems = visibleCount < filteredItems.length;

  return (
    <div className="space-y-0" id="impact-page-root">

      <section className="bg-white pt-16 pb-12 text-center space-y-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 tracking-tight leading-tight">
            Impact Gallery
          </h1>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            See our skill training batches, government scheme camps, tree-plantation drives, and community outreach across Junnar Taluka — captured directly from the field.
          </p>
        </div>
      </section>

      <section className="bg-white pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 border-b border-gray-100 pb-6 w-full max-w-lg" id="gallery-filters">
            {['All', 'Programs', 'Events', 'Archive'].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4.5 py-2 rounded-full font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-md'
                      : 'bg-[#F2F3F2] hover:bg-gray-200 text-gray-600'
                  }`}
                  id={`gallery-filter-${cat}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" id="gallery-grid">
            {filteredItems.slice(0, visibleCount).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group bg-[#FAFAF9] rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
                id={`gallery-item-${item.id}`}
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  {item.image?.trim() ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-3xl font-bold text-gray-400 font-display">
                        {item.title.trim().charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-brand-primary font-display font-semibold text-[9px] tracking-widest px-2.5 py-1 rounded-md uppercase border border-gray-100">
                    {item.category}
                  </span>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="font-display font-bold text-base text-gray-900 group-hover:text-brand-primary transition-colors leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 pb-12 border-b border-gray-100" id="gallery-archive-container">
            {hasMoreItems && (
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#FAF9F8] border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-xs rounded-full shadow-sm transition-all cursor-pointer group"
                id="btn-load-archive"
              >
                Load More ({filteredItems.length - visibleCount} remaining)
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            {!hasMoreItems && filteredItems.length > 6 && (
              <span className="text-xs text-gray-400 font-medium">All {filteredItems.length} items loaded</span>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-16" id="section-trust">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <span className="font-mono text-xs font-bold tracking-widest text-gray-400 uppercase">Our Government &amp; Scheme Partners</span>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-40 hover:opacity-60 transition-all">
            {partners.map((p) => (
              <span key={p.name} className="font-display font-bold text-sm tracking-widest text-gray-500 uppercase">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200" id="lightbox-modal">
          <div className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 relative text-gray-900">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer z-20"
              aria-label="Close Lightbox"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12">
              <div className="md:col-span-7 bg-black aspect-video md:aspect-auto md:h-[450px] relative flex items-center justify-center">
                {selectedItem.image?.trim() ? (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    id="modal-image-view"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <span className="text-5xl font-bold text-gray-400 font-display">
                      {selectedItem.title.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>

              <div className="md:col-span-5 p-8 flex flex-col justify-between space-y-6 md:h-[450px] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
                      {selectedItem.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-50 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Photo
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-gray-900 leading-snug">
                    {selectedItem.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {selectedItem.description} Photo documented by the RMVS team during an on-ground training or outreach activity.
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</span>
                      <span className="font-bold text-gray-800">{selectedItem.location || 'Not specified'}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</span>
                      <span className="font-bold text-gray-800">{selectedItem.loggedDate || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleShare}
                      className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
