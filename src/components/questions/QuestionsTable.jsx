import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import axiosClient from "../../untils/axiosClient";

const HotTrendQuestions = () => {
  const [searchTerm, setSearchTerm] = useState("Java"); // Mặc định tag là "Java"
  const [questions, setQuestions] = useState([]);

  // Hàm lấy câu hỏi từ API
  const fetchQuestions = async (tagName) => {
    try {
      const response = await axiosClient.get(
        `/statistics/top-question-by-tag?tagName=${tagName}`
      );
      setQuestions(response.data);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestions([]);
    }
  };

  // Gọi API mỗi khi searchTerm thay đổi
  useEffect(() => {
    fetchQuestions(searchTerm);
  }, [searchTerm]);

  // Xử lý sự kiện tìm kiếm
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-100">
          Hot Trend Questions
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by tag"
            className="bg-gray-700 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Vote
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tag Name
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-700">
            {questions.length > 0 ? (
              questions
                .filter((question) => question.voteScore >= 0) // Lọc các câu hỏi có voteScore >= 0
                .map((question) => (
                  <motion.tr
                    key={question.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-100">
                        {question.questionTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-400">
                        {question.voteScore}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-400">
                        {question.tagName}
                      </div>
                    </td>
                  </motion.tr>
                ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-400"
                >
                  No questions found for the tag "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default HotTrendQuestions;
