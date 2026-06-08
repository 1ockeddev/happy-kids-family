'use client';
import { useState, useEffect, useRef } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className = 'form-input'
}: AutocompleteInputProps) {
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filter suggestions based on input
    if (value && value.length > 0) {
      const filtered = suggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions);
    }
  }, [value, suggestions]);

  useEffect(() => {
    // Close suggestions when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions[activeSuggestionIndex]) {
        onChange(filteredSuggestions[activeSuggestionIndex]);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        className={className}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            marginTop: 4,
            maxHeight: 200,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                background: index === activeSuggestionIndex ? '#F3F4F6' : 'white',
                borderBottom: index < filteredSuggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                fontSize: 14,
                fontFamily: 'Sarabun, sans-serif',
                transition: 'background 0.15s'
              }}
              onMouseEnter={() => setActiveSuggestionIndex(index)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
