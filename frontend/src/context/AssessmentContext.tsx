import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Assessment } from '../types';
import { apiClient } from '../services/api';
import { MOCK_ASSESSMENT } from '../services/mockData';
import { useNotifications } from './NotificationContext';

interface AssessmentSummary {
  id: string;
  name: string;
  created_at: string;
  total_devices: number;
  overall_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
}

interface AssessmentContextType {
  assessment: Assessment | null;
  history: AssessmentSummary[];
  loading: boolean;
  /** true when the currently-shown data is the synthetic demo dataset, not a real audit */
  isDemoData: boolean;
  /** Re-fetches the current assessment + history from the backend. */
  reload: () => Promise<void>;
  /** Loads a specific assessment by id (e.g. from Report Center) and makes it the active one. */
  loadAssessment: (id: string) => Promise<void>;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

/**
 * Single source of truth for "which assessment is currently being viewed."
 *
 * Previously, every page (Dashboard, Findings, Devices, Security Center...)
 * independently hardcoded `useState(MOCK_ASSESSMENT)`, so uploading a real
 * config never showed up anywhere except the one-off audit results screen.
 * This context loads the real data once — driven by the `?assessment=<id>`
 * URL param when present, otherwise the user's most recent real audit — and
 * shares it across the whole authenticated app. Falling back to the
 * synthetic demo dataset only happens if the user genuinely has no audits
 * yet, and `isDemoData` lets pages say so clearly instead of pretending
 * mock data is real.
 */
export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [history, setHistory] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();

  const requestedId = searchParams.get('assessment');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiClient.listAssessments();
      setHistory(list);

      if (requestedId) {
        const detail = await apiClient.getAssessment(requestedId);
        setAssessment(detail);
        return;
      }

      if (list.length > 0) {
        const mostRecent = await apiClient.getAssessment(list[0].id);
        setAssessment(mostRecent);
        return;
      }

      setAssessment(MOCK_ASSESSMENT);
    } catch (err) {
      setAssessment(MOCK_ASSESSMENT);
      addNotification(
        'Could Not Load Audit Data',
        'Falling back to synthetic demo data. Check that the backend is running and you are logged in.',
        'warning'
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedId]);

  const loadAssessment = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const detail = await apiClient.getAssessment(id);
      setAssessment(detail);
    } catch (err) {
      addNotification('Could Not Load Report', 'That report could not be loaded.', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <AssessmentContext.Provider
      value={{
        assessment,
        history,
        loading,
        isDemoData: assessment?.id === MOCK_ASSESSMENT.id,
        reload,
        loadAssessment
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const ctx = useContext(AssessmentContext);
  if (!ctx) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return ctx;
};
