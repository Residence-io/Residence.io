'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Search, Package, AlertCircle } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  currentQuantity: string;
  reorderLevel: string;
  minimumQuantity: string;
  unitCost: string;
  currency: string;
  active: boolean;
  defaultVendor?: { id: string; name: string };
  _count?: { movements: number };
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'ELECTRICAL',
    unitOfMeasure: 'PIECE',
    reorderLevel: '10',
    minimumQuantity: '5',
    unitCost: '0',
    notes: '',
  });

  const loadItems = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryFilter) params.append('category', categoryFilter);
    if (lowStockOnly) params.append('lowStockOnly', 'true');

    fetch(`/api/proxy/admin/inventory?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
  }, [search, categoryFilter, lowStockOnly]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/proxy/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reorderLevel: Number(formData.reorderLevel),
          minimumQuantity: Number(formData.minimumQuantity),
          unitCost: Number(formData.unitCost),
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({
          sku: '',
          name: '',
          category: 'ELECTRICAL',
          unitOfMeasure: 'PIECE',
          reorderLevel: '10',
          minimumQuantity: '5',
          unitCost: '0',
          notes: '',
        });
        loadItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="Operations"
          title="Inventory & Stores"
          description="Manage maintenance supplies, consumables, stock balances, and movements."
        />
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          <Plus className="size-4" />
          Add Item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, item name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="ELECTRICAL">Electrical</option>
          <option value="PLUMBING">Plumbing</option>
          <option value="HVAC">HVAC</option>
          <option value="CLEANING">Cleaning</option>
          <option value="HARDWARE">Hardware</option>
          <option value="CONSUMABLE">Consumable</option>
          <option value="SAFETY">Safety</option>
          <option value="OTHER">Other</option>
        </select>
        <button
          type="button"
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-3 py-2 rounded-xl text-sm font-medium border transition flex items-center gap-1.5 ${
            lowStockOnly
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <AlertCircle className="size-4" />
          Low Stock Only
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">
          Loading inventory items...
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="size-10 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">
            No Inventory Items
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Add maintenance parts, light bulbs, chemicals, and supplies to track
            stock levels.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">SKU & Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3">Reorder Point</th>
                <th className="px-4 py-3">Unit Cost</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const current = Number(item.currentQuantity);
                const reorder = Number(item.reorderLevel);
                const isLow = current <= reorder;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold text-slate-500">
                        {item.sku}
                      </div>
                      <div className="font-medium text-slate-900">
                        {item.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.category}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold ${isLow ? 'text-amber-600' : 'text-slate-900'}`}
                        >
                          {current} {item.unitOfMeasure}
                        </span>
                        {isLow && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {reorder} {item.unitOfMeasure}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.currency} {Number(item.unitCost).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/inventory/${item.id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Details &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Add Inventory Item
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    SKU *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sku: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="ELEC-001"
                    className="w-full px-3 py-2 border rounded-xl text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Unit of Measure *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.unitOfMeasure}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitOfMeasure: e.target.value,
                      })
                    }
                    placeholder="PIECE, KG, METER"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="LED Bulb 12W Warm"
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
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="HARDWARE">Hardware</option>
                  <option value="CONSUMABLE">Consumable</option>
                  <option value="SAFETY">Safety</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, reorderLevel: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Unit Cost (PKR)
                  </label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) =>
                      setFormData({ ...formData, unitCost: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
