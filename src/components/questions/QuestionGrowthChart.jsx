import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import axiosClient from "../../untils/axiosClient";

const QuestionGrowthChart = () => {
  const [questionGrowthData, setQuestionGrowthData] = useState([]);

  useEffect(() => {
    const fetchQuestionGrowthData = async () => {
      const year = new Date().getFullYear(); // Năm hiện tại
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];

      try {
        const requests = months.map((_, index) =>
          axiosClient.get(`/statistics/count-question-by-month?year=${year}&month=${index + 1}`)
        );

        const responses = await Promise.all(requests);

        const data = responses.map((response, index) => ({
          month: months[index],
          questions: response.data.totalQuestionsByMonth || 0,
        }));

        setQuestionGrowthData(data);
      } catch (error) {
        console.error("Error fetching question growth data:", error);
      }
    };

    fetchQuestionGrowthData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Question Growth</h2>
      <div className="h-[320px]">
        <ResponsiveContainer width="200%" height="100%">
          <LineChart data={questionGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(31, 41, 55, 0.8)",
                borderColor: "#4B5563",
              }}
              itemStyle={{ color: "#E5E7EB" }}
            />
            <Line
              type="monotone"
              dataKey="questions"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default QuestionGrowthChart;
