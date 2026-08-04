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
import DoubtsTab from '../../components/admin/tabs/DoubtsTab';

interface AdminManagementProps {
  onRefresh: () => void;
  activeTab: string;
  onNavigate?: (tab: string) => void;
}

export default function AdminManagement({ activeTab, onNavigate }: AdminManagementProps) {
  return (
    <div className="bg-transparent space-y-6 text-slate-100">
      {activeTab === 'dashboard' && <DashboardOverviewTab onNavigate={onNavigate} />}

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
        {activeTab === 'doubts' && <DoubtsTab />}
      </div>
    </div>
  );
}
