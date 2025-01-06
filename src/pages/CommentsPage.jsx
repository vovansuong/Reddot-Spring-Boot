import React, { useEffect, useState } from "react";
import { UserCheck, UserPlus, UsersIcon, UserX } from "lucide-react";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import UsersTable from "../components/users/UsersTable";
import CommentGrowthChart from "../components/comments/CommentGrowthChart";
import UserActivityHeatmap from "../components/users/UserActivityHeatmap";
import UserDemographicsChart from "../components/users/UserDemographicsChart";
import axiosClient from "../untils/axiosClient";

const CommentsPage = () => {
  const [commentStats, setCommentStats] = useState({
    totalComments: 0,
    newCommentsToday: 0, 
  });

  // Gọi API để lấy tổng số user và người dùng mới hôm nay
  useEffect(() => {
    const fetchCommentStats = async () => {
      try {
        // Fetch total comments
        const totalCommentsResponse = await axiosClient.get("/statistics/count-comment");
        const totalComments = totalCommentsResponse.data.totalComments;

        // Fetch new comment today
        const today = new Date().toISOString().split("T")[0]; // Lấy ngày hiện tại dạng YYYY-MM-DD
        const newCommentsResponse = await axiosClient.get(`/statistics/count-comment-by-day?date=${today}`);
        const newCommentsToday = newCommentsResponse.data.totalCommentsByDay;

        setCommentStats((prevStats) => ({
          ...prevStats,
          totalComments,
          newCommentsToday,
        }));
      } catch (error) {
        console.error("Error fetching comments statistics:", error);
      }
    };

    fetchCommentStats();
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Comments" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Comments"
            icon={UsersIcon}
            value={commentStats.totalComments.toLocaleString()}
            color="#6366F1"
          />
          <StatCard
            name="New Comments Today"
            icon={UserPlus}
            value={commentStats.newCommentsToday}
            color="#10B981"
          />
         
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <CommentGrowthChart />
        </div>
      </main>
    </div>
  );
};

export default CommentsPage;
