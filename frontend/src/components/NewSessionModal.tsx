import React, { useState } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../api/client';

interface Props {
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

const TEMPLATES = [
  {
    title: 'Quantum Algorithms in Molecular Drug Discovery',
    description: 'VQE and QPE benchmarks for simulating transition-state barriers in oncogenic kinase targets.',
    tags: ['Quantum', 'Drug Discovery', 'VQE']
  },
  {
    title: 'Neuromorphic AI & Spiking Neural Dynamics',
    description: 'Ultra-low power spike-timing-dependent plasticity and memristive compute-in-memory architectures.',
    tags: ['Neuromorphic', 'SNN', 'Hardware']
  },
  {
    title: 'Autonomous Agent Alignment & Formal Verification',
    description: 'Sparse autoencoders for monosemantic feature interpretability and chain-of-thought verification.',
    tags: ['AI Safety', 'Mechanistic Interp']
  },
  {
    title: 'CRISPR Prime Editing & Epigenetic Modulators',
    description: 'Engineered pegRNA structured pseudoknots and lipid nanoparticle delivery vectors.',
    tags: ['CRISPR', 'Genomics']
  }
];

export default function NewSessionModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const newSession = await apiClient.createSession(title, description, tags);
      onCreated(newSession.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setTagsInput(tmpl.tags.join(', '));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-lg rounded-lg border shadow-panel overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--surface-base)',
          borderColor: 'var(--border-medium)',
        }}
      >
        {/* Header */}
        <div 
          className="h-10 px-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}
        >
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            New Research Workspace
          </span>

          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Preset templates */}
          <div>
            <div className="text-[10px] font-mono uppercase text-[var(--text-faint)] font-semibold mb-1.5">
              Domain Templates
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-2 rounded border border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-left transition-colors"
                >
                  <div className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                    {tmpl.title}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                    {tmpl.tags.join(' • ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[var(--text-secondary)]">
              Workspace Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Superconducting Qubit Noise Extrapolation"
              className="w-full px-2.5 py-1.5 rounded border bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[var(--text-secondary)]">
              Research Objective / Scope (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hypotheses or key questions..."
              className="w-full px-2.5 py-1.5 rounded border bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none resize-none"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          {/* Footer */}
          <div 
            className="pt-3 border-t flex items-center justify-end gap-2"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-4 py-1.5 rounded text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-30 transition-colors"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
