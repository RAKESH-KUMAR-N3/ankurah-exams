import React from 'react';
import DashboardOverviewTab from '../../components/admin/tabs/DashboardOverviewTab';
import StudentsTab from '../../components/admin/tabs/StudentsTab';
import PaymentsTab from '../../components/admin/tabs/PaymentsTab';
import SubjectsAndChaptersTab from '../../components/admin/tabs/SubjectsAndChaptersTab';
import ExamsAndPlansTab from '../../components/admin/tabs/ExamsAndPlansTab';
import TestConfiguratorTab from '../../components/admin/tabs/TestConfiguratorTab';
import QuestionBankTab from '../../components/admin/tabs/QuestionBankTab';
import TimetableTab from '../../components/admin/tabs/TimetableTab';
import AnnouncementsTab from '../../components/admin/tabs/AnnouncementsTab';

interface AdminManagementProps {
  onRefresh: () => void;
  activeTab: string;
}

export default function AdminManagement({ activeTab }: AdminManagementProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-8">
      {activeTab === 'dashboard' && <DashboardOverviewTab />}

      {/* --- SUBTAB PANELS --- */}
      <div className="grid grid-cols-1 gap-8 pt-4">
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'exams' && <ExamsAndPlansTab />}
        {activeTab === 'tests' && <TestConfiguratorTab />}
        {activeTab === 'subjects' && <SubjectsAndChaptersTab />}
        {activeTab === 'questions' && <QuestionBankTab />}
        {activeTab === 'timetables' && <TimetableTab />}
        {activeTab === 'announcements' && <AnnouncementsTab />}
      </div>
    </div>
  );
}
