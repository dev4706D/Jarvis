import { useState } from 'react';
import { teachFact, searchMemories } from '../lib/api';

/**
 * TeachPanel — panel for manually teaching Nova facts/preferences.
 */
export function TeachPanel({ isOpen, onClose }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleTeach(e) {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setStatus(null);

    try {
      await teachFact(content, category);
      setStatus({ type: 'success', message: 'Stored in memory!' });
      setContent('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const data = await searchMemories(searchQuery);
      setSearchResults(data.results || []);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsSearching(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="w-80 h-full border-l border-nova-border bg-nova-surface flex flex-col shrink-0 animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-nova-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <h2 className="text-sm font-semibold text-nova-text">Teach Nova</h2>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center
                     text-nova-text-muted hover:text-nova-text hover:bg-nova-surface-2
                     transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Teach Form */}
      <form onSubmit={handleTeach} className="p-4 border-b border-nova-border space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a fact, preference, or instruction..."
          className="w-full h-24 resize-none rounded-xl px-3 py-2.5
                     bg-nova-surface-2 border border-nova-border
                     text-nova-text text-sm placeholder-nova-text-muted
                     focus:outline-none focus:border-nova-accent/40
                     transition-all duration-200"
        />

        <div className="flex gap-2">
          {['general', 'preference', 'fact', 'instruction'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200
                ${category === cat
                  ? 'bg-nova-accent/15 text-nova-accent-light border border-nova-accent/20'
                  : 'bg-nova-surface-2 text-nova-text-muted border border-transparent hover:text-nova-text-secondary'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="w-full py-2 rounded-xl bg-nova-accent text-white text-sm font-medium
                     hover:bg-nova-accent-light disabled:opacity-50
                     transition-all duration-200"
        >
          {isSubmitting ? 'Storing...' : 'Store in Memory'}
        </button>

        {status && (
          <p className={`text-xs text-center ${
            status.type === 'success' ? 'text-nova-success' : 'text-nova-error'
          }`}>
            {status.message}
          </p>
        )}
      </form>

      {/* Search Memories */}
      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full rounded-xl px-3 py-2 pr-10
                         bg-nova-surface-2 border border-nova-border
                         text-nova-text text-sm placeholder-nova-text-muted
                         focus:outline-none focus:border-nova-accent/40
                         transition-all duration-200"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-nova-text-muted hover:text-nova-text"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-nova-text-muted font-medium">Results</p>
            {searchResults.map((mem, i) => (
              <div key={i} className="bg-nova-surface-2 rounded-xl p-3 border border-nova-border">
                <p className="text-xs text-nova-text leading-relaxed">{mem.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-nova-accent/10 text-nova-accent-light">
                    {mem.category}
                  </span>
                  <span className="text-[10px] text-nova-text-muted">
                    {(mem.similarity * 100).toFixed(0)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
