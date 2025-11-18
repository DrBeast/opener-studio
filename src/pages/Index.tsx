import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PrimaryAction } from "@/components/ui/design-system";
import {
  UserX,
  MessageSquare,
  Clock,
  HelpCircle,
  FileText,
  Target,
  Sparkles,
  User,
} from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { useModal } from "@/contexts/ModalContext";
import { useIsMobile } from "@/hooks/useIsMobile";

const Index = () => {
  const { openModal } = useModal();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    if (isMobile) {
      navigate("/landing-mobile", { replace: true });
    }
  }, [isMobile, navigate]);

  return (
    <PublicLayout>
      <div className="flex flex-1 flex-col bg-gray-100 min-h-screen">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-[hsl(var(--primary-muted))] via-[hsl(var(--background))] to-[hsl(var(--accent))] relative overflow-hidden min-h-screen flex items-center">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-[hsl(var(--primary))] opacity-10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[hsl(var(--primary-hover))] opacity-10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[hsl(var(--primary-muted))] opacity-20 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>

          <div className="max-w-6xl mx-auto w-full px-4 relative z-10">
            {/* Hero Content */}
            <div className="text-center space-y-12 max-w-5xl mx-auto">
              {/* Headline */}
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-display font-bold text-[hsl(var(--foreground))] leading-tight">
                  Turn a Blank Box into a{" "}
                  <span className="text-[hsl(var(--primary))]">
                    Brilliant Opener
                  </span>
                </h1>

                {/* Sub-headline */}
                <p className="text-xl md:text-2xl font-sans text-[hsl(var(--secondary-foreground))] leading-relaxed max-w-4xl mx-auto">
                  Opener Studio is your AI-powered workspace for crafting
                  personalized, professional outreach that gets replies.
                </p>
              </div>

              {/* Visual Element - Enhanced Video Container */}
              {/* TODO: Add GIF/video here when ready */}

              {/* Call to Action */}
              <div className="pt-8 flex justify-center">
                <PrimaryAction
                  onClick={openModal}
                  size="lg"
                  className="text-xl font-semibold px-16 py-6 shadow-2xl hover:shadow-3xl transform transition-all duration-200 hover:scale-105 h-24"
                >
                  <Sparkles className="mr-3 h-6 w-6" />
                  Open the Studio
                </PrimaryAction>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-gradient-to-b from-gray-100 to-gray-200 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>

          <div className="max-w-6xl mx-auto px-4 relative z-10">
            {/* Section Headline */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-gray-900">
                The Awkward Silence of a Blank Message Box
              </h2>
            </div>

            {/* Pain Point Cards Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Card 1: Awkward Networking */}
              <div className="group bg-white border border-red-200 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-rose-50/50 rounded-2xl"></div>
                <div className="relative p-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-red-100">
                      <UserX className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-2xl mb-4 text-gray-800 group-hover:text-gray-900 transition-colors">
                        Awkward Networking
                      </h3>
                      <p className="font-sans text-gray-700 leading-relaxed text-lg">
                        Networking is key, but it can feel awkward, salesy, and
                        you're never quite sure what to say.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-300 to-rose-300 rounded-b-2xl"></div>
              </div>

              {/* Card 2: Fear of Sounding Generic */}
              <div className="group bg-white border border-orange-200 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-50/50 rounded-2xl"></div>
                <div className="relative p-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-orange-100">
                      <MessageSquare className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-2xl mb-4 text-gray-800 group-hover:text-gray-900 transition-colors">
                        Fear of Sounding Generic
                      </h3>
                      <p className="font-sans text-gray-700 leading-relaxed text-lg">
                        You know a template won't work, but personalizing every
                        message is exhausting. How do you stand out without
                        sounding like a robot?
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-300 to-amber-300 rounded-b-2xl"></div>
              </div>

              {/* Card 3: The Time Sink */}
              <div className="group bg-white border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-sky-50/50 rounded-2xl"></div>
                <div className="relative p-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-blue-100">
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-2xl mb-4 text-gray-800 group-hover:text-gray-900 transition-colors">
                        The Time Sink
                      </h3>
                      <p className="font-sans text-gray-700 leading-relaxed text-lg">
                        Spending 20 minutes crafting a single, perfect message
                        that might never get a reply. There has to be a better
                        way.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 to-sky-300 rounded-b-2xl"></div>
              </div>

              {/* Card 4: Self-Doubt */}
              <div className="group bg-white border border-purple-200 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-violet-50/50 rounded-2xl"></div>
                <div className="relative p-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-purple-100">
                      <HelpCircle className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-2xl mb-4 text-gray-800 group-hover:text-gray-900 transition-colors">
                        Self-Doubt
                      </h3>
                      <p className="font-sans text-gray-700 leading-relaxed text-lg">
                        'Am I even good enough to reach out?' We know you are.
                        We know the feeling. It's a common behavioral hurdle
                        that stopped many talented people. Not anymore.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-300 to-violet-300 rounded-b-2xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-white relative">
          <div className="max-w-6xl mx-auto px-4">
            {/* Section Headline */}
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-gray-900">
                Your Personal Message Crafting Studio
              </h2>
            </div>

            {/* 3-Step Guide */}
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {/* Step 1: Provide Context */}
              <div className="text-center group">
                <div className="relative mb-8">
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -left-4 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-20 shadow-lg">
                    1
                  </div>
                  {/* Icon Container */}
                  <div className="bg-white border border-blue-200 rounded-2xl p-8 group-hover:shadow-lg transition-all duration-300 relative shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-indigo-100/60 rounded-2xl"></div>
                    <div className="relative">
                      <User className="h-12 w-12 text-blue-600 mx-auto" />
                    </div>
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl mb-4 text-gray-900">
                  Introduce Yourself
                </h3>
                <p className="font-sans text-gray-600 leading-relaxed">
                  Paste your bio or LinkedIn profile.
                </p>
              </div>

              {/* Step 2: Define Your Goal */}
              <div className="text-center group">
                <div className="relative mb-8">
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -left-4 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-20 shadow-lg">
                    2
                  </div>
                  {/* Icon Container */}
                  <div className="bg-white border border-green-200 rounded-2xl p-8 group-hover:shadow-lg transition-all duration-300 relative shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 to-emerald-100/60 rounded-2xl"></div>
                    <div className="relative">
                      <Target className="h-12 w-12 text-green-600 mx-auto" />
                    </div>
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl mb-4 text-gray-900">
                  Provide Context
                </h3>
                <p className="font-sans text-gray-600 leading-relaxed">
                  Paste the bio of your contact and choose your outreach
                  objective.
                </p>
              </div>

              {/* Step 3: Open Up */}
              <div className="text-center group">
                <div className="relative mb-8">
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -left-4 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-20 shadow-lg">
                    3
                  </div>
                  {/* Icon Container */}
                  <div className="bg-white border border-purple-200 rounded-2xl p-8 group-hover:shadow-lg transition-all duration-300 relative shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/60 to-violet-100/60 rounded-2xl"></div>
                    <div className="relative">
                      <Sparkles className="h-12 w-12 text-purple-600 mx-auto" />
                    </div>
                  </div>
                </div>
                <h3 className="font-display font-bold text-xl mb-4 text-gray-900">
                  Open Up
                </h3>
                <p className="font-sans text-gray-600 leading-relaxed">
                  Instantly get three personalized professionally crafted
                  messages.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-indigo-600/20"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            {/* Final CTA Headline */}
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 leading-tight">
              Ready to Write the Perfect Opener?
            </h2>

            {/* Final CTA Button */}
            <div className="pt-4 flex justify-center">
              <PrimaryAction
                onClick={openModal}
                size="lg"
                className="text-xl font-semibold px-16 py-6 bg-white text-gray-900 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transform transition-all duration-200 hover:scale-105 border-0"
              >
                <Sparkles className="mr-3 h-6 w-6" />
                Open the Studio
              </PrimaryAction>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default Index;
