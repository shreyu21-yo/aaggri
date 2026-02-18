import React, { useState, useEffect, useCallback } from 'react';
import { TranslationSet, Language } from '../types';
import { askGemini } from '../services/gemini';

interface Tip {
  title: string;
  content: string;
  category: string;
}

interface Props {
  location: string;
  lang: Language;
  t: TranslationSet;
}

export const FarmingTips: React.FC<Props> = ({ location, lang, t }) => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTips = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const reply = await askGemini(
        `Give 4 farming tips for farmers in ${location}. 
        Include:
        - Soil preparation
        - Suitable crops
        - Pest control
        - Market demand
        Keep it simple for farmers.`
