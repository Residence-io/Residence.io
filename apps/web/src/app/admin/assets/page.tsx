'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Search, Wrench } from 'lucide-react';

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  status: string;
  condition: string;
  location?: string;
  purchaseCost?: string;
  currency?: string;
  facility?: { id: string; name: string };
  assignedWorker?: { id: string; fullName: string; workerNumber: string };
  _count?: { maintenanceRequests: number; documents: number };
}

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'GENERATOR',
    location: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseCost: '',
    notes: '',
  });

  const loadAssets = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);

    fetch(`/api/proxy/admin/assets?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setAssets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAssets();
  }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/proxy/admin/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchaseCost: formData.purchaseCost
            ? Number(formData.purchaseCost)
            : undefined,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          category: 'GENERATOR',
          location: '',
          manufacturer: '',
          model: '',
          serialNumber: '',
          purchaseCost: '',
          notes: '',
        });
        loadAssets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            Active
          </span>
        );
      case 'IN_MAINTENANCE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            In Maintenance
          </span>
        );
      case 'OUT_OF_SERVICE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Out of Service
          </span>
        );
      case 'RETIRED':
      case 'DISPOSED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="Operations"
          title="Asset Management"
          description="Track society-owned physical equipment, warranties, and maintenance."
        />
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          <Plus className="size-4" />
          Add Asset
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset code, name, serial number, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="IN_MAINTENANCE">In Maintenance</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
          <option value="RETIRED">Retired</option>
          <option value="DISPOSED">Disposed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          Loading society assets...
        </div>
      ) : assets.length === 0 ? (
        <Card className="text-center py-12">
          <Wrench className="size-10 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">
            No Assets Found
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Register your society&apos;s generators, lifts, pumps, and other
            physical infrastructure.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card
              key={asset.id}
              className="flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {asset.assetCode}
                  </span>
                  {getStatusBadge(asset.status)}
                </div>
                <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                  {asset.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category: {asset.category.replace('_', ' ')}
                </p>
                {asset.location && (
                  <p className="text-xs text-slate-600 mt-2">
                    📍 {asset.location}
                  </p>
                )}
                {asset.facility && (
                  <p className="text-xs text-slate-600 mt-1">
                    🏢 Facility: {asset.facility.name}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {asset._count?.maintenanceRequests || 0} Tickets
                </span>
                <Link
                  href={`/admin/assets/${asset.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  View Details &rarr;
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              Add Society Asset
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Asset Name *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Cummins 100kVA Generator"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="GENERATOR">Generator</option>
                  <option value="PUMP">Pump / Water System</option>
                  <option value="LIFT_ELEVATOR">Lift / Elevator</option>
                  <option value="CCTV">CCTV Camera / Security</option>
                  <option value="GATE_BARRIER">Gate Barrier</option>
                  <option value="FIRE_EXTINGUISHER">Fire Safety</option>
                  <option value="HVAC">HVAC / Air Conditioning</option>
                  <option value="ELECTRICAL">Electrical Equipment</option>
                  <option value="MAINTENANCE_TOOL">Maintenance Tool</option>
                  <option value="COMMUNITY_HALL">Community Hall Asset</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Physical Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g. Basement Power Room"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                    placeholder="e.g. Cummins"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    placeholder="e.g. C100D5"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                    placeholder="SN-12345"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Purchase Cost (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.purchaseCost}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseCost: e.target.value })
                    }
                    placeholder="1500000"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
