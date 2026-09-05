import React, { useState } from 'react';
import { Device } from '../types';
import { Server, Search, ChevronRight, Shield, ShieldAlert, Cpu } from 'lucide-react';

interface DeviceTableProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({ devices, onSelectDevice }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      (d.hostname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = vendorFilter === 'ALL' || d.vendor.toLowerCase() === vendorFilter.toLowerCase();
    return matchesSearch && matchesVendor;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 85) return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
    if (score >= 70) return 'bg-amber-950/60 text-amber-400 border-amber-500/30';
    if (score >= 50) return 'bg-orange-950/60 text-orange-400 border-orange-500/30';
    return 'bg-red-950/60 text-red-400 border-red-500/30';
  };

  const getVendorBadge = (vendor: string) => {
    switch (vendor.toLowerCase()) {
      case 'cisco':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'fortinet':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'juniper':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
            Audited Network Devices ({devices.length})
          </h3>
          <p className="text-xs text-gray-400">
            Click any device row to view individual findings and vendor-specific CLI remediation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search hostname / file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors w-44 sm:w-56"
            />
          </div>

          {/* Vendor Filter */}
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Vendors</option>
            <option value="Cisco">Cisco</option>
            <option value="Fortinet">Fortinet</option>
            <option value="Juniper">Juniper</option>
          </select>
        </div>
      </div>

      {/* Device List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/60 border-b border-gray-800 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-4">Device / Hostname</th>
              <th className="py-3 px-4">Vendor & OS</th>
              <th className="py-3 px-4">Device Role</th>
              <th className="py-3 px-4 text-center">Score</th>
              <th className="py-3 px-4 text-center">Violations</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-xs">
            {filteredDevices.length > 0 ? (
              filteredDevices.map((dev) => (
                <tr
                  key={dev.id}
                  onClick={() => onSelectDevice(dev)}
                  className="hover:bg-gray-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 font-medium text-gray-100 flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-gray-800 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-200">{dev.hostname || dev.filename}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{dev.filename}</div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getVendorBadge(dev.vendor)} mb-1`}>
                      {dev.vendor} ({(dev.vendor_confidence * 100).toFixed(0)}%)
                    </span>
                    <div className="text-[11px] text-gray-400">{dev.os_version || 'Generic'}</div>
                  </td>

                  <td className="py-3.5 px-4 text-gray-300">
                    {dev.device_type || 'Network Device'}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-lg font-bold font-mono border ${getScoreBadge(dev.security_score)}`}>
                      {dev.security_score}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1.5 font-mono text-[11px]">
                      {dev.critical_count > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/30">
                          {dev.critical_count}C
                        </span>
                      )}
                      {dev.high_count > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-950/60 text-orange-400 border border-orange-500/30">
                          {dev.high_count}H
                        </span>
                      )}
                      {dev.medium_count > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
                          {dev.medium_count}M
                        </span>
                      )}
                      {dev.critical_count === 0 && dev.high_count === 0 && dev.medium_count === 0 && (
                        <span className="text-emerald-400 font-medium">Clean</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button className="p-1.5 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white group-hover:bg-blue-600 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                  No network devices found matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
