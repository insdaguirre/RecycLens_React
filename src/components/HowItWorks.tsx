import React from 'react';
import { Camera, MapPin, FileText, Sparkles, Map } from 'lucide-react';

interface HowItWorksProps {
  onBackToHome: () => void;
}

export default function HowItWorks({ onBackToHome }: HowItWorksProps) {
  const steps = [
    {
      icon: Camera,
      title: 'Upload Your Item Photo',
      description: 'Take or upload a clear photo of the item you want to recycle or dispose of.',
    },
    {
      icon: MapPin,
      title: 'Enter Your Location',
      description: 'Provide your city, state, or ZIP code so we can find nearby facilities.',
    },
    {
      icon: FileText,
      title: 'Add Context (Optional)',
      description: 'Describe any special conditions, like if the item is greasy, broken, or contaminated.',
    },
    {
      icon: Sparkles,
      title: 'Get Instant Analysis',
      description: 'Our AI analyzes the material, determines recyclability, and provides disposal instructions.',
    },
    {
      icon: Map,
      title: 'Find Nearby Facilities',
      description: 'View recycling centers and disposal facilities on an interactive map with directions.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-6xl font-light text-gray-900 mb-4 text-center">
          How <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">RecycLens</span> Works
        </h1>
        <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto mb-16">
          Get instant, AI-powered recycling guidance in just a few simple steps.
        </p>

        {/* Steps */}
        <div className="space-y-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex items-start gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      Step {index + 1}
                    </span>
                    <h3 className="text-2xl font-light text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 text-lg">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-12">
          <h2 className="text-3xl font-light text-gray-900 mb-6 text-center">
            Why Use RecycLens?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-light text-green-600 mb-2">⚡</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Instant Results</h3>
              <p className="text-gray-600">
                Get recycling guidance in seconds, not hours of research.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-green-600 mb-2">🎯</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Accurate Guidance</h3>
              <p className="text-gray-600">
                AI-powered analysis ensures you dispose of items correctly.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-green-600 mb-2">📍</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Local Facilities</h3>
              <p className="text-gray-600">
                Find nearby recycling centers and disposal locations instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <button
            onClick={onBackToHome}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl text-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            Try RecycLens Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-600">
          <p>© 2025 RecycLens. Making recycling simple and accessible.</p>
        </div>
      </footer>
    </div>
  );
}

