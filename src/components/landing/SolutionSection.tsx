
import { UserCheck, Building, MessageSquare, Calendar } from "lucide-react";

const SolutionSection = () => {
  const solutions = [
    {
      icon: <UserCheck className="h-10 w-10 text-white" />,
      title: "Effortless Profile Building",
      description: "Start by simply sharing your background – paste your LinkedIn summary, CV text, or tell us your story. Our AI instantly creates a powerful profile that highlights your unique value."
    },
    {
      icon: <Building className="h-10 w-10 text-white" />,
      title: "Smart Lead Identification",
      description: "We help you find the right companies and the key people within them who are most relevant to your goals."
    },
    {
      icon: <MessageSquare className="h-10 w-10 text-white" />,
      title: "Authentic Message Crafting",
      description: "Never stare at a blank screen again. Our AI drafts personalized outreach messages that sound like you, clearly articulate your value, and increase your chances of getting a response."
    },
    {
      icon: <Calendar className="h-10 w-10 text-white" />,
      title: "Organized Tracking",
      description: "Keep all your networking activity in one place. Easily log interactions, set reminders, and see your progress at a glance, so you never miss an opportunity."
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How ConnectorAI Helps</h2>
          <p className="text-xl text-[hsl(var(--normaltext))] max-w-3xl mx-auto">
            What if you had an AI copilot to guide you? ConnectorAI is designed to cut through the complexity and discomfort of job search networking.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => (
            <div key={index} className="rounded-lg overflow-hidden group">
              <div className="bg-primary p-6 flex items-center gap-4 group-hover:bg-primary/90 transition-colors">
                {solution.icon}
                <h3 className="font-bold text-xl text-white">{solution.title}</h3>
              </div>
              <div className="bg-white p-6 shadow-sm border border-t-0">
                <p className="text-[hsl(var(--normaltext))]">{solution.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
