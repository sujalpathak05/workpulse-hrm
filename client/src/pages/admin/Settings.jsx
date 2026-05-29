import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Layout from '../../components/layout/Layout';
import { toast } from 'react-toastify';
import { MapPin, Clock, Save, Building, Plus, Trash2 } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      // Ensure officeLocations array exists with default 2 locations
      if (!data.settings.officeLocations || data.settings.officeLocations.length === 0) {
        data.settings.officeLocations = [
          { name: 'Office 1', latitude: 28.586923, longitude: 77.315355, radius: 50 },
          { name: 'Office 2', latitude: 28.599652, longitude: 77.339100, radius: 50 },
        ];
      }
      setSettings(data.settings);
    }).catch(() => toast.error('Failed to load settings'))
    .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateLocation = (idx, field, value) => {
    const locs = [...settings.officeLocations];
    locs[idx] = { ...locs[idx], [field]: value };
    setSettings({ ...settings, officeLocations: locs });
  };

  const addLocation = () => {
    setSettings({
      ...settings,
      officeLocations: [...settings.officeLocations, { name: `Office ${settings.officeLocations.length + 1}`, latitude: '', longitude: '', radius: 50 }],
    });
  };

  const removeLocation = (idx) => {
    if (settings.officeLocations.length <= 1) return toast.error('Kam se kam 1 location zaroori hai');
    const locs = settings.officeLocations.filter((_, i) => i !== idx);
    setSettings({ ...settings, officeLocations: locs });
  };

  if (loading) return <Layout title="Settings"><div className="text-center py-20 text-gray-400">Loading...</div></Layout>;

  return (
    <Layout title="Company Settings">
      <form onSubmit={handleSave} className="space-y-5 max-w-3xl">

        {/* Company Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-xl"><Building size={17} className="text-blue-600" /></div>
            <h3 className="font-semibold text-gray-800">Company Information</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={settings?.companyName || ''}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Office Locations */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-xl"><MapPin size={17} className="text-green-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-800">Office Locations (Geo-Fencing)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Employee in se kisi bhi ek location ke radius mein ho to attendance lagegi</p>
              </div>
            </div>
            <button type="button" onClick={addLocation}
              className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 transition">
              <Plus size={13} /> Add Location
            </button>
          </div>

          <div className="space-y-4">
            {settings?.officeLocations?.map((loc, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                    Location {idx + 1}
                  </span>
                  {settings.officeLocations.length > 1 && (
                    <button type="button" onClick={() => removeLocation(idx)}
                      className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Location Name</label>
                    <input
                      type="text"
                      value={loc.name || ''}
                      onChange={(e) => updateLocation(idx, 'name', e.target.value)}
                      placeholder="e.g. Head Office"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={loc.latitude || ''}
                      onChange={(e) => updateLocation(idx, 'latitude', parseFloat(e.target.value))}
                      placeholder="28.599652"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={loc.longitude || ''}
                      onChange={(e) => updateLocation(idx, 'longitude', parseFloat(e.target.value))}
                      placeholder="77.339100"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Radius (meters)</label>
                    <input
                      type="number"
                      value={loc.radius || 50}
                      onChange={(e) => updateLocation(idx, 'radius', parseInt(e.target.value))}
                      min="10"
                      max="5000"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <MapPin size={11} /> Map pe dekho
                  </a>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{loc.latitude}, {loc.longitude} — {loc.radius}m radius</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
            Google Maps → Office pe right-click → "What's here?" → Latitude, Longitude copy karo
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-50 rounded-xl"><Clock size={17} className="text-purple-600" /></div>
            <h3 className="font-semibold text-gray-800">Working Hours</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Shift Start', key: 'shiftStart', type: 'time', default: '09:00' },
              { label: 'Shift End', key: 'shiftEnd', type: 'time', default: '18:00' },
              { label: 'Late After (mins)', key: 'lateMarkAfter', type: 'number', default: 15 },
            ].map(({ label, key, type, default: def }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  value={settings?.workingHours?.[key] ?? def}
                  onChange={(e) => setSettings({
                    ...settings,
                    workingHours: { ...settings.workingHours, [key]: type === 'number' ? parseInt(e.target.value) : e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Leave Policy */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Annual Leave Policy</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sick Leave Days', key: 'sickLeavePerYear' },
              { label: 'Casual Leave Days', key: 'casualLeavePerYear' },
              { label: 'Paid Leave Days', key: 'paidLeavePerYear' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="number"
                  value={settings?.leavePolicy?.[key] ?? 12}
                  onChange={(e) => setSettings({
                    ...settings,
                    leavePolicy: { ...settings.leavePolicy, [key]: parseInt(e.target.value) }
                  })}
                  min="0"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition disabled:opacity-60">
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </Layout>
  );
};

export default SettingsPage;
