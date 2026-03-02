/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import type { MouseEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Fuel, Gauge, Calendar, MapPin, ChevronRight, Car, DollarSign, Droplets } from 'lucide-react';
import { Vehicle, Log } from './types';

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch vehicles on mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Fetch logs when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      fetchLogs(selectedVehicle.id);
    }
  }, [selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      setVehicles(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch vehicles', err);
      setLoading(false);
    }
  };

  const fetchLogs = async (vehicleId: number) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  const handleDeleteVehicle = async (e: MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this vehicle? All logs will be lost.')) return;
    
    try {
      await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (selectedVehicle?.id === id) setSelectedVehicle(null);
      fetchVehicles();
    } catch (err) {
      console.error('Failed to delete vehicle', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">車輛管理系統</h1>
            <p className="text-slate-500 mt-1">Vehicle Management System</p>
          </div>
          {!selectedVehicle && (
            <button
              onClick={() => setShowAddVehicle(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>新增車輛</span>
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar / Vehicle List */}
          <div className={`md:col-span-4 ${selectedVehicle ? 'hidden md:block' : 'block'}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-700">我的車庫</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">Loading...</div>
                ) : vehicles.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Car className="mx-auto mb-2 opacity-50" size={32} />
                    <p>尚無車輛</p>
                  </div>
                ) : (
                  vehicles.map(vehicle => (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 group relative ${
                        selectedVehicle?.id === vehicle.id ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-800">{vehicle.name}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {vehicle.make} {vehicle.model} {vehicle.year}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteVehicle(e, vehicle.id)}
                          className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 w-fit px-2 py-1 rounded-md">
                        <Gauge size={12} />
                        {vehicle.current_odometer?.toLocaleString()} km
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content / Details */}
          <div className={`md:col-span-8 ${!selectedVehicle ? 'hidden md:block' : 'block'}`}>
            {selectedVehicle ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={selectedVehicle.id}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <button 
                        onClick={() => setSelectedVehicle(null)}
                        className="md:hidden text-sm text-slate-500 mb-2 flex items-center gap-1"
                      >
                        ← 返回列表
                      </button>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedVehicle.name}</h2>
                      <div className="flex gap-3 mt-2 text-sm text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{selectedVehicle.year}</span>
                        <span>{selectedVehicle.make} {selectedVehicle.model}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddLog(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Plus size={18} />
                      <span>新增紀錄</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">目前里程</p>
                      <p className="text-xl font-mono font-semibold text-slate-800">
                        {selectedVehicle.current_odometer?.toLocaleString()}
                        <span className="text-xs text-slate-400 ml-1">km</span>
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">紀錄總數</p>
                      <p className="text-xl font-mono font-semibold text-slate-800">{logs.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">歷史紀錄</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <p>尚無紀錄，請點擊「新增紀錄」開始追蹤。</p>
                      </div>
                    ) : (
                      logs.map(log => (
                        <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-full ${
                              log.type === 'refuel' ? 'bg-emerald-100 text-emerald-600' : 
                              log.type === 'service' ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {log.type === 'refuel' ? <Fuel size={18} /> : 
                               log.type === 'service' ? <Car size={18} /> : 
                               <Gauge size={18} />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {log.type === 'refuel' ? '加油' : 
                                     log.type === 'service' ? '維修保養' : 
                                     '里程紀錄'}
                                  </p>
                                  <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                    <Calendar size={14} />
                                    {log.date}
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="font-mono">{log.odometer.toLocaleString()} km</span>
                                  </p>
                                </div>
                                {log.total_cost && (
                                  <div className="text-right">
                                    <p className="font-mono font-medium text-slate-900">
                                      ${log.total_cost.toLocaleString()}
                                    </p>
                                    {log.liters && (
                                      <p className="text-xs text-slate-500 font-mono">
                                        {log.liters}L @ ${log.price_per_liter}/L
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              {(log.location || log.notes) && (
                                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-3 text-sm text-slate-600">
                                  {log.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin size={14} className="text-slate-400" />
                                      {log.location}
                                    </span>
                                  )}
                                  {log.notes && (
                                    <span className="text-slate-500 italic">
                                      "{log.notes}"
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="hidden md:flex h-full min-h-[400px] items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                <div className="text-center">
                  <Car className="mx-auto mb-4 opacity-20" size={64} />
                  <p>請選擇左側車輛查看詳情</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showAddVehicle && (
          <AddVehicleModal 
            onClose={() => setShowAddVehicle(false)} 
            onSuccess={() => {
              setShowAddVehicle(false);
              fetchVehicles();
            }} 
          />
        )}
      </AnimatePresence>

      {/* Add Log Modal */}
      <AnimatePresence>
        {showAddLog && selectedVehicle && (
          <AddLogModal 
            vehicle={selectedVehicle}
            onClose={() => setShowAddLog(false)} 
            onSuccess={() => {
              setShowAddLog(false);
              fetchLogs(selectedVehicle.id);
              fetchVehicles(); // Update odometer in list
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddVehicleModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    initial_mileage: 0
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">新增車輛</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">車輛暱稱 *</label>
            <input 
              required
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="例如：小白, 上班用車"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">廠牌</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Toyota"
                value={formData.make}
                onChange={e => setFormData({...formData, make: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">型號</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Altis"
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">年份</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.year}
                onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">初始里程 (km)</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.initial_mileage}
                onChange={e => setFormData({...formData, initial_mileage: parseInt(e.target.value)})}
              />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 font-medium hover:bg-slate-50 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              建立車輛
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AddLogModal({ vehicle, onClose, onSuccess }: { vehicle: Vehicle, onClose: () => void, onSuccess: () => void }) {
  const [type, setType] = useState<'refuel' | 'mileage' | 'service'>('refuel');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer: vehicle.current_odometer || vehicle.initial_mileage,
    liters: '',
    price_per_liter: '',
    total_cost: '',
    location: '',
    notes: ''
  });

  // Auto-calculate total cost if liters and price are present
  useEffect(() => {
    if (formData.liters && formData.price_per_liter) {
      const total = parseFloat(formData.liters) * parseFloat(formData.price_per_liter);
      setFormData(prev => ({ ...prev, total_cost: Math.round(total).toString() }));
    }
  }, [formData.liters, formData.price_per_liter]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/vehicles/${vehicle.id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type,
          odometer: Number(formData.odometer),
          liters: formData.liters ? Number(formData.liters) : null,
          price_per_liter: formData.price_per_liter ? Number(formData.price_per_liter) : null,
          total_cost: formData.total_cost ? Number(formData.total_cost) : null,
        })
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-900">新增紀錄</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <div className="p-6 pt-2">
          <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
            {(['refuel', 'mileage', 'service'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  type === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'refuel' ? '加油' : t === 'mileage' ? '里程' : '維修'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">日期 *</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">目前里程 (km) *</label>
                <input 
                  required
                  type="number" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.odometer}
                  onChange={e => setFormData({...formData, odometer: e.target.value})}
                />
              </div>
            </div>

            {type === 'refuel' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">油量 (公升)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.liters}
                      onChange={e => setFormData({...formData, liters: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">單價 ($/L)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.price_per_liter}
                      onChange={e => setFormData({...formData, price_per_liter: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">總金額 ($)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                    value={formData.total_cost}
                    onChange={e => setFormData({...formData, total_cost: e.target.value})}
                  />
                </div>
              </>
            )}

            {type === 'service' && (
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">總金額 ($)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.total_cost}
                    onChange={e => setFormData({...formData, total_cost: e.target.value})}
                  />
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">地點 / 備註</label>
              <div className="grid grid-cols-1 gap-2">
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="地點 (例如: 中油台北站)"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
                <textarea 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="備註事項..."
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 px-4 py-2 text-slate-700 font-medium hover:bg-slate-50 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                儲存紀錄
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
