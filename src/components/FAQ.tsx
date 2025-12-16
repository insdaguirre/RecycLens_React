import { ChevronDown, ChevronUp, Recycle, Trash2, MapPin, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import FAQBasicsSection from './FAQBasicsSection';

interface FAQProps {
  onBackToHome: () => void;
}

interface FAQItem {
  icon: React.ElementType;
  question: string;
  answer: string;
}

export default function FAQ({ onBackToHome }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      icon: AlertTriangle,
      question: 'Why does contamination matter?',
      answer:
        'When non-recyclable or dirty items enter the recycling stream, entire loads may be rejected and sent to landfill. Even small amounts of contamination can reduce recycling efficiency.',
    },
    {
      icon: MapPin,
      question: 'Do recycling rules change by location?',
      answer:
        'Yes. Recycling rules vary by county and city depending on local facilities. That’s why RecycLens uses your location to provide guidance tailored to your area.',
    },
    {
      icon: Recycle,
      question: 'What if I am not sure what material an item is?',
      answer:
        'You can upload a photo using RecycLens. Our system analyzes the item and provides guidance on whether it can be recycled and how to dispose of it properly. You can also contact one of the local recycling centers displayed in the map section.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-6xl font-light text-gray-900 mb-4 text-center">
          Common <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">Recycling</span> Questions
        </h1>
        <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto mb-16">
          Learn about the general rules of what and what not to recycle.
        </p>
        <div className="space-y-4 mb-20">
          {faqs.map((faq, index) => {
            const Icon = faq.icon;
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-light text-gray-900">
                      {faq.question}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pl-[4.5rem] text-gray-600 text-lg">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <FAQBasicsSection/>


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
