
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div>
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Networking Made <span className="text-primary">Effortless</span>
              </h1>
              <p className="text-xl text-gray-600">
                EngageAI helps you connect with the right people and opportunities
                by making professional networking less intimidating and more effective.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Button size="lg" asChild>
                    <Link to="/profile">Go to Profile</Link>
                  </Button>
                ) : (
                  <Button size="lg" asChild>
                    <Link to="/auth/signup">Get Started</Link>
                  </Button>
                )}
                <Button size="lg" variant="outline" asChild>
                  <Link to="#features">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/30 p-2">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-white shadow-xl">
                  <img
                    src="https://placehold.co/800x600/9b87f5/white?text=EngageAI+Dashboard"
                    alt="EngageAI Dashboard"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose EngageAI?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform makes networking less stressful and more productive
              with AI-powered features designed for job seekers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">Smart Contact Suggestions</h3>
              <p className="text-gray-600">
                Our AI helps you identify the right people to connect with based
                on your career goals and target companies.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M12 19l-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">Personalized Outreach</h3>
              <p className="text-gray-600">
                Generate tailored messages that feel authentic and highlight your
                unique value proposition for each contact.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">Simplified Follow-ups</h3>
              <p className="text-gray-600">
                Track your interactions and get timely reminders for follow-ups,
                ensuring no opportunity slips through the cracks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m16 12-4-4-4 4" />
                  <path d="M12 16V8" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">Target Company Analysis</h3>
              <p className="text-gray-600">
                Identify and prioritize companies that match your criteria and
                provide the best opportunities for your career goals.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">Progress Tracking</h3>
              <p className="text-gray-600">
                Visualize your networking progress and understand which strategies
                are yielding the best results.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">Overcome Networking Anxiety</h3>
              <p className="text-gray-600">
                Our guided approach reduces the intimidation factor of reaching out
                and helps you build networking confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Job Search?</h2>
            <p className="text-xl text-gray-600">
              Join thousands of professionals who are landing interviews and offers
              faster by networking more effectively with EngageAI.
            </p>
          </div>

          <div className="flex justify-center">
            {user ? (
              <Button size="lg" asChild>
                <Link to="/profile">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link to="/auth/signup">Get Started Now</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
