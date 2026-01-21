import React, { useState, useEffect } from 'react';
import { getSubmissions, clearSubmissions } from '../services/storageService';
import { Submission } from '../types';

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Date Range State
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    const data = getSubmissions();
    setSubmissions(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  const getQuarter = (d: Date) => Math.floor(d.getMonth() / 3);

  const filteredData = submissions.filter(item => {
    const date = new Date(item.timestamp);
    const now = new Date();
    let dateMatch = true;

    if (filter === 'today') {
      dateMatch = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (filter === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateMatch = date >= oneWeekAgo;
    } else if (filter === 'month') {
      dateMatch = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } else if (filter === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateMatch = date >= lastMonth && date < nextMonth;
    } else if (filter === 'quarter') {
      dateMatch = getQuarter(date) === getQuarter(now) && date.getFullYear() === now.getFullYear();
    } else if (filter === 'last_quarter') {
      const currentQ = getQuarter(now);
      const prevQ = currentQ === 0 ? 3 : currentQ - 1;
      const prevQYear = currentQ === 0 ? now.getFullYear() - 1 : now.getFullYear();
      dateMatch = getQuarter(date) === prevQ && date.getFullYear() === prevQYear;
    } else if (filter === 'custom') {
      if (customStart && customEnd) {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59); // End of day
        dateMatch = date >= start && date <= end;
      }
    }

    const searchMatch = 
      item.mobile.includes(searchTerm) || 
      item.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    return dateMatch && searchMatch;
  });

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ["Timestamp", "Full Name", "Mobile", "Email", "PIN", "Batch Code", "Status", "Matched URL", "Device"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => [
        `"${row.timestamp}"`,
        `"${row.fullName}"`,
        `"${row.mobile}"`,
        `"${row.email || ''}"`,
        `"${row.pinCode}"`,
        `"${row.batchCode}"`,
        `"${row.status}"`,
        `"${row.matchedUrl || ''}"`,
        `"${row.deviceType}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `adi_bharat_export_${filter}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="bg-indigo-600 text-white p-2 rounded mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
              </span>
              <h1 className="text-xl font-bold text-gray-900">ADI Bharat Console</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 hidden md:inline">admin@adibharat.com</span>
              <button onClick={onLogout} className="text-gray-500 hover:text-red-600 font-medium text-sm border-l pl-4">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-lg shadow mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
             <div className="col-span-1">
               <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Date Range</label>
               <select 
                 value={filter} 
                 onChange={(e) => setFilter(e.target.value)}
                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
               >
                 <option value="all">All Time</option>
                 <option value="today">Today</option>
                 <option value="week">This Week</option>
                 <option value="month">This Month</option>
                 <option value="last_month">Last Month</option>
                 <option value="quarter">This Quarter</option>
                 <option value="last_quarter">Last Quarter</option>
                 <option value="custom">Custom Range</option>
               </select>
             </div>

             {filter === 'custom' && (
               <div className="col-span-2 flex gap-2">
                 <div className="flex-1">
                   <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Start Date</label>
                   <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                 </div>
                 <div className="flex-1">
                   <label className="block text-xs font-medium text-gray-500 uppercase mb-1">End Date</label>
                   <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                 </div>
               </div>
             )}

             <div className={`${filter === 'custom' ? 'col-span-1' : 'col-span-3'}`}>
               <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Search Records</label>
               <input 
                 type="text" 
                 placeholder="Search by phone, name or batch..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
               />
             </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t mt-2">
            <span className="text-sm text-gray-500">Showing {filteredData.length} records</span>
            <div className="flex gap-3">
              <button 
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
                className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${filteredData.length === 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Export CSV
              </button>
              <button
                onClick={() => { if(confirm('Are you sure you want to delete ALL local data? This cannot be undone.')) { clearSubmissions(); setSubmissions([]); } }}
                className="inline-flex justify-center items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
              >
                Clear DB
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? filteredData.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.timestamp).toLocaleDateString()} <br/>
                      <span className="text-xs text-gray-400">{new Date(sub.timestamp).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{sub.fullName}</div>
                      <div className="text-sm text-gray-600">{sub.mobile}</div>
                      {sub.email && <div className="text-xs text-gray-400">{sub.email}</div>}
                      <div className="text-xs text-indigo-600 mt-1">PIN: {sub.pinCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      <span className="bg-gray-100 px-2 py-1 rounded">{sub.batchCode}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sub.status === 'SUCCESS' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Matched
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Failed
                        </span>
                      )}
                      {sub.matchedUrl && (
                        <a href={sub.matchedUrl} target="_blank" rel="noreferrer" className="block text-xs text-blue-500 mt-1 hover:underline">
                          View PDF
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.deviceType}
                      {sub.packImage && (
                        <div className="mt-1">
                          <img src={sub.packImage} alt="Pack" className="h-8 w-8 rounded border object-cover" />
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
