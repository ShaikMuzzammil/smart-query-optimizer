'use client';
// lib/AppContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { AppState, AppAction, AppSettings, FileData, Notification, SearchEntry } from './types';
import { generateId } from './analyzer';

const DEFAULT_SETTINGS: AppSettings = {
  filterStopwords: true,
  caseSensitiveSearch: false,
  minWordLength: 2,
  theme: 'dark',
  accentColor: '#00ff9d',
  showReadability: true,
  showSentiment: true,
  showBigrams: true,
  autoSearch: true,
  maxFileSizeMB: 10,
  exportFormat: 'json',
  notificationsEnabled: true,
  animationsEnabled: true,
  compactMode: false,
  keyboardShortcuts: true,
  defaultSearchFilters: {},
};

const INITIAL_STATE: AppState = {
  files: [],
  searchHistory: [],
  totalQueries: 0,
  notifications: [],
  settings: DEFAULT_SETTINGS,
  activeSection: 'home',
  isLoading: false,
  loadingMessage: '',
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_FILE':
      return { ...state, files: [...state.files, action.file] };

    case 'DELETE_FILE':
      return { ...state, files: state.files.filter(f => f.id !== action.id) };

    case 'UPDATE_FILE_QUERY_COUNT':
      return {
        ...state,
        files: state.files.map(f => f.id === action.id ? { ...f, queryCount: f.queryCount + 1 } : f),
      };

    case 'ADD_SEARCH':
      return {
        ...state,
        searchHistory: [action.entry, ...state.searchHistory].slice(0, 100),
        totalQueries: state.totalQueries + 1,
      };

    case 'INCREMENT_QUERIES':
      return { ...state, totalQueries: state.totalQueries + (action.count || 1) };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.notification].slice(-10),
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id),
      };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.section };

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading, loadingMessage: action.message || '' };

    case 'CLEAR_SESSION':
      return { ...INITIAL_STATE, settings: state.settings, activeSection: 'home' };

    case 'LOAD_STATE':
      return { ...state, ...action.state };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addNotification: (type: Notification['type'], title: string, message: string, duration?: number) => void;
  navigate: (section: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const SESSION_KEY = 'sqo_v3_session';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', state: { ...parsed, notifications: [], activeSection: 'home' } });
      }
    } catch {}
  }, []);

  // Save to sessionStorage on state change
  useEffect(() => {
    try {
      const toSave = {
        files: state.files,
        searchHistory: state.searchHistory,
        totalQueries: state.totalQueries,
        settings: state.settings,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(toSave));
    } catch {}
  }, [state.files, state.searchHistory, state.totalQueries, state.settings]);

  const addNotification = useCallback((type: Notification['type'], title: string, message: string, duration = 4000) => {
    if (!state.settings.notificationsEnabled) return;
    const notification: Notification = { id: generateId(), type, title, message, timestamp: Date.now(), duration };
    dispatch({ type: 'ADD_NOTIFICATION', notification });
    setTimeout(() => dispatch({ type: 'REMOVE_NOTIFICATION', id: notification.id }), duration);
  }, [state.settings.notificationsEnabled]);

  const navigate = useCallback((section: string) => {
    dispatch({ type: 'SET_ACTIVE_SECTION', section });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, addNotification, navigate }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Derived selectors
export function useMetrics() {
  const { state } = useApp();
  const totalFiles = state.files.length;
  const totalWords = state.files.reduce((s, f) => s + f.analysis.wordCount, 0);
  const totalLines = state.files.reduce((s, f) => s + f.analysis.lineCount, 0);
  const totalChars = state.files.reduce((s, f) => s + f.analysis.charCount, 0);
  const totalIssues = state.files.reduce((s, f) => s + f.analysis.issues.reduce((is, i) => is + i.count, 0), 0);
  const highImpactIssues = state.files.reduce((s, f) => s + f.analysis.issues.filter(i => i.severity === 'critical' || i.severity === 'high').reduce((is, i) => is + i.count, 0), 0);
  
  // Global unique terms
  const allTerms = new Set<string>();
  state.files.forEach(f => f.analysis.topWords.forEach(w => allTerms.add(w.word)));
  const indexTerms = allTerms.size;

  return { totalFiles, totalWords, totalLines, totalChars, totalIssues, highImpactIssues, indexTerms };
}
