'use client';

import { useState, FormEvent } from 'react';
import { 
  FileText, Download, Calendar, Clock,
  X, CheckCircle, Sparkles, Send, Eye
} from 'lucide-react';
import { blogPosts, newsletters, BlogPost, Newsletter } from '@/lib/public-data';
import { useToast } from '@/components/ui/toast';

export default function ResourcesPage() {
  const { toast } = useToast();
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <div className="space-y-0" id="resources-page-root">
      
      {/* Header section */}
      <section className="bg-white pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 tracking-tight leading-tight">
              Resources &amp; Newsletters
            </h1>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
              Explore our latest articles, quarterly journals, and official newsletters detailing our global work and operational transparency.
            </p>
          </div>
        </div>
      </section>

      {/* 1. FEATURED STORY BANNER CARD (IMAGE 6 TOP) */}
      <section className="bg-white pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FAFBF9] rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 hover:shadow-md transition-shadow" id="featured-story-banner">
            
            {/* Image frame */}
            <div className="lg:col-span-5 min-h-[300px] lg:min-h-auto bg-gray-100 relative">
              <img 
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80" 
                alt="Farmer working on soil" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-6 left-6 bg-black text-white font-mono font-bold text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow">
                <Sparkles className="h-3.5 w-3.5 text-brand-mint animate-pulse" /> FEATURED STORY
              </span>
            </div>

            {/* Details Content */}
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-emerald-600" /> June 2026</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-emerald-600" /> 8 min read</span>
                </div>
                
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-950 tracking-tight leading-snug hover:text-brand-primary transition-colors cursor-pointer" onClick={() => setSelectedBlog(blogPosts[0])}>
                  The Future of Food Security: How Local Solutions are Shaping Global Policy
                </h2>
                
                <p className="text-sm text-gray-500 leading-relaxed">
                  Across three continents, our latest initiative is empowering smallholder farmers with regenerative techniques and digital market access. Discover the quantitative data-driven impact behind our 2024/2025 results.
                </p>
              </div>

              {/* Author & CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs text-brand-primary">ER</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-none">Elena Rodriguez</h4>
                    <span className="text-[10px] text-gray-400 font-semibold">Chief Agricultural Strategist</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedBlog(blogPosts[0])}
                  className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  id="btn-read-blog"
                >
                  <Eye className="h-4 w-4" />
                  Read Article
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. NEWSLETTER ARCHIVE SECTION (IMAGE 6 MIDDLE) */}
      <section className="bg-white pb-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 space-y-2">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Newsletter Archive</h2>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Operational Publications &amp; Journals</p>
          </div>

          {/* Grid of 6 Newsletters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" id="newsletter-grid">
            {newsletters.map((nl) => (
              <div 
                key={nl.id} 
                className="group bg-[#FAFBF9] rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                id={`newsletter-card-${nl.id}`}
              >
                <div>
                  {/* Photo frame */}
                  <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
                    <img 
                      src={nl.image} 
                      alt={nl.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-brand-primary font-display font-bold text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-md border border-gray-100 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Newsletter
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold font-mono">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" /> {nl.date}
                      <span>•</span>
                      <Clock className="h-3.5 w-3.5 text-emerald-600" /> {nl.readTime}
                    </div>

                    <h3 className="font-display font-bold text-base text-gray-950 group-hover:text-brand-primary transition-colors leading-tight">
                      {nl.title}
                    </h3>
                  </div>
                </div>

                {/* Specs and CTA */}
                <div className="p-6 pt-0 flex gap-2">
                  <button 
                    onClick={() => setSelectedNewsletter(nl)}
                    className="flex-1 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" /> Read
                  </button>
                  <button 
                    onClick={() => toast({ title: 'Download Started', description: `Starting secure download for ${nl.title} newsletter PDF document (2.4MB)...`, variant: 'info' })}
                    className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SIGNUP NEWSLETTER CALL TO ACTION */}
      <section className="bg-gray-50/50 py-20 border-t border-gray-100" id="section-newsletter-banner">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-brand-primary rounded-2xl">
            <Send className="h-6 w-6" />
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight">Direct Transparency In Your Inbox</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto">
            Subscribe today to receive real-time updates directly from our regional offices. Zero spam. 100% impact metrics.
          </p>

          <div className="max-w-md mx-auto" id="bottom-newsletter-subs">
            {subscribed ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-brand-primary font-bold text-xs rounded-2xl animate-in zoom-in-95 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" /> Subscribed successfully! Welcome to the CompassionGlobal monthly digest.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email address"
                  required
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
                <button 
                  type="submit"
                  className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs rounded-xl transition-colors cursor-pointer uppercase tracking-wider shrink-0"
                >
                  Join Us
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* MODAL: BLOG VIEW */}
      {selectedBlog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" id="modal-blog">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative text-gray-900">
            <button 
              onClick={() => setSelectedBlog(null)}
              className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full transition-colors cursor-pointer z-10"
              aria-label="Close Blog"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Photo banner in modal */}
            <div className="aspect-video bg-gray-100 relative">
              <img 
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80" 
                alt="Agricultural Reforestation" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-4 left-4 bg-emerald-700 text-white font-mono font-bold text-[9px] tracking-widest px-2.5 py-1.5 rounded-md uppercase">
                Featured Strategic Story
              </span>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-emerald-600" /> June 2026</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-emerald-600" /> {selectedBlog.readTime}</span>
              </div>

              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 text-sm text-gray-600 leading-relaxed" id="blog-content-container">
                <h3 className="font-display font-bold text-2xl text-gray-900 leading-tight">
                  {selectedBlog.title}
                </h3>
                <p>
                  Across three continents, climate change is shifting crop seasons and endangering the food security of millions of smallholder families. CompassionGlobal&apos;s agricultural advocacy program has deployed a structured module combining native bio-barriers with smart mobile irrigation.
                </p>
                <p>
                  Rather than distributing generic seed packs, our field nursing teams map soil nutrient profiles on our digital networks. Local cooperatives receive direct financial grants to source resilient regional species like acacias, preserving moisture and preventing soil runoff.
                </p>
                <p>
                  To date, food security ratings have risen by 34% across Senegal and Rwanda. By fostering direct connections to city markets via simple SMS apps, smallholder cooperatives keep 100% of profits in their communities, launching independent financial cycles.
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-xs text-brand-primary">ER</div>
                  <span className="text-xs font-bold text-gray-800">{selectedBlog.author}</span>
                </div>
                <button 
                  onClick={() => setSelectedBlog(null)}
                  className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEWSLETTER VIEW */}
      {selectedNewsletter && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" id="modal-newsletter">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative text-gray-900">
            <button 
              onClick={() => setSelectedNewsletter(null)}
              className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-full transition-colors cursor-pointer z-10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100 text-brand-primary">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 text-brand-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-gray-900">CompassionGlobal Newsletter</h3>
                  <p className="text-xs text-gray-400 font-mono">{selectedNewsletter.date} Publication</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-50">
                  <img 
                    src={selectedNewsletter.image} 
                    alt={selectedNewsletter.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-display font-bold text-base text-gray-900 leading-tight">
                  {selectedNewsletter.title}
                </h4>
                <p className="text-xs">
                  This document summarizes our quarterly achievements, verified field balance sheets, and active program reports. Our auditors have fully verified that 92.4% of direct donations in this period reached field logistics corridors safely.
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Read Time: {selectedNewsletter.readTime}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedNewsletter(null)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      toast({ title: 'Download Started', description: `Downloading PDF bundle: ${selectedNewsletter.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, variant: 'success' });
                      setSelectedNewsletter(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
