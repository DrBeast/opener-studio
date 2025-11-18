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

export function LandingMobile() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Insert into waitlist (ignore duplicate email errors)
      // waitlist table exists but isn't in generated types
      const { error: waitlistError } = await (
        supabase as unknown as {
          from: (table: string) => {
            insert: (data: { email: string }) => Promise<{
              error: { message?: string; code?: string } | null;
            }>;
          };
        }
      )
        .from("waitlist")
        .insert({ email });

      // If error is due to duplicate email (unique constraint violation), continue anyway
      // Postgres error code 23505 = unique_violation
      if (waitlistError) {
        const isDuplicateEmail =
          waitlistError.code === "23505" ||
          waitlistError.message?.includes("duplicate key value") ||
          waitlistError.message?.includes("waitlist_email_key");

        if (!isDuplicateEmail) {
          // Only show error if it's not a duplicate email
          toast.error(
            waitlistError.message || "An error occurred. Please try again."
          );
          setIsLoading(false);
          return;
        }
        // If it's a duplicate, silently continue (email already on waitlist)
      }

      // Step 2: Send email via edge function
      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("mobile_bridge", {
          body: {
            email: email,
          },
        });

      if (emailError) {
        console.error("Email sending error:", emailError);
        toast.error("Failed to send email. Please try again.");
        setIsLoading(false);
        return;
      }

      if (emailData && emailData.error) {
        toast.error(
          emailData.error || "Failed to send email. Please try again."
        );
        setIsLoading(false);
        return;
      }

      toast.success("Check your email for your desktop link.");
      setIsSubmitted(true);
    } catch (error) {
      console.error("Unexpected error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-gray-100 min-h-screen">
      {/* Hero Section */}
      <section className="py-2 sm:py-12 md:py-20 bg-gradient-to-br from-[hsl(var(--primary-muted))] via-[hsl(var(--background))] to-[hsl(var(--accent))] relative overflow-hidden">
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

        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 relative z-10">
          {/* Hero Content */}
          <div className="text-center space-y-2 sm:space-y-8 md:space-y-12 max-w-5xl mx-auto pt-16 sm:pt-8 md:pt-12">
            {/* Headline */}
            <div className="space-y-2 sm:space-y-4 md:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold text-[hsl(var(--foreground))] leading-tight px-2">
                Turn a Blank Box into a{" "}
                <span className="text-[hsl(var(--primary))]">
                  Brilliant Opener
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-sans text-[hsl(var(--secondary-foreground))] leading-relaxed max-w-4xl mx-auto px-2">
                Opener Studio is your AI-powered workspace for crafting
                personalized, professional outreach that gets replies.
              </p>
            </div>

            {/* Visual Element - Enhanced Video Container */}
            {/* TODO: Add GIF/video here when ready */}

            {/* Call to Action - Waitlist Form */}
            <div className="pt-8 sm:pt-6 md:pt-8 pb-16 sm:pb-8 md:pb-12 flex justify-center px-2">
              {isSubmitted ? (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl px-6 sm:px-8 md:px-12 py-6 sm:py-8 border-2 border-green-200 w-full max-w-md">
                  <p className="text-base sm:text-lg md:text-xl text-green-600 font-semibold">
                    Check your email for your desktop link.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-2.5 sm:gap-4 bg-white rounded-xl sm:rounded-2xl shadow-2xl px-5 sm:px-6 md:px-8 py-4 sm:py-6 border-2 border-primary/20 max-w-md w-full"
                >
                  <p className="text-sm sm:text-base text-gray-700 text-center leading-relaxed mb-0.5">
                    <strong>
                      Opener Studio is a desktop-first experience.
                    </strong>
                    <br />
                    Save this for later: enter your email and we'll instantly
                    send you a link for your computer.
                  </p>
                  <div className="flex flex-col gap-2.5 sm:gap-4">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full text-base sm:text-lg py-4 sm:py-5 md:py-6"
                      aria-label="Email address"
                    />
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      {isLoading ? "Submitting..." : "Desktop Link"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-8 sm:py-16 md:py-20 bg-gradient-to-b from-gray-100 to-gray-200 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Headline */}
          <div className="text-center mb-6 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 sm:mb-5 md:mb-6 text-gray-900 px-2">
              The Awkward Silence of a Blank Message Box
            </h2>
          </div>

          {/* Pain Point Cards Grid */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Card 1: Awkward Networking */}
            <div className="group bg-white border border-red-200 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-rose-50/50 rounded-xl sm:rounded-2xl"></div>
              <div className="relative p-5 sm:p-6 md:p-8">
                <div className="flex items-start gap-4 sm:gap-5 md:gap-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-red-100 shrink-0">
                    <UserX className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 md:mb-4 text-gray-800 group-hover:text-gray-900 transition-colors">
                      Awkward Networking
                    </h3>
                    <p className="font-sans text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
                      Networking is key, but it can feel awkward, salesy, and
                      you're never quite sure what to say.
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-300 to-rose-300 rounded-b-xl sm:rounded-b-2xl"></div>
            </div>

            {/* Card 2: Fear of Sounding Generic */}
            <div className="group bg-white border border-orange-200 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-50/50 rounded-xl sm:rounded-2xl"></div>
              <div className="relative p-5 sm:p-6 md:p-8">
                <div className="flex items-start gap-4 sm:gap-5 md:gap-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-orange-100 shrink-0">
                    <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 md:mb-4 text-gray-800 group-hover:text-gray-900 transition-colors">
                      Fear of Sounding Generic
                    </h3>
                    <p className="font-sans text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
                      You know a template won't work, but personalizing every
                      message is exhausting. How do you stand out without
                      sounding like a robot?
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-300 to-amber-300 rounded-b-xl sm:rounded-b-2xl"></div>
            </div>

            {/* Card 3: The Time Sink */}
            <div className="group bg-white border border-blue-200 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-sky-50/50 rounded-xl sm:rounded-2xl"></div>
              <div className="relative p-5 sm:p-6 md:p-8">
                <div className="flex items-start gap-4 sm:gap-5 md:gap-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-blue-100 shrink-0">
                    <Clock className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 md:mb-4 text-gray-800 group-hover:text-gray-900 transition-colors">
                      The Time Sink
                    </h3>
                    <p className="font-sans text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
                      Spending 20 minutes crafting a single, perfect message
                      that might never get a reply. There has to be a better
                      way.
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 to-sky-300 rounded-b-xl sm:rounded-b-2xl"></div>
            </div>

            {/* Card 4: Self-Doubt */}
            <div className="group bg-white border border-purple-200 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-violet-50/50 rounded-xl sm:rounded-2xl"></div>
              <div className="relative p-5 sm:p-6 md:p-8">
                <div className="flex items-start gap-4 sm:gap-5 md:gap-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-purple-100 shrink-0">
                    <HelpCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 md:mb-4 text-gray-800 group-hover:text-gray-900 transition-colors">
                      Self-Doubt
                    </h3>
                    <p className="font-sans text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
                      'Am I even good enough to reach out?' We know you are. We
                      know the feeling. It's a common behavioral hurdle that
                      stopped many talented people. Not anymore.
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-300 to-violet-300 rounded-b-xl sm:rounded-b-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="py-8 sm:py-16 md:py-20 bg-white relative"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Headline */}
          <div className="text-center mb-6 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 sm:mb-5 md:mb-6 text-gray-900 px-2">
              Your Personal Message Crafting Studio
            </h2>
          </div>

          {/* 3-Step Guide */}
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Step 1: Introduce Yourself */}
            <div className="group relative">
              {/* Step Number Badge */}
              <div className="absolute -top-2 sm:-top-3 md:-top-4 -left-2 sm:-left-3 md:-left-4 bg-primary text-primary-foreground w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold z-20 shadow-lg">
                1
              </div>
              {/* Card Container */}
              <div className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 group-hover:shadow-lg transition-all duration-300 relative shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-indigo-100/60 rounded-xl sm:rounded-2xl"></div>
                <div className="relative flex items-start gap-3 sm:gap-4">
                  {/* Icon Container */}
                  <div className="bg-white border border-blue-200 rounded-lg sm:rounded-xl p-2 sm:p-3 shrink-0">
                    <User className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-600" />
                  </div>
                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-gray-900">
                      Introduce Yourself
                    </h3>
                    <p className="font-sans text-gray-600 leading-relaxed text-sm sm:text-base">
                      Paste your bio or LinkedIn profile.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Provide Context */}
            <div className="group relative">
              {/* Step Number Badge */}
              <div className="absolute -top-2 sm:-top-3 md:-top-4 -left-2 sm:-left-3 md:-left-4 bg-primary text-primary-foreground w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold z-20 shadow-lg">
                2
              </div>
              {/* Card Container */}
              <div className="bg-white border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 group-hover:shadow-lg transition-all duration-300 relative shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 to-emerald-100/60 rounded-xl sm:rounded-2xl"></div>
                <div className="relative flex items-start gap-3 sm:gap-4">
                  {/* Icon Container */}
                  <div className="bg-white border border-green-200 rounded-lg sm:rounded-xl p-2 sm:p-3 shrink-0">
                    <Target className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-green-600" />
                  </div>
                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-gray-900">
                      Provide Context
                    </h3>
                    <p className="font-sans text-gray-600 leading-relaxed text-sm sm:text-base">
                      Paste the bio of your contact and choose your outreach
                      objective.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Open Up */}
            <div className="group relative">
              {/* Step Number Badge */}
              <div className="absolute -top-2 sm:-top-3 md:-top-4 -left-2 sm:-left-3 md:-left-4 bg-primary text-primary-foreground w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold z-20 shadow-lg">
                3
              </div>
              {/* Card Container */}
              <div className="bg-white border border-purple-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 group-hover:shadow-lg transition-all duration-300 relative shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/60 to-violet-100/60 rounded-xl sm:rounded-2xl"></div>
                <div className="relative flex items-start gap-3 sm:gap-4">
                  {/* Icon Container */}
                  <div className="bg-white border border-purple-200 rounded-lg sm:rounded-xl p-2 sm:p-3 shrink-0">
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-purple-600" />
                  </div>
                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base sm:text-lg md:text-xl mb-1 sm:mb-2 text-gray-900">
                      Open Up
                    </h3>
                    <p className="font-sans text-gray-600 leading-relaxed text-sm sm:text-base">
                      Instantly get three personalized professionally crafted
                      messages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
