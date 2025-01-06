import React, { useEffect, useState } from "react";
import { UserCheck, UserPlus, UsersIcon, UserX } from "lucide-react";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import UsersTable from "../components/users/UsersTable";
import UserGrowthChart from "../components/users/UserGrowthChart";
import UserActivityHeatmap from "../components/users/UserActivityHeatmap";
import UserDemographicsChart from "../components/users/UserDemographicsChart";
import axiosClient from "../untils/axiosClient";

const UsersPage = () => {
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    newUsersToday: 0, 
  });

  // Gọi API để lấy tổng số user và người dùng mới hôm nay
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Fetch total users
        const totalUsersResponse = await axiosClient.get("/statistics/count-user");
        const totalUsers = totalUsersResponse.data.totalUsers;

        // Fetch new users today
        const today = new Date().toISOString().split("T")[0]; // Lấy ngày hiện tại dạng YYYY-MM-DD
        const newUsersResponse = await axiosClient.get(`/statistics/new-users-by-day?date=${today}`);
        const newUsersToday = newUsersResponse.data.newUsersByDay;

        setUserStats((prevStats) => ({
          ...prevStats,
          totalUsers,
          newUsersToday,
        }));
      } catch (error) {
        console.error("Error fetching user statistics:", error);
      }
    };

    fetchUserStats();
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Users" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Users"
            icon={UsersIcon}
            value={userStats.totalUsers.toLocaleString()}
            color="#6366F1"
          />
          <StatCard
            name="New Users Today"
            icon={UserPlus}
            value={userStats.newUsersToday}
            color="#10B981"
          />
         
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <UserGrowthChart />
        </div>
      </main>
    </div>
  );
};

export default UsersPage;