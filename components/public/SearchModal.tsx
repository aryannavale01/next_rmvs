'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, BookOpen, Globe, User, ArrowRight, Loader2 } from 'lucide-react';

interface SearchCourse { id: string; title: string; category: string; description: string; }
interface SearchProgram { id: string; title: string; category: string; description: string; }
interface SearchLeader { id: string; name: string; role: string; }

interface SearchData {
  courses: SearchCourse[];
  programs: SearchProgram[];
  leaders: SearchLeader[];
}

interface SearchModalProps {
  onClose: () => void;
}

export default function SearchModal({ onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<SearchData>({ courses: [], programs: [], leaders: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/search-data')
      .then(r => r.ok ? r.json() : { courses: [], programs: [], leaders: [] })
      .then(d => setData(d))
      .catch(() => setData({ courses: [], programs: [], leaders: [] }))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return { courses: [], programs: [], leaders: [] };
    const q = query.toLowerCase();

    const matchedCourses = data.courses.filter(
      c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );

    const matchedPrograms = data.programs.filter(
      p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );

    const matchedLeaders = data.leaders.filter(
      l => l.name.toLowerCase().includes(q) || l.role.toLowerCase().includes(q)
    );

    return { courses: matchedCourses, programs: matchedPrograms, leaders: matchedLeaders };
  }, [query, data]);

  const totalMatches = results.courses.length + results.programs.length + results.leaders.length;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20 px-4 backdrop-blur-sm animate-in fade-in duration-200" id="search-modal-root" onClick={onClose}>
      <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl border border-gray-100 animate-in slide-in-from-top-10 duration-200 relative text-gray-900 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs, academy, team..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 font-medium"
          />
          <button 
            onClick={onClose}
            className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6" id="search-results-box">
          {loading ? (
            <div className="text-center py-8 space-y-2 text-gray-400">
              <Loader2 className="h-6 w-6 mx-auto animate-spin" />
              <p className="text-xs">Loading search catalog...</p>
            </div>
          ) : !query.trim() ? (
            <div className="text-center py-8 space-y-2 text-gray-400">
              <BookOpen className="h-8 w-8 mx-auto stroke-1" />
              <p className="text-xs font-semibold uppercase tracking-wider">Search Catalog</p>
              <p className="text-sm max-w-xs mx-auto">Type anything to search courses, field programs, and humanitarian leaders instantly.</p>
            </div>
          ) : totalMatches === 0 ? (
            <div className="text-center py-8 space-y-2 text-gray-400">
              <p className="text-sm">No results found for &quot;<span className="font-semibold text-gray-700">{query}</span>&quot;.</p>
              <p className="text-xs">Try searching for keywords like &quot;health&quot;, &quot;nursing&quot;, &quot;wall&quot;, or &quot;leadership&quot;.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{totalMatches} match(es) found</p>

              {results.courses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-600 font-mono tracking-widest uppercase flex items-center gap-1.5 border-b border-emerald-50 pb-1">
                    <BookOpen className="h-3.5 w-3.5" /> Trainings &amp; Academy ({results.courses.length})
                  </h4>
                  <div className="divide-y divide-gray-50">
                    {results.courses.map(c => (
                      <button
                        key={c.id}
                        onClick={() => navigateTo('/programs')}
                        className="w-full text-left py-2.5 flex justify-between items-center group cursor-pointer"
                      >
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase font-mono block">{c.category}</span>
                          <span className="text-xs font-bold text-gray-800 group-hover:text-brand-primary transition-colors">{c.title}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.programs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-600 font-mono tracking-widest uppercase flex items-center gap-1.5 border-b border-emerald-50 pb-1">
                    <Globe className="h-3.5 w-3.5" /> Field Operations ({results.programs.length})
                  </h4>
                  <div className="divide-y divide-gray-50">
                    {results.programs.map(p => (
                      <button
                        key={p.id}
                        onClick={() => navigateTo('/programs')}
                        className="w-full text-left py-2.5 flex justify-between items-center group cursor-pointer"
                      >
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase font-mono block">{p.category}</span>
                          <span className="text-xs font-bold text-gray-800 group-hover:text-brand-primary transition-colors">{p.title}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.leaders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-600 font-mono tracking-widest uppercase flex items-center gap-1.5 border-b border-emerald-50 pb-1">
                    <User className="h-3.5 w-3.5" /> Leadership Team ({results.leaders.length})
                  </h4>
                  <div className="divide-y divide-gray-50">
                    {results.leaders.map(l => (
                      <button
                        key={l.id}
                        onClick={() => navigateTo('/about')}
                        className="w-full text-left py-2.5 flex justify-between items-center group cursor-pointer"
                      >
                        <div>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase font-mono block">{l.role}</span>
                          <span className="text-xs font-bold text-gray-800 group-hover:text-brand-primary transition-colors">{l.name}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
