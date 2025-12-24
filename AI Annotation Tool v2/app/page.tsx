'use client'

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import WaveBackground from "./components/WaveBackground";
import ImageGallery from "./components/ImageGallery";
import UploadForm from "./components/UploadForm";
import SearchBar from "./components/SearchBar";
import ErrorBoundary from "./components/ErrorBoundary";
import ComponentErrorBoundary from "./components/ComponentErrorBoundary";
import AuthComponent from "./components/AuthComponent";
import ChatBox from "./components/ChatBox";
import DatabaseResetButton from "./components/DatabaseResetButton";

function HomeContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const selectedLabel = searchParams.get('label') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const [activeSection, setActiveSection] = useState('gallery');

  // Show authentication screen if not logged in
  if (!loading && !user) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-zinc-50 dark:bg-black relative">
          <WaveBackground />

          {/* Header */}
          <header role="banner" className="relative z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    AI Annotation Tool
                  </h1>
                </div>
              </div>
            </div>
          </header>

          {/* Authentication Section */}
          <main role="main" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <AuthComponent />
            </div>
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-zinc-50 dark:bg-black relative flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div data-testid="main-app" className="min-h-screen bg-zinc-50 dark:bg-black relative">
        <WaveBackground />

        {/* Header */}
        <header role="banner" className="relative z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Annotation Tool
                </h1>
              </div>
              <nav role="navigation" aria-label="Main navigation">
                <div className="flex items-center space-x-4">
                  <button
                    data-testid="upload-section"
                    onClick={() => setActiveSection('upload')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === 'upload'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                      }`}
                  >
                    Upload
                  </button>
                  <button
                    data-testid="gallery-section"
                    onClick={() => setActiveSection('gallery')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === 'gallery'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                      }`}
                  >
                    Gallery
                  </button>
                  <button
                    data-testid="chatbot-section"
                    onClick={() => setActiveSection('chatbot')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === 'chatbot'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                      }`}
                  >
                    AI Chat
                  </button>
                  <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
                  <DatabaseResetButton />
                  <AuthComponent />
                </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main role="main" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-12">
            {/* Welcome Section */}
            {activeSection === 'gallery' && (
              <section className="text-center py-8">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome to AI Annotation Tool
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Upload, organise, and annotate images with powerful AI-assisted labelling tools.
                  Build datasets efficiently with the intuitive interface.
                </p>
              </section>
            )}

            {/* Upload Section */}
            {activeSection === 'upload' && (
              <section data-testid="upload-container" className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                    Upload New Images
                  </h3>
                  <ComponentErrorBoundary componentName="UploadForm">
                    <UploadForm />
                  </ComponentErrorBoundary>
                </div>
              </section>
            )}

            {/* Gallery Section */}
            {activeSection === 'gallery' && (
              <section className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    Image Gallery
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Browse and manage uploaded images
                  </p>
                </div>

                {/* Search and Filter Bar */}
                <ComponentErrorBoundary componentName="SearchBar">
                  <SearchBar />
                </ComponentErrorBoundary>

                {/* Image Gallery with Search Parameters */}
                <ComponentErrorBoundary componentName="ImageGallery">
                  <ImageGallery
                    page={page}
                    searchQuery={searchQuery}
                    selectedLabel={selectedLabel}
                  />
                </ComponentErrorBoundary>
              </section>
            )}

            {/* Chatbot Section */}
            {activeSection === 'chatbot' && (
              <section className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    AI Assistant
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Chat with our AI assistant for help and information
                  </p>
                </div>

                <div data-testid="chatbox" className="max-w-4xl mx-auto">
                  <ComponentErrorBoundary componentName="ChatBox">
                    <ChatBox />
                  </ComponentErrorBoundary>
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300">
                AI Annotation Tool v2 - Built with Next.js and React
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-black relative flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}