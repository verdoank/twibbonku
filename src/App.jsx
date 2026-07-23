// src/App.jsx
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast'; // <-- Impor Toaster
import { Home as HomeIcon, ChevronRight, Image as ImageIcon } from 'lucide-react';
import Home from './Home.jsx';
import Frame from './Frame.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('default');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      
      {/* Toast Notification Provider */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Breadcrumb Navigation Bar */}
      <nav className="w-full max-w-xl mx-auto pt-4 px-4 flex items-center justify-between text-xs sm:text-sm font-medium">
        <ol className="inline-flex items-center space-x-1 sm:space-x-2 text-slate-500 dark:text-slate-400">
          <li className="inline-flex items-center">
            <button
              onClick={() => setActiveTab('default')}
              className={`inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                activeTab === 'default'
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : ''
              }`}
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Twibbon Default</span>
            </button>
          </li>
          
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => setActiveTab('custom')}
                className={`ml-1 sm:ml-2 inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                  activeTab === 'custom'
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : ''
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Custom Frame</span>
              </button>
            </div>
          </li>
        </ol>

        <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
          {activeTab === 'default' ? 'Mode Default' : 'Mode Custom'}
        </span>
      </nav>

      {/* Render Page */}
      {activeTab === 'default' ? <Home /> : <Frame />}
    </div>
  );
                }
