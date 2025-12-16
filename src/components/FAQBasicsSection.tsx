import { Recycle, XCircle, AlertOctagon } from 'lucide-react';

export default function FAQBasicsSection() {
  const usuallyRecyclable = [
    'Cardboard',
    'Paper',
    'Food boxes (clean)',
    'Mail',
    'Beverage cans',
    'Food cans',
    'Glass bottles',
    'Glass and plastic jars',
    'Jugs',
    'Plastic bottles and caps',
  ];

  const neverRecyclable = [
    'Plastic bags and wraps',
    'Food-contaminated items',
    'Bagged recyclables',
    'Electronics',
    'Polystyrene Foam',
    'Dirty diapers',
    'Textiles and clothing',
  ];

  const hazardousItems = [
    'Batteries',
    'Barometers and mercury-containing items',
    'Medical waste and sharps',
    'Chemicals and solvents',
    'Pressurized containers',
  ];

  return (
    <section className="mb-24">
      {/* Title */}
      <h2 className="text-4xl font-light text-gray-900 text-center mb-4">
        What <b>Usually</b> Can and Can’t Go in the Recycling Bin
      </h2>
      <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-12  [&_a]:text-blue-600
    [&_a]:underline
    [&_a]:underline-offset-4
    [&_a]:hover:text-blue-700" >
        These are general guidelines based on common U.S. recycling programs and information from <a href="https://www.epa.gov/recycle/frequent-questions-recycling">EPA guidelines</a> and <a href="https://www.wm.com/us/en/recycle-right/recycling-101">Waste Management</a>.
        Always confirm with your local recycling provider, as accepted materials
        vary by location.
      </p>

      {/* Split Screen */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Usually Recyclable */}
        <div className="bg-white border border-green-100 rounded-3xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <Recycle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-light text-green-700">
              Usually Recyclable
            </h3>
          </div>

          <ul className="space-y-3">
            {usuallyRecyclable.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Never Recyclable */}
        <div className="bg-white border border-red-100 rounded-3xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-light text-red-700">
              Not Accepted in Curbside Recycling
            </h3>
          </div>

          <ul className="space-y-3">
            {neverRecyclable.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Hazardous Items */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
            <AlertOctagon className="w-6 h-6 text-yellow-700" />
          </div>
          <h3 className="text-2xl font-light text-yellow-800">
            Never Put These in Trash or Recycling
          </h3>
        </div>

        <p className="text-gray-700 mb-4 max-w-3xl">
          These items require special handling and disposal due to environmental
          or health risks. Contact your local hazardous waste facility for proper
          disposal instructions.
        </p>

        <ul className="grid md:grid-cols-2 gap-3">
          {hazardousItems.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 text-gray-700"
            >
              <span className="w-2 h-2 bg-yellow-600 rounded-full" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
