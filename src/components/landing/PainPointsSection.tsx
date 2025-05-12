
import { Search, UserX, ClipboardList, HelpCircle } from "lucide-react";

const PainPointsSection = () => {
  const painPoints = [
    {
      icon: <Search className="h-10 w-10 text-primary/70" />,
      title: "Applications Disappearing",
      description: "Feeling like your applications disappear into a black hole? You're not alone. The job market has shifted, and getting your resume seen by the right person is tougher than ever."
    },
    {
      icon: <UserX className="h-10 w-10 text-primary/70" />,
      title: "Awkward Networking",
      description: "Networking is key, but it can feel awkward, salesy, and you're never quite sure what to say or who to reach out to."
    },
    {
      icon: <ClipboardList className="h-10 w-10 text-primary/70" />,
      title: "Overwhelming Tracking",
      description: "Trying to keep track of who you've contacted, what you discussed, and when to follow up? It's overwhelming when you're reaching out to dozens of people."
    },
    {
      icon: <HelpCircle className="h-10 w-10 text-primary/70" />,
      title: "Self-Doubt",
      description: "That feeling of 'Am I even good enough to reach out?' or 'Why would they talk to me?' is real. It's a behavioral hurdle that stops many talented people."
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Sound Familiar?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The job search process is filled with challenges that can make even the most qualified candidates feel stuck.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {painPoints.map((point, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm flex gap-4">
              <div className="mt-1">{point.icon}</div>
              <div>
                <h3 className="font-bold text-xl mb-2">{point.title}</h3>
                <p className="text-gray-600">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
