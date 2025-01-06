import React, { useEffect, useState } from "react";
import { UserCheck, UserPlus, UsersIcon, UserX } from "lucide-react";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import HotTrendQuestions from "../components/questions/QuestionsTable";
import QuestionGrowthChart from "../components/questions/QuestionGrowthChart";
import UserActivityHeatmap from "../components/users/UserActivityHeatmap";
import UserDemographicsChart from "../components/users/UserDemographicsChart";
import axiosClient from "../untils/axiosClient";

const QuestionsPage = () => {
  const [questionStats, setQuestionStats] = useState({
    totalQuestions: 0,
    newQuestionsToday: 0, 
  });

  // Gọi API để lấy tổng số user và người dùng mới hôm nay
  useEffect(() => {
    const fetchQuestionStats = async () => {
      try {
        // Fetch total users
        const totalQuestionsResponse = await axiosClient.get("/statistics/count-question");
        const totalQuestions = totalQuestionsResponse.data.totalQuestions;

        // Fetch new users today
        const today = new Date().toISOString().split("T")[0]; // Lấy ngày hiện tại dạng YYYY-MM-DD
        const newQuestionsResponse = await axiosClient.get(`/statistics/count-question-by-day?date=${today}`);
        const newQuestionsToday = newQuestionsResponse.data.totalQuestionsByDay;

        setQuestionStats((prevStats) => ({
          ...prevStats,
          totalQuestions,
          newQuestionsToday,
        }));
      } catch (error) {
        console.error("Error fetching user statistics:", error);
      }
    };

    fetchQuestionStats();
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Questions" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Questions"
            icon={UsersIcon}
            value={questionStats.totalQuestions.toLocaleString()}
            color="#6366F1"
          />
          <StatCard
            name="New Questions Today"
            icon={UserPlus}
            value={questionStats.newQuestionsToday}
            color="#10B981"
          />
         
        </motion.div>

        <HotTrendQuestions />

        {/* USER CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <QuestionGrowthChart />
        </div>
      </main>
    </div>
  );
};

export default QuestionsPage;
