
import { UserCheck, Building, MessageSquare, Calendar, Sparkles, Target, Zap, CheckCircle } from "lucide-react";

const SolutionSection = () => {
  const solutions = [
    {
      icon: <UserCheck className="h-8 w-8 text-white" />,
      title: "Effortless Profile Building",
      description: "Start by simply sharing your background – paste your LinkedIn summary, CV text, or tell us your story. Our AI instantly creates a powerful profile that highlights your unique value.",
      gradient: "from-emerald-600 to-teal-600",
      accentColor: "bg-emerald-500"
    },
    {
      icon: <Building className="h-8 w-8 text-white" />,
      title: "Smart Lead Identification",
      description: "We help you find the right companies and the key people within them who are most relevant to your goals.",
      gradient: "from-violet-600 to-purple-600",
      accentColor: "bg-violet-500"
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-white" />,
      title: "Authentic Message Crafting",
      description: "Never stare at a blank screen again. Our AI drafts personalized outreach messages that sound like you, clearly articulate your value, and increase your chances of getting a response.",
      gradient: "from-rose-600 to-pink-600",
      accentColor: "bg-rose-500"
    },
    {
      icon: <Calendar className="h-8 w-8 text-white" />,
      title: "Organized Tracking",
      description: "Keep all your networking activity in one place. Easily log interactions, set reminders, and see your progress at a glance, so you never miss an opportunity.",
      gradient: "from-blue-600 to-indigo-600",
      accentColor: "bg-blue-500"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-neutral-100 to-stone-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-violet-200/30 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-full shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-800">
            How ConnectorAI Helps
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            What if you had an AI copilot to guide you? ConnectorAI is designed to cut through the complexity and discomfort of job search networking.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {solutions.map((solution, index) => (
            <div key={index} className="group bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 border border-slate-100">
              {/* Header with gradient and icon */}
              <div className={`bg-gradient-to-r ${solution.gradient} p-8 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 flex items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    {solution.icon}
                  </div>
                  <h3 className="font-bold text-2xl text-white">
                    {solution.title}
                  </h3>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full"></div>
              </div>
              
              {/* Content */}
              <div className="p-8 bg-gradient-to-br from-slate-50 to-white">
                <p className="text-slate-700 leading-relaxed text-lg mb-6">
                  {solution.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Powered by AI</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom section with call to action */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-full">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              Ready to Transform Your Networking?
            </h3>
            <p className="text-slate-600">
              Join professionals who are landing interviews faster with AI-powered networking
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
