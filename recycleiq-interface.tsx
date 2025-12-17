import { useState, useEffect } from 'react';
import { MapPin, Camera, Check, Info, Scan, Map, Loader2, Recycle } from 'lucide-react';
import { useAnalyzeItem } from './src/hooks/useAnalyzeItem';
import ImageUpload from './src/components/ImageUpload';
import ResultsPanel from './src/components/ResultsPanel';
import SourcesPanel from './src/components/SourcesPanel';
import ChatPage from './src/components/ChatPage';
import ChatCard from './src/components/ChatCard';
import FacilityCard from './src/components/FacilityCard';
import FacilityMap from './src/components/FacilityMap';
import HowItWorks from './src/components/HowItWorks';
import GlassSurface from './src/components/GlassSurface';
import FAQ from './src/components/FAQ';
import type { ChatContext } from './src/types/recycleiq';
import LocationAutocomplete from './src/components/LocationAutocomplete';

const RecycLens = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'how-it-works' | 'chat' | 'faq'>('home');
  const [location, setLocation] = useState('');
  const [context, setContext] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | undefined>(undefined);
  
  const { analyze, loading, error, data, stage, complete, visionData } = useAnalyzeItem();

  // Map stages to user-friendly messages
  const stageMessages: Record<string, string> = {
    'analyzing-vision': 'Analyzing image...',
    'querying-rag': 'Querying local regulations...',
    'analyzing-recyclability': 'Determining recyclability and searching for facilities...',
    'geocoding': 'Finding recycling locations...',
  };

  const getButtonText = () => {
    if (!loading) {
      return 'Check if it\'s Recyclable';
    }
    return stageMessages[stage] || 'Analyzing...';
  };

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCheck = async () => {
    // Validation
    if (!location.trim()) {
      alert('Please enter your location');
      return;
    }

    if (!imageFile && !context.trim()) {
      alert('Please provide either an image or context description');
      return;
    }

    try {
      let imageBase64: string | undefined;
      if (imageFile) {
        // Convert image to base64 only if image is provided
        imageBase64 = await convertImageToBase64(imageFile);
      }

      // Call API - this will handle stages up to geocoding
      await analyze({
        image: imageBase64,
        location: location.trim(),
        context: context.trim() || '', // Allow empty context
      });

      // Show results - geocoding stage is already set, completion will be handled by FacilityMap
      setShowResult(true);
    } catch (err) {
      // Error is handled by the hook, but we can show an alert too
      console.error('Analysis failed:', err);
    }
  };

  // Handle completion when there are no facilities to geocode
  useEffect(() => {
    if (data && data.facilities && data.facilities.length === 0 && stage === 'geocoding') {
      complete();
    }
  }, [data, stage, complete]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-4 pt-4">
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={24}
          className="max-w-7xl mx-auto"
        >
          <div className="px-6 py-4 flex items-center justify-between w-full">
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <Recycle className="w-8 h-8 text-green-500" />
              <span className="text-xl font-light tracking-tight">RecycLens</span>
            </button>
            <div className="flex items-center space-x-8">
              <button
                onClick={() => setCurrentPage('chat')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Chat
              </button>
              <button
                onClick={() => setCurrentPage('how-it-works')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                How it Works
              </button>
              <button
                onClick={() => setCurrentPage('faq')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Common Questions
              </button>
            </div>
          </div>
        </GlassSurface>
      </nav>

      {currentPage === 'home' ? (
        <>
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-light tracking-tight text-gray-900 mb-4">
            Know What to Recycle,<br />Instantly.
          </h1>
          <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
            Set your location, upload an item photo, add context, and get clear recycling guidance.
          </p>
        </div>

        {/* Main content container */}
        <div className={showResult ? 'flex flex-col md:flex-row items-stretch justify-center gap-8' : ''}>
          {/* Left Column: Upload + Chat Card */}
          <div className={`transition-all duration-700 ease-in-out flex flex-col gap-8 ${
            showResult 
              ? 'w-full md:w-[40%]' // Full width on mobile, 40% on desktop when results show
              : 'max-w-2xl mx-auto' // Centered with same max-width as subtitle
          }`}>
            {/* Entry Box - transitions from centered to left (40%) */}
            <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 p-8 transition-all duration-700 ease-in-out ${
              showResult 
                ? 'w-full' // Full width of left column
                : 'w-full' // Full width when centered
            }`}>
            {/* Location Input with Autocomplete */}
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              placeholder="Enter your city or ZIP code"
              required={true}
            />

            {/* Context Input */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Add additional context {!imageFile && <span className="text-red-500">*</span>}
                {imageFile && <span className="text-gray-400 text-xs font-normal">(optional)</span>}
              </label>
              <textarea
                placeholder="e.g., Plastic container with food residue"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none text-gray-900"
                rows={3}
              />
              {!imageFile && (
                <p className="mt-2 text-xs text-gray-500">Required if no image is provided</p>
              )}
            </div>

            {/* Upload Area */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Item Photo {!context.trim() && <span className="text-red-500">*</span>}
                {context.trim() && <span className="text-gray-400 text-xs font-normal">(optional)</span>}
              </label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                imagePreview={imagePreview}
                onRemove={handleRemoveImage}
              />
              {!context.trim() && (
                <p className="mt-2 text-xs text-gray-500">Required if no context is provided</p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleCheck}
              disabled={loading || !location.trim() || (!imageFile && !context.trim())}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-full font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {getButtonText()}
                </>
              ) : (
                'Check if it\'s Recyclable'
              )}
            </button>
            </div>

            {/* Chat Card - directly underneath upload card, dynamically fills space */}
            {showResult && data && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex-1 flex items-center justify-center min-h-[200px] transition-all duration-700 ease-in-out">
                <div className="w-full h-full flex items-center justify-center">
                  <ChatCard
                    onClick={() => {
                      setChatContext({
                        analysisData: data,
                        location: location.trim(),
                        material: data.materialDescription,
                        visionData: visionData || undefined,
                      });
                      setCurrentPage('chat');
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Results Panel */}
          <div className={`transition-all duration-700 ease-in-out ${
            showResult && data
              ? 'w-full md:w-[40%] opacity-100 translate-x-0' 
              : 'w-0 opacity-0 translate-x-8 overflow-hidden'
          }`}>
            {data && (
              <ResultsPanel
                data={data}
                isVisible={showResult}
              />
            )}
          </div>
        </div>

        {/* Sources Panel - appears below both columns */}

        {/* Sources Panel - appears below both columns */}
        {showResult && data && (
          <div className={`mt-8 transition-all duration-700 ease-in-out ${
            showResult 
              ? 'flex flex-col md:flex-row items-start justify-center gap-8' 
              : ''
          }`}>
            <div className="w-full md:w-[calc(80%+2rem)]">
              <SourcesPanel
                ragSources={data.ragSources}
                webSearchSources={data.webSearchSources}
                ragQueried={data.ragQueried}
              />
            </div>
          </div>
        )}

        <div className=" mb-6 py-16 max-w-7xl mx-auto px-6 text-center">
              <p className="text-sm text-gray-400"> ⚠️ <b>AI can sometimes hallucinate.</b> Please verify recycling advice with trusted sources. </p>
        </div>


        {/* Map Section */}
        <div className="mt-20">
          <h2 className="text-4xl font-light text-gray-900 mb-8 text-center">Nearby Recycling Facilities</h2>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {data && data.facilities && data.facilities.length > 0 ? (
              <FacilityMap
                facilities={data.facilities}
                userLocation={data.locationUsed || location}
                onGeocodingComplete={complete}
              />
            ) : (
              <div className="h-96 bg-gradient-to-br from-green-50 to-blue-50 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-400">
                    {data ? 'No facilities found for this location' : 'Upload an item to find nearby facilities'}
                  </p>
                </div>
              </div>
            )}

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {data && data.facilities && data.facilities.length > 0 ? (
                data.facilities.map((facility, index) => (
                  <FacilityCard key={index} facility={facility} />
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  <p className="text-gray-400">
                    {data ? 'No facilities found for this location' : 'Upload an item to find nearby facilities'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Mockup */}
        <div className="mt-20 flex justify-center">
          <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
            <div className="bg-white rounded-[2.5rem] w-80 h-[42rem] overflow-hidden relative">
              {/* Mobile Status Bar */}
              <div className="h-8 bg-white flex items-center justify-center">
                <div className="w-24 h-6 bg-gray-900 rounded-full"></div>
              </div>

              {/* Mobile Content */}
              <div className="px-6 py-4 overflow-y-auto h-[calc(100%-8rem)]">
                <h2 className="text-2xl font-light mb-4">Quick Check</h2>
                
                <div className="space-y-4">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Your location"
                      className="w-full pl-10 pr-3 py-3 bg-gray-50 rounded-xl text-sm"
                    />
                  </div>

                  <textarea
                    placeholder="Add context..."
                    className="w-full px-3 py-3 bg-gray-50 rounded-xl text-sm resize-none"
                    rows={2}
                  />

                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50">
                    <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">Take a Photo</p>
                  </div>

                  <button className="w-full bg-green-500 text-white py-3 rounded-full text-sm font-medium">
                    Check Item
                  </button>

                  {/* Mobile Result */}
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-green-600 font-medium text-sm">Recyclable</p>
                    <p className="text-xs text-gray-600 mt-1">Place in plastics bin</p>
                  </div>
                </div>
              </div>

              {/* Mobile Bottom Nav */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-around">
                <button className="flex flex-col items-center">
                  <Scan className="w-6 h-6 text-green-500" />
                  <span className="text-xs mt-1 text-green-500">Scan</span>
                </button>
                <button className="flex flex-col items-center">
                  <Map className="w-6 h-6 text-gray-400" />
                  <span className="text-xs mt-1 text-gray-400">Map</span>
                </button>
                <button className="flex flex-col items-center">
                  <Info className="w-6 h-6 text-gray-400" />
                  <span className="text-xs mt-1 text-gray-400">Info</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

          {/* Footer */}
          <footer className="mt-32 py-12 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-sm text-gray-400">© 2025 RecycLens. Making recycling simple.</p>
            </div>
          </footer>
        </>
      ) : currentPage === 'chat' ? (
        <ChatPage
          initialContext={chatContext}
          onBack={() => setCurrentPage('home')}
        />
      ) : currentPage === 'how-it-works' ? (
        <HowItWorks onBackToHome={() => setCurrentPage('home')} />
      ) : (
        <FAQ onBackToHome={() => setCurrentPage('home')} />
      )}
    </div>
  );
};

export default RecycLens;