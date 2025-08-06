// Root Component: AnalyticsPage.tsx
import React, { useEffect, useState } from 'react';
import AnalyticsCards from './components/AnalyticsCards';
import ApplicationTable from './components/ApplicationTable';
import Graph from './components/Graph';
import Controls from './components/Controls';
import SearchAndFilter from './components/SearchAndFilter';
import AddJobModal from './components/AddJobModal';
import useStorage from './hooks/useStorage';
import './styles/styles.css'; 


const AnalyticsPage: React.FC = () => {
  const {
    apps,
    setApps,
    updateAppStatus,
    addNewApp,
    mergeAppsFromJson,
    stats,
    reload
  } = useStorage();

  const [showModal, setShowModal] = useState(false);
  const [filteredApps, setFilteredApps] = useState(apps);

  useEffect(() => {
    setFilteredApps(apps);
  }, [apps]);

  const handleSearch = (query: string) => {
    setFilteredApps(
      apps.filter(app =>
        app.jobTitle.toLowerCase().includes(query.toLowerCase()) ||
        app.companyLink.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  const handleFilter = (filter: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const isWithinDays = (dateStr: string, days: number) => {
      const date = new Date(dateStr);
      const pastDate = new Date();
      pastDate.setDate(now.getDate() - days);
      return date >= pastDate && date <= now;
    };

    let filtered = apps;
    if (filter === 'Today') filtered = apps.filter(app => app.dateApplied === todayStr);
    else if (filter === '1 Month') filtered = apps.filter(app => isWithinDays(app.dateApplied, 30));

    setFilteredApps(filtered);
  };

  return (
    <div>
      <div className="maincontent">
        <div className="parent">
          <AnalyticsCards stats={stats} />
          <Graph apps={apps} />
        </div>

        <Controls
          onAdd={() => setShowModal(true)}
          onUpload={mergeAppsFromJson}
        />

        <SearchAndFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
        />

        <ApplicationTable apps={filteredApps} onStatusChange={updateAppStatus} />
      </div>



      {showModal && (
        <AddJobModal
          onClose={() => setShowModal(false)}
          onSubmit={addNewApp}
        />
      )}
    </div>
  );
};

export default AnalyticsPage;
