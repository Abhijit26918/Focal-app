"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

export interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  allTags: TagOption[];
  onTagCreated: (tag: TagOption) => void;
}

export function TagSelector({ selectedIds, onChange, allTags, onTagCreated }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const selectedTags = allTags.filter((t) => selectedIds.includes(t.id));
  const unselectedTags = allTags.filter((t) => !selectedIds.includes(t.id));
  const filteredTags = query.trim()
    ? unselectedTags.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : unselectedTags;

  // Only show "create" option when query doesn't exactly match an existing tag
  const exactMatch = allTags.some(
    (t) => t.name.toLowerCase() === query.trim().toLowerCase()
  );
  const canCreate = query.trim().length > 0 && !exactMatch;

  function toggleTag(tagId: string) {
    onChange(
      selectedIds.includes(tagId)
        ? selectedIds.filter((id) => id !== tagId)
        : [...selectedIds, tagId]
    );
    setQuery("");
    inputRef.current?.focus();
  }

  function removeTag(tagId: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== tagId));
  }

  async function createTag() {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create tag");
      const { tag } = await res.json();
      onTagCreated(tag);
      onChange([...selectedIds, tag.id]);
      setQuery("");
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canCreate) createTag();
      else if (filteredTags.length === 1) toggleTag(filteredTags[0].id);
    }
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
    // Backspace on empty input removes last tag
    if (e.key === "Backspace" && query === "" && selectedIds.length > 0) {
      onChange(selectedIds.slice(0, -1));
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input area with selected tag chips */}
      <div
        className={`flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-3 py-2 text-sm transition-colors cursor-text ${
          open
            ? "border-slate-400 ring-1 ring-slate-400 dark:border-slate-500 dark:ring-slate-500"
            : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
        }`}
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white shrink-0"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => removeTag(tag.id, e)}
              className="rounded-full opacity-70 hover:opacity-100 focus:outline-none"
              aria-label={`Remove tag ${tag.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? "Add tags…" : ""}
          className="min-w-[80px] flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          aria-label="Tag search"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="max-h-44 overflow-y-auto">
            {filteredTags.length === 0 && !canCreate && (
              <p className="px-3 py-2.5 text-center text-xs text-slate-400 dark:text-slate-500">
                {query ? "No matching tags" : "No tags yet — type to create one"}
              </p>
            )}

            {filteredTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-slate-800 dark:text-slate-200">{tag.name}</span>
              </button>
            ))}

            {canCreate && (
              <button
                type="button"
                onClick={createTag}
                disabled={creating}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 disabled:opacity-50"
              >
                <Plus className="h-3 w-3 shrink-0" />
                {creating ? "Creating…" : `Create "${query.trim()}"`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
