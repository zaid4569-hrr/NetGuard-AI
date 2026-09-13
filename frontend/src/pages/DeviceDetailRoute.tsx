import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DeviceDetail } from './DeviceDetail';
import { useAssessment } from '../context/AssessmentContext';

export const DeviceDetailRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { assessment, loading } = useAssessment();

  if (loading || !assessment) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-mono">Loading device...</p>
      </div>
    );
  }

  const device = assessment.devices?.find((d) => d.id === id);

  if (!device) {
    return (
      <div className="text-center py-24 text-sm text-slate-500">
        Device not found.{' '}
        <button onClick={() => navigate('/devices')} className="text-cyan-400 hover:underline">
          Back to devices
        </button>
      </div>
    );
  }

  return (
    <DeviceDetail
      device={device}
      findings={assessment.findings || []}
      onBack={() => navigate('/devices')}
    />
  );
};
