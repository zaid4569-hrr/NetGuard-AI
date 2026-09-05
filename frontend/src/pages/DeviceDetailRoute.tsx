import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeviceDetail } from './DeviceDetail';
import { MOCK_ASSESSMENT } from '../services/mockData';

export const DeviceDetailRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const device = MOCK_ASSESSMENT.devices?.find((d) => d.id === id);

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
      findings={MOCK_ASSESSMENT.findings || []}
      onBack={() => navigate('/devices')}
    />
  );
};
