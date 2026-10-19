import React, { useState, useEffect } from 'react';
import { Note } from '../types/notes';
import { Plus, Pin, Trash2, Edit3, Search, RefreshCw, RotateCcw, X, Check } from 'lucide-react';

export const NotesManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('Docker');
  const [formTags, setFormTags] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch notes from server
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (onlyPinned) params.append('pinned', 'true');

      const res = await fetch(`/api/notes?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch notes`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedCategory, onlyPinned]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes();
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('Docker');
    setFormTags('alpine, container');
    setFormPinned(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category);
    setFormTags(note.tags.join(', '));
    setFormPinned(note.pinned);
    setIsModalOpen(true);
  };

  // Save Note (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    try {
      setSaving(true);
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      if (editingNote) {
        // PUT
        const res = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            category: formCategory,
            tags: tagsArray,
            pinned: formPinned,
          }),
        });
        if (!res.ok) throw new Error('Failed to update note');
      } else {
        // POST
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            category: formCategory,
            tags: tagsArray,
            pinned: formPinned,
          }),
        });
        if (!res.ok) throw new Error('Failed to create note');
      }

      setIsModalOpen(false);
      await fetchNotes();
    } catch (err: any) {
      alert(err.message || 'Error saving note');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}/pin`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to toggle pin');
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
      );
    } catch (err: any) {
      console.error(err);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting note');
    }
  };

  // Reset to default
  const handleReset = async () => {
    if (!confirm('Reset notes back to standard containerized sample data?')) return;
    try {
      setLoading(true);
      await fetch('/api/notes/reset', { method: 'POST' });
      await fetchNotes();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Category counts
  const categories = ['All', 'Docker', 'Architecture', 'DevOps', 'Security', 'General'];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Live Notes Management</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time CRUD operations against the Express microservice with persistent JSON backing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
            title="Reset to default notes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setOnlyPinned(!onlyPinned)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1.5 transition-colors ml-2 ${
              onlyPinned
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pin className="w-3 h-3 fill-current" />
            <span>Pinned</span>
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes or tags..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchNotes();
              }}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </form>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 bg-slate-900/40 border border-slate-800/80 rounded-lg animate-pulse p-5 space-y-3"
            >
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-slate-800/60 rounded w-full" />
              <div className="h-3 bg-slate-800/60 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-lg text-sm text-rose-400">
          {error}
        </div>
      ) : notes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800 rounded-lg space-y-3">
          <p className="text-sm text-slate-400">No notes found matching current filters.</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-lg p-5 flex flex-col justify-between transition-all"
            >
              <div className="space-y-3">
                {/* Header row with Title and Pin button */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-100 tracking-tight leading-snug">
                    {note.title}
                  </h3>
                  <button
                    onClick={() => handleTogglePin(note.id)}
                    className={`p-1 rounded transition-colors shrink-0 ${
                      note.pinned
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={note.pinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin className={`w-4 h-4 ${note.pinned ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Content body */}
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {note.content}
                </p>
              </div>

              {/* Bottom metadata and action buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                {/* Clean unboxed metadata with dot separators */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                  <span className="font-medium text-slate-400">{note.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {new Date(note.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {note.tags && note.tags.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">#{note.tags.join(' #')}</span>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditModal(note)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                    title="Edit Note"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Alpine Linux Memory Limit"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Docker">Docker</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Security">Security</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Content</label>
                <textarea
                  required
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
                  placeholder="Detailed notes, technical considerations, or specifications..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  placeholder="docker, alpine, microservice"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNote"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="pinNote" className="text-xs text-slate-300 select-none cursor-pointer">
                  Pin this note to the top of the collection
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-md transition-colors"
                >
                  {saving ? 'Saving...' : editingNote ? 'Update Note' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
