import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LanguageProvider } from './context/LanguageContext';
import { SessionProvider } from './context/SessionContext';
import { BrandingProvider } from './context/BrandingContext';
import { NotificationProvider } from './context/NotificationContext';
// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AdminApprovals from './pages/admin/AdminApprovals';
import Teachers from './pages/admin/Teachers';
import Students from './pages/admin/Students';

import StudentGrades from './pages/admin/StudentGrades';
import TeacherDetails from './pages/admin/TeacherDetails';
import StudentDetails from './pages/admin/StudentDetails';
import AdminChats from './pages/admin/AdminChats';
import DeniedUsers from './pages/admin/DeniedUsers';
import AdminsList from './pages/admin/AdminsList';
import Profile from './pages/admin/Profile';
import SchoolDetails from './pages/admin/SchoolDetails';
import AdminBilling from './pages/admin/Billing';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import Languages from './pages/super-admin/Languages';
import Schools from './pages/super-admin/Schools';
import Admins from './pages/super-admin/Admins';
import SuperAdminSchoolDetails from './pages/super-admin/SchoolDetails';
import SuperAdminBilling from './pages/super-admin/Billing';
import SuperAdminProfile from './pages/super-admin/Profile';
import AuditLogs from './pages/super-admin/AuditLogs';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherAllStudents from './pages/teacher/AllStudents';
import TeacherGroupMessage from './pages/teacher/GroupMessage';
import TeacherConversations from './pages/teacher/Conversations';
import TeacherLiveConversation from './pages/teacher/LiveConversation';
import LiveConversationSession from './pages/teacher/LiveConversationSession';
import SendMessagePrivate from './pages/teacher/SendMessagePrivate';
import TeacherProfile from './pages/teacher/Profile';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentConversations from './pages/student/Conversations';
import StudentLiveConversation from './pages/student/LiveConversation';
import StudentProfile from './pages/student/Profile';
import ChangePassword from './pages/common/ChangePassword';
import HelpSupport from './pages/common/HelpSupport';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import DashboardLayout from './components/common/DashboardLayout';





function App() {
  return (
    <Router>
      <AuthProvider>
        <BrandingProvider>
          <SocketProvider>
            <SessionProvider>
              <NotificationProvider>
                <LanguageProvider>
                  <div className="App">
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        className: 'rounded-xl shadow-lg text-sm font-medium',
                        success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
                        error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
                      }}
                    />
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Navigate to="/login" replace />} />
                      <Route path="/login" element={
                        <PublicRoute>
                          <Login />
                        </PublicRoute>
                      } />
                      <Route path="/register" element={
                        <PublicRoute>
                          <Register />
                        </PublicRoute>
                      } />
                      <Route path="/forgot-password" element={
                        <PublicRoute>
                          <ForgotPassword />
                        </PublicRoute>
                      } />
                      <Route path="/reset-password" element={
                        <PublicRoute>
                          <ResetPassword />
                        </PublicRoute>
                      } />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />

                      {/* Main Dashboard Route */}
                      <Route path="/dashboard" element={<Dashboard />} />

                      {/* Use a placeholder for Super Admin Routes first */}
                      <Route path="/super-admin/dashboard" element={
                        <ProtectedRoute roles={['super admin']}>
                          <DashboardLayout>
                            <SuperAdminDashboard />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/super-admin/languages" element={
                        <ProtectedRoute roles={['super admin']}>
                          <DashboardLayout>
                            <Languages />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />

                      <Route path="/super-admin/schools" element={
                        <ProtectedRoute roles={['super admin']}>
                          <DashboardLayout>
                            <Schools />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/super-admin/schools/:id" element={
                        <ProtectedRoute roles={['super admin']}>
                          <DashboardLayout>
                            <SuperAdminSchoolDetails />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/super-admin/billing" element={
                        <ProtectedRoute roles={['super admin']}>
                          <DashboardLayout>
                            <SuperAdminBilling />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />

                      <Route path="/super-admin/profile" element={
                        <ProtectedRoute roles={['super admin']}>
                          <DashboardLayout>
                            <SuperAdminProfile />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />

                      <Route path="/super-admin/change-password" element={
                        <ProtectedRoute roles={['super admin']}>
                          <DashboardLayout>
                            <ChangePassword />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />

                      <Route path="/super-admin/audit-logs" element={
                        <ProtectedRoute roles={['super admin']}>
                          <DashboardLayout>
                            <AuditLogs />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />

                      <Route path="/super-admin/admins" element={
                        <ProtectedRoute roles={['super admin']}>
                          <DashboardLayout>
                            <Admins />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />

                      {/* Admin Routes */}
                      <Route path="/admin/dashboard" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <AdminDashboard />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/approvals" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <AdminApprovals />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/users" element={<Navigate to="/admin/students" replace />} />
                      <Route path="/admin/settings" element={<Navigate to="/admin/profile" replace />} />
                      <Route path="/admin/reports" element={<Navigate to="/admin/dashboard" replace />} />

                      <Route path="/admin/teachers" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <Teachers />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/teachers/:id" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <TeacherDetails />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/students" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <Students />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/students/:id" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <StudentDetails />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/students/grades" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <StudentGrades />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/chats" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <AdminChats />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/users/denied" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <DeniedUsers />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      {/* Admins are now a tab inside Manage School */}
                      <Route path="/admin/admins" element={<Navigate to="/admin/school-details" replace />} />
                      <Route path="/admin/school-details" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <SchoolDetails />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/billing" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <AdminBilling />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/profile" element={
                        <ProtectedRoute roles={['admin']}>
                          <DashboardLayout>
                            <Profile />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />


                      {/* Teacher Routes */}
                      <Route path="/teacher/dashboard" element={
                        <ProtectedRoute roles={['teacher']}>
                          <DashboardLayout>
                            <TeacherDashboard />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />


                      <Route path="/teacher/students" element={
                        <ProtectedRoute roles={['teacher']}>
                          <DashboardLayout>
                            <TeacherAllStudents />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/teacher/group-message" element={
                        <ProtectedRoute roles={['teacher']}>
                          <DashboardLayout>
                            <TeacherGroupMessage />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/teacher/conversations" element={
                        <ProtectedRoute roles={['teacher']}>
                          <DashboardLayout>
                            <TeacherConversations />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/teacher/live-conversation" element={
                        <ProtectedRoute roles={['teacher']}>
                          <DashboardLayout>
                            <TeacherLiveConversation />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/teacher/live-conversation-session" element={
                        <ProtectedRoute roles={['teacher']}>
                          <DashboardLayout>
                            <LiveConversationSession />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/teacher/send-message" element={
                        <ProtectedRoute roles={['teacher']}>
                          <DashboardLayout>
                            <SendMessagePrivate />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/teacher/profile" element={
                        <ProtectedRoute roles={['teacher']}>
                          <DashboardLayout>
                            <TeacherProfile />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/teacher/settings" element={
                        <ProtectedRoute roles={['teacher']}>
                          <DashboardLayout>
                            <ChangePassword />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />




                      {/* Student Routes */}
                      <Route path="/student/dashboard" element={
                        <ProtectedRoute roles={['student']}>
                          <DashboardLayout>
                            <StudentDashboard />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/student/conversations" element={
                        <ProtectedRoute roles={['student']}>
                          <DashboardLayout>
                            <StudentConversations />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/student/live-conversation" element={
                        <ProtectedRoute roles={['student']}>
                          <DashboardLayout>
                            <StudentLiveConversation />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/student/profile" element={
                        <ProtectedRoute roles={['student']}>
                          <DashboardLayout>
                            <StudentProfile />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />

                      <Route path="/student/settings" element={
                        <ProtectedRoute roles={['student']}>
                          <DashboardLayout>
                            <ChangePassword />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />

                      {/* Common Routes */}
                      <Route path="/help" element={
                        <ProtectedRoute roles={['admin', 'teacher', 'student']}>
                          <DashboardLayout>
                            <HelpSupport />
                          </DashboardLayout>
                        </ProtectedRoute>
                      } />

                      {/* Catch-all route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </LanguageProvider>
              </NotificationProvider>
            </SessionProvider>
          </SocketProvider>
        </BrandingProvider>
      </AuthProvider>
    </Router >
  );
}

export default App;