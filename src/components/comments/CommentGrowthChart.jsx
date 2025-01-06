import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import axiosClient from "../../untils/axiosClient";

const CommentGrowthChart = () => {
  const [commentGrowthData, setCommentGrowthData] = useState([]);

  useEffect(() => {
    const fetchCommentGrowthData = async () => {
      const year = new Date().getFullYear(); // Năm hiện tại
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];

      try {
        const requests = months.map((_, index) =>
          axiosClient.get(`/statistics/count-comment-by-month?year=${year}&month=${index + 1}`)
        );

        const responses = await Promise.all(requests);
        console.log(responses);

        const data = responses.map((response, index) => ({
          month: months[index],
          comments: response.data.totalCommentsByMonth || 0,
        }));

      
        setCommentGrowthData(data);
      } catch (error) {
        console.error("Error fetching comment growth data:", error);
      }
    };

    fetchCommentGrowthData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Comment Growth</h2>
      <div className="h-[320px]">
        <ResponsiveContainer width="200%" height="100%">
          <LineChart data={commentGrowthData}>
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
              dataKey="comments"
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

export default CommentGrowthChart;
