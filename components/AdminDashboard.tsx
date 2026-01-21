import React, { useState, useEffect } from 'react';
import { getSubmissions, clearSubmissions } from '../services/storageService';
import { Submission } from '../types';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 200;

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Date Range State
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const data = getSubmissions();
    setSubmissions(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  const getQuarter = (d: Date) => Math.floor(d.getMonth() / 3);

  // Filter Logic
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) return;

    // Map data to clean object structure
    const exportData = filteredData.map(row => ({
      Timestamp: new Date(row.timestamp).toLocaleString(),
      "Full Name": row.fullName,
      Mobile: row.mobile,
      Email: row.email || "",
      "PIN Code": row.pinCode,
      "Batch Code": row.batchCode,
      Status: row.status,
      "Report URL": row.matchedUrl || "N/A",
      Device: row.deviceType
    }));

    // Create Worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");

    // Generate File
    XLSX.writeFile(wb, `ADI_Bharat_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-white shadow-sm sticky top-0 z-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="bg-indigo-600 text-white p-2 rounded mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
              </span>
              <h1 className="text-xl font-bold text-gray-900">ADI Bharat Console</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 hidden md:inline">Admin User</span>
              <button onClick={onLogout} className="text-gray-500 hover:text-red-600 font-medium text-sm border-l pl-4">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-64px)]">
        
        {/* Filter Controls */}
        <div className="bg-white p-5 rounded-lg shadow mb-6 border border-gray-200 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
             <div className="col-span-1">
               <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Date Range</label>
               <select 
                 value={filter} 
                 onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
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
                   <input type="date" value={customStart} onChange={(e) => { setCustomStart(e.target.value); setCurrentPage(1); }} className="block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                 </div>
                 <div className="flex-1">
                   <label className="block text-xs font-medium text-gray-500 uppercase mb-1">End Date</label>
                   <input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); setCurrentPage(1); }} className="block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                 </div>
               </div>
             )}

             <div className={`${filter === 'custom' ? 'col-span-1' : 'col-span-3'}`}>
               <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Search Records</label>
               <input 
                 type="text" 
                 placeholder="Search by phone, name or batch..." 
                 value={searchTerm}
                 onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                 className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
               />
             </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t mt-2">
            <span className="text-sm text-gray-500">
              Total Records: {filteredData.length} | Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex gap-3">
              <button 
                onClick={exportToExcel}
                disabled={filteredData.length === 0}
                className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${filteredData.length === 0 ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Download Excel
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

        {/* Data Table Container with Vertical Scroll */}
        <div className="bg-white shadow border border-gray-200 flex-1 overflow-hidden flex flex-col rounded-lg">
          <div className="overflow-y-auto flex-1 p-0">
            <table className="min-w-full divide-y divide-gray-200 relative">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIN</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report URL</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.length > 0 ? currentData.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.timestamp).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(sub.timestamp).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{sub.mobile}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.pinCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{sub.batchCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sub.status === 'SUCCESS' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Success</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Failure</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                      {sub.matchedUrl ? (
                        <a href={sub.matchedUrl} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-xs block">
                          View Report
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)}</span> of <span className="font-medium">{filteredData.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Simple Page Indicator */}
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;