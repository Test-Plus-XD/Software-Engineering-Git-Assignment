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
    // For testing purposes, let's temporarily bypass auth for upload testing
    // Comment out this return to test uploads without authentication
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
        <header role="banner" className="relative z-10 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    AI Annotation Tool
                  </h1>
                </div>
              </div>
              <nav role="navigation" aria-label="Main navigation">
                <div className="flex items-center space-x-2">
                  <button
                    data-testid="upload-section"
                    onClick={() => setActiveSection('upload')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeSection === 'upload'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload
                  </button>
                  <button
                    data-testid="gallery-section"
                    onClick={() => setActiveSection('gallery')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeSection === 'gallery'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Gallery
                  </button>
                  <button
                    data-testid="chatbot-section"
                    onClick={() => setActiveSection('chatbot')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeSection === 'chatbot'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    AI Chat
                  </button>
                  <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-3"></div>
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
              <section className="text-center py-12">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-6">
                      Welcome to AI Annotation Tool
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                      Upload, organise, and annotate images with powerful AI-assisted labeling tools.
                      <br />
                      Build datasets efficiently with our intuitive interface.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Easy Upload</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Drag and drop images or browse to upload multiple files at once</p>
                    </div>

                    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Smart Labels</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Add custom labels with confidence scores for precise annotation</p>
                    </div>

                    <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Assistant</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Get help and insights from our intelligent chatbot assistant</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Upload Section */}
            {activeSection === 'upload' && (
              <section data-testid="upload-container" className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                      Upload New Images
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Add images to your dataset and start annotating with AI assistance
                    </p>
                  </div>
                  <ComponentErrorBoundary componentName="UploadForm">
                    <UploadForm />
                  </ComponentErrorBoundary>
                </div>
              </section>
            )}

            {/* Gallery Section */}
            {activeSection === 'gallery' && (
              <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          Image Gallery
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Browse and manage your uploaded images
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <DatabaseResetButton />
                  </div>
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
              <section className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        AI Assistant
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Chat with our AI assistant for help and information
                      </p>
                    </div>
                  </div>
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
        <footer className="relative z-10 bg-white/90 dark:bg-black/90 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">AI Annotation Tool v2</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Built with Next.js, React, and modern web technologies
              </p>
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-500">
                <span>Powered by AI</span>
                <span>•</span>
                <span>Secure & Fast</span>
                <span>•</span>
                <span>Open Source</span>
              </div>
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