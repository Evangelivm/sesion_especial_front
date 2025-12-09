"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface AutocompleteInputProps {
  suggestions: { id: number; name: string; compania?: string }[];
  onSelect: (id: number) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  dark?: boolean; // Para adaptar colores según el fondo
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  suggestions,
  onSelect,
  onClear,
  placeholder = "Ingrese nombre del participante",
  className = "",
  inputClassName = "",
  dark = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    { id: number; name: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.target.value;
    const filtered = suggestions.filter((suggestion) =>
      suggestion.name.toLowerCase().includes(userInput.toLowerCase())
    );

    setInputValue(e.target.value);
    setFilteredSuggestions(filtered);
    setShowSuggestions(true);
    setActiveSuggestionIndex(0);
  };

  const handleClick = (e: React.MouseEvent<HTMLLIElement>, id: number) => {
    const selectedSuggestion = filteredSuggestions.find((s) => s.id === id);

    setFilteredSuggestions([]);
    setInputValue(e.currentTarget.innerText);
    setShowSuggestions(false);
    setActiveSuggestionIndex(0);
    if (id !== 0) {
      onSelect(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const selectedSuggestion = filteredSuggestions[activeSuggestionIndex];

      if (selectedSuggestion) {
        setInputValue(selectedSuggestion.name);
        setFilteredSuggestions([]);
        setShowSuggestions(false);
        setActiveSuggestionIndex(0);
        if (selectedSuggestion.id !== 0) {
          onSelect(selectedSuggestion.id);
        }
      }
    } else if (e.key === "ArrowUp") {
      if (activeSuggestionIndex === 0) {
        return;
      }
      setActiveSuggestionIndex(activeSuggestionIndex - 1);
    } else if (e.key === "ArrowDown") {
      if (activeSuggestionIndex === filteredSuggestions.length - 1) {
        return;
      }
      setActiveSuggestionIndex(activeSuggestionIndex + 1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(0);
    onClear();
  };

  const SuggestionsListComponent = () => {
    const limitedSuggestions = filteredSuggestions.slice(0, 10);

    return limitedSuggestions.length ? (
      <ul className="suggestions absolute bg-white text-black border border-gray-300 rounded-md mt-1 z-[999] w-full max-h-[320px] overflow-y-auto shadow-lg">
        {limitedSuggestions.map((suggestion, index) => {
          let className = "suggestion-item p-2 cursor-pointer";
          if (index !== 0) {
            className += " hover:bg-gray-200";
          }
          if (index === activeSuggestionIndex) {
            className += " suggestion-active bg-gray-200";
          }
          return (
            <li
              className={className}
              key={suggestion.id}
              onClick={(e) => handleClick(e, suggestion.id)}
            >
              {suggestion.name}
            </li>
          );
        })}
      </ul>
    ) : (
      <div className="no-suggestions absolute bg-white text-black border border-gray-300 rounded-md mt-1 z-[999] w-full p-2 shadow-lg">
        <em>No hay sugerencias disponibles</em>
      </div>
    );
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative flex items-center w-full">
        <Input
          type="text"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={inputValue}
          placeholder={placeholder}
          className={
            inputClassName ||
            (dark
              ? "w-full bg-slate-800/90 border-slate-600 text-white placeholder:text-slate-400 pr-8"
              : "w-full bg-white/20 border-[#015481]/30 text-[#015481] placeholder:text-[#015481]/60 pr-8 font-medium")
          }
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className={
              dark
                ? "absolute right-2 text-slate-400 hover:text-white transition-colors"
                : "absolute right-2 text-[#015481]/70 hover:text-[#015481] transition-colors"
            }
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {showSuggestions && inputValue && <SuggestionsListComponent />}
    </div>
  );
};
