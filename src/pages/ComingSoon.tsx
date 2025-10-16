import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/airtable-ds/button";
import { Input } from "@/components/ui/airtable-ds/input";
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary-muted to-background text-foreground p-4">
      <div className="text-center max-w-md w-full">
        <img
          src="/opener-studio-logo.png"
          alt="Opener Studio"
          className="h-40 w-auto mx-auto mb-8"
        />
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Craft the perfect outreach message, every time.
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          Enter your email below to get notified when we launch.
        </p>
        {isSubmitted ? (
          <p className="mt-8 text-xl text-green-500 font-semibold">
            You're on the list! We'll be in touch soon.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-grow"
              aria-label="Email address"
            />
            <Button type="submit" disabled={isLoading} className="sm:w-auto">
              {isLoading ? "Submitting..." : "Join Waitlist"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
