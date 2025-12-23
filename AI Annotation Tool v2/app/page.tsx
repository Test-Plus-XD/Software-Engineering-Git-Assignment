import WaveBackground from "./components/WaveBackground";
import ImageGallery from "./components/ImageGallery";
import UploadForm from "./components/UploadForm";
import ErrorBoundary from "./components/ErrorBoundary";

export default function Home() {
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
              <nav role="navigation" aria-label="Main navigation">
                <div className="flex items-center space-x-4">
                  <a
                    href="#upload"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Upload
                  </a>
                  <a
                    href="#gallery"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Gallery
                  </a>
                </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main role="main" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-12">
            {/* Welcome Section */}
            <section className="text-center py-8">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to AI Annotation Tool
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Upload, organize, and annotate your images with powerful AI-assisted labeling tools.
                Build your dataset efficiently with our intuitive interface.
              </p>
            </section>

            {/* Upload Section */}
            <section id="upload" className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                  Upload New Images
                </h3>
                <UploadForm
                  onUploadSuccess={(image: any) => {
                    console.log('Upload successful:', image);
                    // Refresh gallery or show success message
                  }}
                  onUploadError={(error: any) => {
                    console.error('Upload failed:', error);
                  }}
                />
              </div>
            </section>

            {/* Gallery Section */}
            <section id="gallery" className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Image Gallery
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Browse and manage your uploaded images
                </p>
              </div>
              <ImageGallery />
            </section>
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
