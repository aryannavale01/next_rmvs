'use client';

import { useState, useMemo } from 'react';
import { 
  X, Play, Calendar, MapPin, Share2, 
  ArrowRight, Download, Film, Image as ImageIcon
} from 'lucide-react';
import { galleryItems, partners } from '@/lib/public-data';
import { GalleryItem } from '@/lib/public-data';
import { useToast } from '@/components/ui/toast';

export default function ImpactPage() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  const filteredItems = useMemo(() => {
    return galleryItems.filter(item => {
      return activeCategory === 'All' || item.category === activeCategory;
    });
  }, [activeCategory]);

  const handleShare = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLoadMore = () => {
    if (visibleCount === 6) {
      toast({ title: 'Loading Archives', description: 'Showing additional simulated records from Senegal, Kenya, and Peru.', variant: 'info' });
      setVisibleCount(12);
    } else {
      toast({ title: 'Up to Date', description: 'All archives are currently synchronized and up to date.', variant: 'success' });
    }
  };

  return (
    <div className="space-y-0" id="impact-page-root">
      
      <section className="bg-white pt-16 pb-12 text-center space-y-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 tracking-tight leading-tight">
            Impact Gallery
          </h1>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Witness the tangible, sustainable change we create across the globe through the lens of our active volunteers, clinical staff, and regional communities.
          </p>
        </div>
      </section>

      <section className="bg-white pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 border-b border-gray-100 pb-6 w-full max-w-lg" id="gallery-filters">
            {['All', 'Programs', 'Events', 'Videos', 'Archive'].map((cat) => {
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
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-brand-primary font-display font-semibold text-[9px] tracking-widest px-2.5 py-1 rounded-md uppercase border border-gray-100">
                    {item.category}
                  </span>
                  {item.isVideo && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/35 transition-colors">
                      <div className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-brand-primary shadow-md group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 fill-brand-primary text-brand-primary ml-0.5" />
                      </div>
                    </div>
                  )}
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
            <button 
              onClick={handleLoadMore}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#FAF9F8] border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-xs rounded-full shadow-sm transition-all cursor-pointer group"
              id="btn-load-archive"
            >
              {visibleCount === 6 ? 'View Full Archive' : 'All Archives Synchronized'}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white py-16" id="section-trust">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <span className="font-mono text-xs font-bold tracking-widest text-gray-400 uppercase">Trusted By Global Institutions</span>
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
                {selectedItem.isVideo ? (
                  <div className="w-full h-full relative" id="modal-video-box">
                    <img 
                      src={selectedItem.image} 
                      alt={selectedItem.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-brand-primary shadow-xl">
                        <Play className="h-6 w-6 fill-brand-primary text-brand-primary ml-1" />
                      </div>
                      <span className="text-white text-xs font-mono tracking-widest uppercase bg-black/50 px-3 py-1 rounded-md">
                        Connecting Video Stream...
                      </span>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={selectedItem.image} 
                    alt={selectedItem.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    id="modal-image-view"
                  />
                )}
              </div>

              <div className="md:col-span-5 p-8 flex flex-col justify-between space-y-6 md:h-[450px] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
                      {selectedItem.category}
                    </span>
                    {selectedItem.isVideo ? (
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <Film className="h-3 w-3" /> Video
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-50 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> Image
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-xl text-gray-900 leading-snug">
                    {selectedItem.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {selectedItem.description} This photo was logged and categorized securely by CompassionGlobal field volunteers during active assessment operations. Every step is logged in our databases for absolute transparent reporting.
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</span>
                      <span className="font-bold text-gray-800">Senegal/Rwanda/Asia</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Logged Date</span>
                      <span className="font-bold text-gray-800">June 2026</span>
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
                    <button 
                      onClick={() => toast({ title: 'Download Started', description: 'High-resolution photo download started successfully.', variant: 'success' })}
                      className="flex-1 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
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
