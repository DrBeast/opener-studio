import React from "react";
import PublicLayout from "@/components/layout/PublicLayout";

const Privacy = () => {
  return (
    <PublicLayout>
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
              Privacy Policy for Opener Studio
            </h1>
            <p className="text-sm text-muted-foreground">
              Last Updated: November 12, 2025
            </p>
          </div>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              1. The Gist
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                Welcome to Opener Studio ("Opener Studio," "we," "us," or
                "our"). We are owned and operated by Two Steps Ahead LLC. This
                Privacy Policy explains how we collect, use, and share
                information when you use our website and AI-powered service
                (collectively, the "Service").
              </p>
              <p className="mb-4">
                Our philosophy is simple: we are a tool, and your data is yours.
                We will be transparent about how we use your data and will never
                sell it.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              2. Information We Collect
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                We collect information in three main ways:
              </p>
              <p className="mb-4">
                <strong>A. Information You Provide to Us</strong>
              </p>
              <p className="mb-4">
                <strong>Account Information:</strong> When you create an account,
                we collect your email address and name.
              </p>
              <p className="mb-4">
                <strong>Input Data:</strong> This is the core data you provide
                to use the Service:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>Your Profile:</strong> The information you provide
                  about yourself (e.g., your bio, your role).
                </li>
                <li>
                  <strong>Contact Profile:</strong> The information you provide
                  about the person you are contacting (e.g., their LinkedIn bio).
                </li>
                <li>
                  <strong>Your Objective:</strong> The context you provide about
                  your outreach goal (e.g., "ask for a referral").
                </li>
                <li>
                  <strong>Saved Content:</strong> When you "Copy and Save" a
                  generated message, we store that "Opener" in your account
                  history so you can access it later.
                </li>
              </ul>
              <p className="mb-4">
                <strong>Payment Information:</strong> When you subscribe to a
                paid plan (in the future), we will not collect or store your
                payment card details. That information is provided directly to
                our third-party payment processor (Stripe), who securely handle
                the transaction.
              </p>
              <p className="mb-4">
                <strong>Communications:</strong> When you contact us for
                support, we save a record of that conversation.
              </p>
              <p className="mb-4">
                <strong>B. Information We Collect Automatically</strong>
              </p>
              <p className="mb-4">
                <strong>Usage Data:</strong> We collect standard information
                about how you interact with the Service, such as which features
                you use, pages you visit, and buttons you click.
              </p>
              <p className="mb-4">
                <strong>Cookies:</strong> We use cookies (small text files) to
                keep you logged in and to understand how you use our Service. We
                use them for session management and analytics, not for
                third-party advertising.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>Provide the Service:</strong> We use your Input Data
                  to generate your "Openers" and your Saved Content to display
                  your history.
                </li>
                <li>
                  <strong>Maintain and Improve the Service:</strong> We analyze
                  Usage Data to understand what's working, fix what's broken,
                  and improve the user experience.
                </li>
                <li>
                  <strong>Process Payments:</strong> To bill you for paid plans.
                </li>
                <li>
                  <strong>Communicate With You:</strong> To send you
                  service-related updates, security alerts, and support
                  messages.
                </li>
                <li>
                  <strong>Enforce our Terms:</strong> To prevent fraud, abuse,
                  and to protect our legal rights.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              4. How We Handle Your AI and Input Data
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4 font-semibold">
                This is the most important section. We want to be crystal clear
                about how your data is used with our AI models.
              </p>
              <p className="mb-4">
                <strong>A. To Generate Your Openers</strong>
              </p>
              <p className="mb-4">
                To provide the Service, we must send your Input Data (your
                profile, your contact's profile, and your objective) to our
                third-party AI service provider (Gemini API). This is how the
                messages are generated.
              </p>
              <p className="mb-4">
                <strong>B. What We Will NEVER Do</strong>
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  We DO NOT sell your Input Data or Saved Content.
                </li>
                <li>
                  We DO NOT allow our third-party AI providers to use your data
                  to train their models. We have configured our service to
                  opt-out of all data training.
                </li>
                <li>
                  We DO NOT use your personal data to train our own AI models
                  (we don't have our own AI models).
                </li>
              </ul>
              <p className="mb-4">
                <strong>C. What We DO</strong>
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  We process your Input Data transiently. This means we send it
                  to the AI and display the result. We do not store this Input
                  Data unless you explicitly click "Copy and Save" on a
                  resulting Opener.
                </li>
                <li>
                  When you save an Opener, we store only that saved message,
                  your objective, and the contact's name (for your own
                  reference). We do not store the full contact bio you pasted,
                  but we DO store its summaries that we use for message versions
                  generation.
                </li>
                <li>
                  We may use anonymized and aggregated data (e.g., "20% of users
                  are using the 'ask for referral' objective") to improve our
                  product, but this data will never be traceable back to you.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              5. How We Share Your Information
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                Besides our AI provider (as described above), we only share
                information with other service providers who help us run the
                business. We will never sell your data.
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>Payment Processors:</strong> (e.g., Stripe) to handle
                  payments.
                </li>
                <li>
                  <strong>Hosting & Infrastructure:</strong> (e.g., Vercel,
                  Supabase) to host our application and database.
                </li>
                <li>
                  <strong>Analytics Providers:</strong> (e.g., Google
                  Analytics, PostHog) to help us understand our Usage Data.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> If we are required by
                  law, subpoena, or other legal request, we may disclose your
                  information.
                </li>
                <li>
                  <strong>Business Transfer:</strong> If we are sold, merged, or
                  go bankrupt, your information may be transferred as part of
                  that transaction, but the new entity would still be bound by
                  the promises in this policy.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              6. Your Data Rights & Choices
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">You have control over your data.</p>
              <p className="mb-4">
                <strong>Access & Correction:</strong> You can access and update
                your account information (like your email) through your profile
                settings (when available) or by contacting us.
              </p>
              <p className="mb-4">
                <strong>Deletion:</strong> You can delete your account at any
                time by contacting us. This will permanently delete your
                account, your Saved Content, and all other personal information
                associated with it.
              </p>
              <p className="mb-4">
                <strong>Opt-Out of Communications:</strong> You will be able to
                opt-out of any marketing-related emails (in the future) via an
                "unsubscribe" link.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              7. Children's Privacy
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                Our Service is not directed to individuals under 13 (or 16 in
                the EEA). We do not knowingly collect personal information from
                children. If we become aware that we have, we will take steps to
                delete such information.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              8. Changes to This Privacy Policy
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                We may update this policy from time to time as our product
                evolves. If we make significant changes, we will notify you by
                email or through an in-app notification.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              9. Contact Us
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please
                contact us at:
              </p>
              <p className="mb-2">
                <a
                  href="mailto:hello@openerstudio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  hello@openerstudio.com
                </a>
              </p>
              <p className="mb-4">Two Steps Ahead LLC</p>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Privacy;

