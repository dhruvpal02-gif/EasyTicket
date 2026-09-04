import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsDashboard = ({ events }) => {
  // 1. Calculate Aggregates
  let totalRevenue = 0;
  let totalTicketsSold = 0;
  let activeEventsCount = 0;

  const revenuePerEvent = [];
  const eventNames = [];
  const ticketTypeBreakdown = {};

  events.forEach(event => {
    if (event.isPublished) activeEventsCount++;

    let eventRevenue = 0;
    event.ticketTypes.forEach(tt => {
      const sold = tt.sold || 0;
      const price = tt.price || 0;
      const typeRev = sold * price;
      
      eventRevenue += typeRev;
      totalRevenue += typeRev;
      totalTicketsSold += sold;

      // Accumulate for Doughnut chart
      if (sold > 0) {
        if (!ticketTypeBreakdown[tt.name]) {
          ticketTypeBreakdown[tt.name] = 0;
        }
        ticketTypeBreakdown[tt.name] += sold;
      }
    });

    eventNames.push(event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title);
    revenuePerEvent.push(eventRevenue);
  });

  // 2. Prepare Chart Data
  const barChartData = {
    labels: eventNames,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: revenuePerEvent,
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Revenue by Event' },
    },
  };

  const doughnutData = {
    labels: Object.keys(ticketTypeBreakdown),
    datasets: [
      {
        label: 'Tickets Sold',
        data: Object.values(ticketTypeBreakdown),
        backgroundColor: [
          'rgba(79, 70, 229, 0.8)', // Indigo
          'rgba(16, 185, 129, 0.8)', // Emerald
          'rgba(245, 158, 11, 0.8)', // Amber
          'rgba(239, 68, 68, 0.8)', // Red
          'rgba(14, 165, 233, 0.8)', // Sky
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Ticket Types Sold Breakdown' },
    },
  };

  return (
    <div className="analytics-container">
      {/* Summary Cards */}
      <div className="analytics-summary-cards">
        <div className="summary-card">
          <h3>Total Revenue</h3>
          <p className="summary-value text-indigo">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="summary-card">
          <h3>Tickets Sold</h3>
          <p className="summary-value text-emerald">{totalTicketsSold.toLocaleString('en-IN')}</p>
        </div>
        <div className="summary-card">
          <h3>Active Events</h3>
          <p className="summary-value text-amber">{activeEventsCount}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-charts-grid">
        <div className="chart-card bar-chart-wrap">
          <Bar data={barChartData} options={barChartOptions} />
        </div>
        <div className="chart-card doughnut-chart-wrap">
          {totalTicketsSold > 0 ? (
            <Doughnut data={doughnutData} options={doughnutOptions} />
          ) : (
            <div className="empty-chart">
              <p>No tickets sold yet to display breakdown.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
