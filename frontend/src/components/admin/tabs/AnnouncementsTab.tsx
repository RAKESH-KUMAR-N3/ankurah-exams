import React from 'react';
import { User } from '../../../types';
import { useState } from 'react';
import { useAdminContext } from '../../../context/AdminContext';
import { Check, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });


export default function AnnouncementsTab() {
  const { students, refreshAdminData } = useAdminContext();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [notificationForm, setNotificationForm] = useState({ id: '', studentId: '', title: '', message: '' });

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    refreshAdminData();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          userId: notificationForm.studentId || 'all',
          title: notificationForm.title,
          message: notificationForm.message
        })
      });
      if (!res.ok) throw new Error('Failed to send notification');
      setNotificationForm({ id: '', studentId: '', title: '', message: '' });
      showSuccess("Broadcast Notification dispatched to device channels!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-xs">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
          <Check className="w-5 h-5" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Broadcast Device Notification</h3>
        <form onSubmit={handleSendNotification} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div>
            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Target Student</label>
            <select
              value={notificationForm.studentId}
              onChange={(e) => setNotificationForm({ ...notificationForm, studentId: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
            >
              <option value="">Broadcast to All Students</option>
              {students.map((s: User) => (
                <option key={s.uid} value={s.uid}>{s.name} ({s.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Alert Title</label>
            <input
              type="text"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none"
              placeholder="e.g. Schedule Maintenance or Timetable Changed"
              required
            />
          </div>
          <div>
            <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1">Alert Message</label>
            <textarea
              value={notificationForm.message}
              onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:outline-none h-24"
              placeholder="Detail text to show in notification center..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider cursor-pointer"
          >
            Send Push Notification
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Academic Board Broadcasting</h3>
        <p className="text-slate-500">Coordinate notification feeds linked to system devices.</p>
          </div>
    </div>
    </div>
  );
}
