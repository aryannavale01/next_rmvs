'use client';

import { useState, FormEvent } from 'react';
import {
  FileText, Calendar, Clock,
  X, CheckCircle, Sparkles, Send, Eye
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  readTime: string;
  date: string;
  image: string;
  author: string | null;
}

interface Newsletter {
  id: string;
  title: string;
  date: string;
  readTime: string;
  image: string;
}

export default function ResourcesClient({
  blogPosts,
  newsletters,
}: {
  blogPosts: BlogPost[];
  newsletters: Newsletter[];
}) {
  const { toast } = useToast();
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribing(true);
      try {
        const res = await fetch('/api/public/newsletter-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput, source: 'resources' }),
        });
        if (!res.ok) throw new Error('Failed');
      } catch (err) {
        toast({ title: 'Subscription Failed', description: 'Unable to subscribe right now. Please try again later.', variant: 'error' });
        setSubscribing(false);
        return;
      }
      setSubscribed(true);
      setEmailInput('');
      setSubscribing(false);
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
              Read press coverage, programme updates, and community stories from our work across Junnar Taluka.
            </p>
          </div>
        </div>
      </section>

      {/* 1. FEATURED STORY BANNER CARD (IMAGE 6 TOP) */}
      {blogPosts.length > 0 && (
      <section className="bg-white pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FAFBF9] rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 hover:shadow-md transition-shadow" id="featured-story-banner">

            {/* Image frame */}
            <div className="lg:col-span-5 min-h-[300px] lg:min-h-auto bg-gray-100 relative">
              <img
                src={blogPosts[0].image || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80'}
                alt={blogPosts[0].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-6 left-6 bg-black text-white font-mono font-bold text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow">
                <Sparkles className="h-3.5 w-3.5 text-brand-mint animate-pulse" /> Featured Story
              </span>
            </div>

            {/* Details Content */}
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                  {blogPosts[0].date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-emerald-600" /> {blogPosts[0].date}</span>}
                  {blogPosts[0].date && blogPosts[0].readTime && <span>•</span>}
                  {blogPosts[0].readTime && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-emerald-600" /> {blogPosts[0].readTime}</span>}
                </div>

                <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-950 tracking-tight leading-snug hover:text-brand-primary transition-colors cursor-pointer" onClick={() => setSelectedBlog(blogPosts[0])}>
                  {blogPosts[0].title}
                </h2>

                <p className="text-sm text-gray-500 leading-relaxed">
                  {blogPosts[0].description || 'Read our latest update on training batches and community outreach.'}
                </p>
              </div>

              {/* Author & CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
                {blogPosts[0].author && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs text-brand-primary">
                      {blogPosts[0].author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 leading-none">{blogPosts[0].author}</h4>
                      <span className="text-[10px] text-gray-400 font-semibold">{blogPosts[0].category || 'RMVS Team'}</span>
                    </div>
                  </div>
                )}

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
      )}

      {/* 2. NEWSLETTER ARCHIVE SECTION (IMAGE 6 MIDDLE) */}
      <section className="bg-white pb-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 space-y-2">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900">Newsletter Archive</h2>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Programme Updates &amp; Press Coverage</p>
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
                    {nl.image?.trim() ? (
                      <img
                        src={nl.image}
                        alt={nl.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <FileText className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
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
                    className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" /> Read
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
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight">Stay Connected With Our Work</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto">
            Subscribe for updates on new training batches, government scheme camps, and community programmes.
          </p>

          <div className="max-w-md mx-auto" id="bottom-newsletter-subs">
            {subscribed ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-brand-primary font-bold text-xs rounded-2xl animate-in zoom-in-95 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" /> Subscribed! Welcome to the RMVS community update list.
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
                  Subscribe
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
                src={selectedBlog.image || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80'}
                alt={selectedBlog.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-4 left-4 bg-emerald-700 text-white font-mono font-bold text-[9px] tracking-widest px-2.5 py-1.5 rounded-md uppercase">
                Featured Story
              </span>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-emerald-600" /> {selectedBlog.date || 'Recent'}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-emerald-600" /> {selectedBlog.readTime || '5 min read'}</span>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 text-sm text-gray-600 leading-relaxed" id="blog-content-container">
                <h3 className="font-display font-bold text-2xl text-gray-900 leading-tight">
                  {selectedBlog.title}
                </h3>
                {selectedBlog.content ? (
                  <div className="prose prose-sm prose-emerald max-w-none whitespace-pre-wrap">{selectedBlog.content}</div>
                ) : selectedBlog.description ? (
                  <p>{selectedBlog.description}</p>
                ) : null}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {selectedBlog.author && (
                    <>
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-xs text-brand-primary">
                        {selectedBlog.author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-gray-800">{selectedBlog.author}</span>
                    </>
                  )}
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
                  <h3 className="font-display font-bold text-lg text-gray-900">RMVS Update</h3>
                  <p className="text-xs text-gray-400 font-mono">{selectedNewsletter.date} Publication</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-50">
                  {selectedNewsletter.image?.trim() ? (
                    <img
                      src={selectedNewsletter.image}
                      alt={selectedNewsletter.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <FileText className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <h4 className="font-display font-bold text-base text-gray-900 leading-tight">
                  {selectedNewsletter.title}
                </h4>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
