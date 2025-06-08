
import { Search, UserX, ClipboardList, HelpCircle, AlertTriangle, Target, Clock, Users } from "lucide-react";

const PainPointsSection = () => {
  const painPoints = [
    {
      icon: <Search className="h-8 w-8 text-red-500" />,
      title: "Applications Disappearing",
      description: "Feeling like your applications disappear into a black hole? You're not alone. The job market has shifted, and getting your resume seen by the right person is tougher than ever.",
      gradient: "from-red-50 to-pink-50",
      borderColor: "border-red-200"
    },
    {
      icon: <UserX className="h-8 w-8 text-orange-500" />,
      title: "Awkward Networking",
      description: "Networking is key, but it can feel awkward, salesy, and you're never quite sure what to say or who to reach out to.",
      gradient: "from-orange-50 to-amber-50",
      borderColor: "border-orange-200"
    },
    {
      icon: <ClipboardList className="h-8 w-8 text-blue-500" />,
      title: "Overwhelming Tracking",
      description: "Trying to keep track of who you've contacted, what you discussed, and when to follow up? It's overwhelming when you're reaching out to dozens of people.",
      gradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200"
    },
    {
      icon: <HelpCircle className="h-8 w-8 text-purple-500" />,
      title: "Self-Doubt",
      description: "That feeling of 'Am I even good enough to reach out?' or 'Why would they talk to me?' is real. It's a behavioral hurdle that stops many talented people.",
      gradient: "from-purple-50 to-violet-50",
      borderColor: "border-purple-200"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-slate-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
            Sounds Familiar?
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            The job search process is filled with challenges that can make even the most qualified candidates feel stuck.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {painPoints.map((point, index) => (
            <div 
              key={index} 
              className={`group bg-gradient-to-br ${point.gradient} ${point.borderColor} border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105`}
            >
              <div className="p-8">
                <div className="flex items-start gap-6">
                  <div className="bg-white p-4 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {point.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl mb-4 text-gray-800 group-hover:text-gray-900 transition-colors">
                      {point.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {point.description}
                    </p>
                  </div>
                </div>
              </div>
              {/* Subtle bottom accent */}
              <div className={`h-1 bg-gradient-to-r ${point.gradient.replace('50', '200')}`}></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-200">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="text-gray-600 font-medium">Sound like your current job search experience?</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
