import { useEffect, useState } from 'react';
import supabase from '../../../config/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, defaults } from "chart.js/auto";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "./index.css";

defaults.maintainAspectRatio = false;
defaults.responsive = true;
defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.font.size = 20;
defaults.plugins.title.color = "black";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching user:', error.message);
        navigate('/login');
      } else {
        setUser(data?.session?.user || null);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign-out error:', error.message);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>

      <div className="chart-container">
        {/* Line Chart */}
        <div className="chart-card">
          <Line
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
              datasets: [
                {
                  label: 'Revenue',
                  data: [30, 45, 60, 75, 90],
                  backgroundColor: "#064FF0",
                  borderColor: "#064FF0",
                },
                {
                  label: 'Cost',
                  data: [20, 40, 55, 70, 85],
                  backgroundColor: "#FF3030",
                  borderColor: "#FF3030",
                },
              ],
            }}
            options={{
              plugins: {
                title: {
                  text: "Monthly Revenue & Cost",
                },
              },
            }}
          />
        </div>

        {/* Bar Chart */}
        <div className="chart-card">
          <Bar
            data={{
              labels: ['Source 1', 'Source 2', 'Source 3'],
              datasets: [{
                label: 'Count',
                data: [20, 30, 40],
                backgroundColor: ['rgba(43, 63, 229, 0.8)', 'rgba(250, 192, 19, 0.8)', 'rgba(253, 135, 135, 0.8)'],
                borderRadius: 5,
              }],
            }}
            options={{
              plugins: {
                title: {
                  text: "Revenue Source",
                },
              },
            }}
          />
        </div>

        {/* Doughnut Chart */}
        <div className="chart-card">
          <Doughnut
            data={{
              labels: ['Source 1', 'Source 2', 'Source 3'],
              datasets: [{
                label: 'Count',
                data: [20, 30, 40],
                backgroundColor: ['rgba(43, 63, 229, 0.8)', 'rgba(250, 192, 19, 0.8)', 'rgba(253, 135, 135, 0.8)'],
                borderColor: ['rgba(43, 63, 229, 0.8)', 'rgba(250, 192, 19, 0.8)', 'rgba(253, 135, 135, 0.8)'],
              }],
            }}
            options={{
              plugins: {
                title: {
                  text: "Revenue Sources",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
