import React, { useState } from "react";
import {
  UserX,
  MessageSquare,
  Clock,
  HelpCircle,
  Target,
  Sparkles,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/airtable-ds/input";
import { Button } from "@/components/ui/airtable-ds/button";
import { toast } from "sonner";

export function ComingSoon() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsLoading(true);

    // @ts-expect-error - waitlist table exists but isn't in generated types
    const { error } = await supabase.from("waitlist").insert({ email });

    if (error) {
      toast.error(
        error.message ||
          "An error occurred. Perhaps you have already signed up?"
      );
    } else {
      toast.success("Thank you for signing up!");
      setIsSubmitted(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen">
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

            {/* Call to Action - Waitlist Form */}
            <div className="pt-8 flex justify-center">
              {isSubmitted ? (
                <div className="bg-white rounded-2xl shadow-2xl px-12 py-8 border-2 border-green-200">
                  <p className="text-xl text-green-600 font-semibold">
                    You're on the list! We'll be in touch soon.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-4 items-center bg-white rounded-2xl shadow-2xl px-8 py-6 border-2 border-primary/20"
                >
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-grow min-w-[300px] text-lg py-6"
                    aria-label="Email address"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="sm:w-auto px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    {isLoading ? "Submitting..." : "Join Waitlist"}
                  </Button>
                </form>
              )}
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
                      'Am I even good enough to reach out?' We know you are. We
                      know the feeling. It's a common behavioral hurdle that
                      stopped many talented people. Not anymore.
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
    </div>
  );
}
