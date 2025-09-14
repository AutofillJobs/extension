import React from "react";

interface AnalyticsCardsProps {
  stats: {
    today: number;
    monthly: number;
    total: number;
  };
}

const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ stats }) => {
  const displayStats = stats;

  return (
    <section className="analytics-cards-container" aria-label="Job analytics cards">
      <div className="analytics-card">
        <div className="card-content">
          <h3 className="card-title">Today's Applications</h3>
          <p className="card-value">{stats.today}</p>
        </div>
        <div className="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="analytics-card">
        <div className="card-content">
          <h3 className="card-title">Monthly Applications</h3>
          <p className="card-value">{stats.monthly}</p>
        </div>
        <div className="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      <div className="analytics-card">
        <div className="card-content">
          <h3 className="card-title">Total Applications</h3>
          <p className="card-value">{stats.total}</p>
        </div>
        <div className="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
            <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.133 2.845a.75.75 0 011.06 0l1.72 1.72 1.72-1.72a.75.75 0 111.06 1.06l-1.72 1.72 1.72 1.72a.75.75 0 11-1.06 1.06L12 15.685l-1.72 1.72a.75.75 0 11-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <style>{`
        .analytics-cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
          width: 100%;
        }

        .analytics-card {
          background-color: #ffffff;
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid rgba(83, 82, 237, 0.2);
          transition: all 0.3s ease;
          min-height: 120px;
        }

        .analytics-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(83, 82, 237, 0.1);
          border-color: rgba(83, 82, 237, 0.4);
        }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .card-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #525252ff;
          margin: 0;
        }

        .card-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--accent-color);
          margin: 0;
          line-height: 1;
        }

        .card-icon {
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(83, 82, 237, 0.5);
          background-color: rgba(83, 82, 237, 0.1);
          border-radius: 0.75rem;
          padding: 0.5rem;
        }

        .card-icon svg {
          width: 1.5rem;
          height: 1.5rem;
        }

        @media (max-width: 768px) {
          .analytics-cards-container {
            grid-template-columns: 1fr;
          }
          
          .analytics-card {
            min-height: 100px;
            padding: 1.25rem;
          }
          
          .card-value {
            font-size: 1.5rem;
          }
          
          .card-icon {
            width: 2rem;
            height: 2rem;
          }
        }

        @media (min-width: 1024px) {
          .analytics-card {
            min-height: 140px;
          }
          
          .card-value {
            font-size: 2rem;
          }
        }
      `}</style>
    </section>
  );
};

export default AnalyticsCards;