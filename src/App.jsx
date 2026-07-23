import React, { useState } from 'react';
import Home from './Home.jsx';
import Frame from './Frame.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('default'); // 'default' atau 'custom'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Top Tab Navigation */}
      <nav className="flex justify-center gap-2 pt-6 px-4">
        <button
          onClick={() => setActiveTab('default')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'default'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Twibbon Default
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'custom'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Custom Frame (Unggah PNG)
        </button>
      </nav>

      {/* Render Komponen Sesuai Tab Terpilih */}
      {activeTab === 'default' ? <Home /> : <Frame />}
    </div>
  );
}
