'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  AnalyzedFile, AppSettings, Notification, SearchHistory,
  analyzeFile, computeGlobalMetrics, exportSession
} from './engine';

// ============================================================
// STATE
// ============================================================
interface AppState {
  files: AnalyzedFile[];
  totalQueries: number;
  searchHistory: SearchHistory[];
  settings: AppSettings;
  notifications: Notification[];
  activeSection: string;
  selectedFile: AnalyzedFile | null;
  isLoading: boolean;
  globalMetrics: {
    totalIssues: number;
    indexTerms: number;
    topGlobalWords: { word: string; count: number }[];
    mergedFreq: Record<string, number>;
  };
}

type Action =
  | { type: 'ADD_FILE'; payload: { content: string; name: string; size: number } }
  | { type: 'DELETE_FILE'; payload: string }
  | { type: 'SET_SECTION'; payload: string }
  | { type: 'SELECT_FILE'; payload: AnalyzedFile | null }
  | { type: 'INCREMENT_QUERIES' }
  | { type: 'INCREMENT_FILE_QUERY'; payload: string }
  | { type: 'ADD_SEARCH_HISTORY'; payload: SearchHistory }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> };

// ============================================================
// DEFAULT SETTINGS
// ============================================================
const defaultSettings: AppSettings = {
  stopwordsEnabled: false,
  caseSensitive: false,
  realtimeSearch: false,
  maxFileSize: 5 * 1024 * 1024,
  theme: 'dark',
  highlightColor: '#f59e0b',
  snippetLength: 120,
  showLineNumbers: true,
  autoAnalyze: true,
  defaultFilter: 'case-insensitive',
  exportFormat: 'json',
  notificationsEnabled: true,
  soundEnabled: false,
};

const initialState: AppState = {
  files: [],
  totalQueries: 0,
  searchHistory: [],
  settings: defaultSettings,
  notifications: [],
  activeSection: 'home',
  selectedFile: null,
  isLoading: false,
  globalMetrics: { totalIssues: 0, indexTerms: 0, topGlobalWords: [], mergedFreq: {} },
};

// ============================================================
// REDUCER
// ============================================================
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_FILE': {
      const analyzed = analyzeFile(action.payload.content, action.payload.name, action.payload.size);
      const files = [...state.files, analyzed];
      const globalMetrics = computeGlobalMetrics(files, state.settings.stopwordsEnabled);
      return { ...state, files, globalMetrics, isLoading: false };
    }
    case 'DELETE_FILE': {
      const files = state.files.filter(f => f.id !== action.payload);
      const globalMetrics = computeGlobalMetrics(files, state.settings.stopwordsEnabled);
      const selectedFile = state.selectedFile?.id === action.payload ? null : state.selectedFile;
      return { ...state, files, globalMetrics, selectedFile };
    }
    case 'SET_SECTION':
      return { ...state, activeSection: action.payload };
    case 'SELECT_FILE':
      return { ...state, selectedFile: action.payload };
    case 'INCREMENT_QUERIES':
      return { ...state, totalQueries: state.totalQueries + 1 };
    case 'INCREMENT_FILE_QUERY': {
      const files = state.files.map(f =>
        f.id === action.payload ? { ...f, queryCount: f.queryCount + 1 } : f
      );
      return { ...state, files };
    }
    case 'ADD_SEARCH_HISTORY': {
      const searchHistory = [action.payload, ...state.searchHistory].slice(0, 50);
      return { ...state, searchHistory };
    }
    case 'UPDATE_SETTINGS': {
      const settings = { ...state.settings, ...action.payload };
      const globalMetrics = computeGlobalMetrics(state.files, settings.stopwordsEnabled);
      return { ...state, settings, globalMetrics };
    }
    case 'ADD_NOTIFICATION': {
      if (!state.settings.notificationsEnabled) return state;
      const notification: Notification = {
        ...action.payload,
        id: `notif_${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };
      return { ...state, notifications: [notification, ...state.notifications].slice(0, 50) };
    }
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n),
      };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    case 'CLEAR_ALL':
      return { ...initialState, settings: state.settings };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESTORE_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addFile: (file: File) => Promise<void>;
  deleteFile: (id: string) => void;
  navigateTo: (section: string) => void;
  notify: (type: Notification['type'], title: string, message: string) => void;
  doExport: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist to sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('sqo_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Restore dates
        parsed.files = (parsed.files || []).map((f: AnalyzedFile) => ({ ...f, uploadedAt: new Date(f.uploadedAt) }));
        parsed.searchHistory = (parsed.searchHistory || []).map((h: SearchHistory) => ({ ...h, timestamp: new Date(h.timestamp) }));
        dispatch({ type: 'RESTORE_STATE', payload: parsed });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('sqo_state', JSON.stringify({
        files: state.files,
        totalQueries: state.totalQueries,
        searchHistory: state.searchHistory,
        settings: state.settings,
        notifications: state.notifications,
      }));
    } catch {}
  }, [state.files, state.totalQueries, state.searchHistory, state.settings, state.notifications]);

  const addFile = useCallback(async (file: File) => {
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', title: 'Invalid File', message: 'Only .txt files are supported.' } });
      return;
    }
    if (file.size > state.settings.maxFileSize) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', title: 'File Too Large', message: `Max size is ${state.settings.maxFileSize/1024/1024}MB.` } });
      return;
    }
    if (file.size === 0) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', title: 'Empty File', message: 'The file contains no content.' } });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    const content = await file.text();
    dispatch({ type: 'ADD_FILE', payload: { content, name: file.name, size: file.size } });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', title: 'File Indexed', message: `${file.name} analyzed successfully.` } });
  }, [state.settings.maxFileSize]);

  const deleteFile = useCallback((id: string) => {
    const file = state.files.find(f => f.id === id);
    dispatch({ type: 'DELETE_FILE', payload: id });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'info', title: 'File Removed', message: `${file?.name || 'File'} deleted from index.` } });
  }, [state.files]);

  const navigateTo = useCallback((section: string) => {
    dispatch({ type: 'SET_SECTION', payload: section });
  }, []);

  const notify = useCallback((type: Notification['type'], title: string, message: string) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: { type, title, message } });
  }, []);

  const doExport = useCallback(() => {
    const data = exportSession(state.files, state.settings.exportFormat);
    const ext = state.settings.exportFormat;
    const mime = ext === 'json' ? 'application/json' : ext === 'csv' ? 'text/csv' : 'text/plain';
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sqo-export.${ext}`; a.click();
    URL.revokeObjectURL(url);
    notify('success', 'Export Complete', `Session exported as ${ext.toUpperCase()}`);
  }, [state.files, state.settings.exportFormat, notify]);

  return (
    <AppContext.Provider value={{ state, dispatch, addFile, deleteFile, navigateTo, notify, doExport }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
