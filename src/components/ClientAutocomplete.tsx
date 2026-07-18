'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { Client } from '@/types';

interface ClientAutocompleteProps {
  value: string;
  clients: Client[];
  onSelect: (client: Client) => void;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Inline autocomplete for the Bill To "Client name" field.
 * Shows a dropdown of matching saved clients as the user types.
 * Selecting a client fills in the entire form (name, email, phone, address).
 */
export function ClientAutocomplete({
  value,
  clients,
  onSelect,
  onChange,
  placeholder = 'Client name',
  className = '',
}: ClientAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter clients by name match — only when there's text to match against
  const matches = useMemo(() => {
    if (!value.trim() || value.length < 1) return [];
    const lower = value.toLowerCase();
    return clients
      .filter((c) => c.name.toLowerCase().includes(lower))
      .slice(0, 5); // Cap at 5 suggestions
  }, [value, clients]);

  // Reset highlight when matches change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [matches.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (client: Client) => {
    onSelect(client);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || matches.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter' && highlightedIndex < matches.length) {
      e.preventDefault();
      handleSelect(matches[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Use the same Input styling as the rest of the form
  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      />
      {isOpen && matches.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="py-1">
            {matches.map((client, index) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                  index === highlightedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{client.name}</span>
                  {client.email && (
                    <span className="text-xs text-muted-foreground truncate">{client.email}</span>
                  )}
                </div>
                {client.phone && (
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{client.phone}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
