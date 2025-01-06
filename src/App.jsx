import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/common/Sidebar";

import LoginPage from "./LoginPage";
import QuestionsPage from "./pages/QuestionsPage";
import CommentsPage from "./pages/CommentsPage";
import UsersPage from "./pages/UsersPage";
import UserProfilePage from "./pages/user/UserProfile";

// Component bảo vệ route
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");
  return token ? (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* BG */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-80" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>
      {/* Sidebar */}
      <Sidebar />
      {/* Content */}
      {children}
    </div>
  ) : (
    <Navigate to="/login" />
  );
};

function App() {
  return (
    <Routes>
      {/* Route công khai */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/profile/:username" element={<UserProfilePage />} />
      {/* Route được bảo vệ */}
      <Route
        path="/questions"
        element={
          <PrivateRoute>
            <QuestionsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/comments"
        element={
          <PrivateRoute>
            <CommentsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <UsersPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
