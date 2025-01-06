import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns"; // Import thư viện date-fns
import "../../../public/css/UserProfile.css"; // Tạo file CSS riêng để dễ quản lý

const UserProfilePage = () => {
  const { username } = useParams(); // Lấy username từ URL
  const [user, setUser] = useState({
    name: "Leeyuiwah",
    avatar: "https://via.placeholder.com/150",
    comment: 0,
    questions: 0,
    badges: {
      gold: [],
      silver: [],
      bronze: [],
    },
    tags: [],
    posts: [],
  });

  useEffect(() => {
    if (username) {
      const fetchUserData = async () => {
        try {
          // Lấy thông tin user từ API đầu tiên
          const userResponse = await axios.get(
            `/reddot/api/v1/users?username=${username}`
          );
          if (userResponse.data.status_code === 200) {
            const userData = userResponse.data.data;
            console.log(userData);
            const userId = userData.userId;

            // Cập nhật tên và avatar
            setUser((prevState) => ({
              ...prevState,
              name: userData.displayName || prevState.name,
              avatar: userData.avatarLink || prevState.avatar,
            }));

            // Gọi API lấy statistics (questions và answers)
            const [questionsResponse, answersResponse] = await Promise.all([
              axios.get(`/reddot/api/v1/statistics/${userId}/questions`),
              axios.get(`/reddot/api/v1/statistics/${userId}/answers`),
            ]);

            setUser((prevState) => ({
              ...prevState,
              questions: questionsResponse.data.totalQuestions || 0,
              comment: answersResponse.data.totalAnswers || 0,
            }));

            // Gọi API lấy danh sách badges
            const badgesResponse = await axios.get(
              `/reddot/api/v1/statistics/${userId}/listBadgesByUserId`
            );
            const badges = badgesResponse.data;
            // Phân loại badges
            const bronzeBadges = badges.filter(
              (badge) => badge.tier === "bronze"
            );
            const silverBadges = badges.filter(
              (badge) => badge.tier === "silver"
            );
            const goldBadges = badges.filter((badge) => badge.tier === "gold");
            setUser((prevState) => ({
              ...prevState,
              badges: {
                bronze: bronzeBadges,
                silver: silverBadges,
                gold: goldBadges,
              },
            }));

            // Gọi API lấy Top Tags
            const topTagsResponse = await axios.get(
              `/reddot/api/v1/statistics/getTopTags/${userId}`
            );
            const tags = topTagsResponse.data.map((tagString) => {
              const match = /(.+)\s\(used:\s(\d+)\stimes\)/.exec(tagString);
              return match ? { name: match[1], used: parseInt(match[2], 10) } : null;
            }).filter(Boolean);

            setUser((prevState) => ({
              ...prevState,
              tags,
            }));

             // Gọi API lấy Top Questions
             const topQuestionsResponse = await axios.get(
              `/reddot/api/v1/statistics/topQuestions/${userId}`
            );
            const posts = topQuestionsResponse.data.map((question) => ({
              id: question.questionId,
              title: question.questionTitle,
              votes: question.upvotes,
              type: "question",
            }));

            setUser((prevState) => ({
              ...prevState,
              posts,
            }));
          }
        } catch (error) {
          console.error("Error fetching user or statistics data:", error);
        }
      };

      fetchUserData();
    }
  }, [username]);

  return (
    <div className="user-profile">
      <div className="header">
        <img src={user.avatar} alt="User Avatar" className="avatar" />
        <div className="user-info">
          <h1>{user.name}</h1>
          <div className="stats">
            <p>
              <strong>{user.comment}</strong> comments
            </p>
            <p>
              <strong>{user.questions}</strong> questions
            </p>
          </div>
        </div>
      </div>

      <div className="badges">
        <h2>Badges</h2>
        <div className="badge-list">
          <div className="badge gold">
            <h3>Gold ({user.badges.gold.length})</h3>
            <ul>
              {user.badges.gold.map((badge) => (
                <li key={badge.id}>
                  <strong>{badge.name}</strong>:{" "}
                  {format(new Date(badge.createdAt), "dd/MM/yyyy")}
                </li>
              ))}
            </ul>
          </div>
          <div className="badge silver">
            <h3>Silver ({user.badges.silver.length})</h3>
            <ul>
              {user.badges.silver.map((badge) => (
                <li key={badge.id}>
                  <strong>{badge.name}</strong>:{" "}
                  {format(new Date(badge.createdAt), "dd/MM/yyyy")}
                </li>
              ))}
            </ul>
          </div>
          <div className="badge bronze">
            <h3>Bronze ({user.badges.bronze.length})</h3>
            <ul>
              {user.badges.bronze.map((badge) => (
                <li key={badge.id}>
                  <strong>{badge.name}</strong>:{" "}
                  {format(new Date(badge.createdAt), "dd/MM/yyyy")}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="tags">
        <h2>Top Tags</h2>
        <table>
          <thead>
            <tr>
              <th>Tag</th>
              <th>Used</th>
            </tr>
          </thead>
          <tbody>
            {user.tags.map((tag, index) => (
              <tr key={index}>
                <td>{tag.name}</td>
                <td>{tag.used}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <br />
      <hr />

      <div className="posts">
        <h2>Top Questions</h2>
        <ul>
          {user.posts.map((post) => (
            <li key={post.id} className="post-item">
              <h3>{post.title}</h3>
              <p>Score: {post.votes}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserProfilePage;
