import React from 'react';
import { User } from '../../../types';

export default function AnnouncementsTab({
  notificationForm,
  setNotificationForm,
  handleSendNotification,
  students,
  loading
}: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
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
  );
}
