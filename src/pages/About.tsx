import React from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { Sparkles, Linkedin, Target } from "lucide-react";
import { PrimaryAction } from "@/components/ui/design-system";
import { useModal } from "@/contexts/ModalContext";

// [TODO: User]
// 1. Find a good, professional photo of yourself and add it to /public/images/
// 2. Uncomment the <img> component below (around line 70) and update the `src` path.

const About = () => {
  const { openModal } = useModal();

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen">
        {/* Main Content Area */}
        <div className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 1. The Mission (The "Why") */}
          <section className="mb-16">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-2 border-primary/20 rounded-2xl p-8 md:p-12 shadow-lg relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-4">
                      Our Mission
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                      Our mission is to help talented, ambitious professionals
                      make the meaningful connections that shape their careers.
                      We're replacing the anxiety of the "blank box" with the
                      confidence of the perfect opener.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. The Story (The "Problem") */}
          <section className="mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">
              The Story Behind the Studio
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 md:p-10 shadow-sm">
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-4">
                <p>
                  Opener Studio was born from a simple, painful, personal
                  observation. I've seen countless brilliant people fail to get
                  their foot in the door. Not because they lacked talent, but
                  because they struggled to even have a human being see their
                  profile.
                </p>
                <p>
                  Networking has become a game of templates and robotic,
                  "excited-about-your-work" messages. We all hate receiving
                  them, yet we feel pressured to send them. The rise of
                  generative AI made this problem even worse, churning out more
                  generic, low-effort spam than ever.
                </p>
                <p>
                  We decided to build something different. Not an "auto-mailer,"
                  but a creative partner. A tool that acts like a sparring
                  coach, helping you find the right words to build a real,
                  meaningful, and professional connection.
                </p>
              </div>
            </div>
          </section>

          {/* 3. The Founder */}
          <section className="mb-16">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">
              About the Founder
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 md:p-10 shadow-sm">
              <div className="flex flex-col md:flex-row items-start gap-8">
                {/* [TODO: User] Uncomment this block and add your photo
                <div className="w-48 h-48 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-lg">
                  <img
                    src="/images/your-profile-photo.jpg" 
                    alt="Aleksandr Rakitin"
                    className="object-cover w-full h-full"
                  />
                </div> 
                */}
                <div className="flex-1">
                  <div className="space-y-4 text-gray-700 leading-relaxed">
                    <p className="text-lg">
                      I'm a product leader with a decade of experience building
                      technology that empowers people to make the most of their
                      energy. My career started as a rocket scientist, which
                      gave me a deep appreciation for critical thinking, and my
                      MBA taught me how to apply that thinking to real-world
                      problems.
                    </p>
                    <p className="text-lg">
                      I'm building Opener Studio because I believe the right
                      tools can unlock human potential through networking and
                      high-quality connections. I'm passionate about helping
                      people move from "Let's connect" to "Here's why we should
                      talk."
                    </p>
                  </div>
                  <a
                    href="https://www.linkedin.com/in/aleksandrrakitin/?lipi=urn%3Ali%3Apage%3Ad_flagship3_feed%3BIqjXSwyNRqG%2B5quFywxEzg%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-6 text-lg font-semibold text-primary hover:text-primary-hover transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                    Connect on LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Final CTA */}
          <section className="mt-20">
            <div className="text-center p-10 md:p-12 bg-gradient-to-br from-[hsl(var(--primary-muted))] to-[hsl(var(--accent))] rounded-2xl shadow-lg">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                Ready to craft your opener?
              </h2>
              <p className="text-xl text-gray-700 mt-4 mb-8 max-w-2xl mx-auto">
                Go from a blank page to a brilliant message in seconds. Join the
                free beta and see for yourself.
              </p>
              <PrimaryAction onClick={openModal} size="lg" className="text-lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Open the Studio
              </PrimaryAction>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default About;
