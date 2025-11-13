import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { useIsMobile } from "@/hooks/useIsMobile";

const Terms = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    if (isMobile) {
      navigate("/landing-mobile", { replace: true });
    }
  }, [isMobile, navigate]);

  return (
    <PublicLayout>
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4">
              Opener Studio Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground">
              Last Updated: November 12, 2025
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to Opener Studio. These Terms of Service ("Terms") are a
              binding legal agreement between you (the "User," "you," or "your")
              and Two Steps Ahead LLC ("Opener Studio," "we," "us," or "our").
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms govern your access to and use of our website, our
              AI-powered message-crafting application, and all related services
              (collectively, the "Service").
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              By creating an account, clicking "I Agree," or by accessing or
              using our Service, you agree to be bound by these Terms and our
              Privacy Policy.
            </p>
            <p className="text-gray-700 leading-relaxed font-semibold">
              If you do not agree to these Terms, do not use the Service.
            </p>
          </div>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              1. The Service
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                Opener Studio is an AI-powered workspace designed to help you
                craft professional outreach messages ("Openers"). You provide
                context about yourself and the person you are contacting (your
                "Input Content"), and the Service generates message drafts for
                you (the "AI Output").
              </p>
              <p className="mb-4">
                <strong>Beta Service:</strong> You acknowledge that the Service
                is currently in a "Beta" phase. This means the Service is
                provided "as-is" and "as-available." It may contain bugs,
                errors, or inaccuracies, and is subject to change, suspension,
                or discontinuation at any time without notice.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              2. User Accounts
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                <strong>Eligibility:</strong> You must be at least 18 years old
                and legally capable of entering into a binding contract to use
                the Service.
              </p>
              <p className="mb-4">
                <strong>Account Security:</strong> You are responsible for
                keeping your account credentials (like your password)
                confidential. You are responsible for all activities that occur
                under your account.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              3. Your Content and Ownership
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4 font-semibold">
                This is the most important part: You own your content.
              </p>
              <p className="mb-4">
                <strong>Your Content:</strong> This includes your Input Content
                (the bios, notes, and objectives you provide) and the specific
                AI Output ("Openers") that you choose to "Copy and Save" to your
                history.
              </p>
              <p className="mb-4">
                <strong>Our Content:</strong> We own the Service, our website,
                our brand, our data, and all underlying technology, including
                our AI models and workflows.
              </p>
              <p className="mb-4">
                <strong>Your License to Us:</strong> To provide the Service, we
                need you to grant us certain permissions. You grant Opener Studio
                a limited, non-exclusive, worldwide, royalty-free license to
                use, process, store, and display "Your Content" solely for the
                purpose of operating, providing, and improving the Service. This
                includes:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  Sending your Input Content to our third-party AI providers to
                  generate your Openers.
                </li>
                <li>
                  Storing your Saved Openers to display them in your account
                  history.
                </li>
                <li>
                  Analyzing your use of the Service (in an anonymized way) to
                  make it better.
                </li>
              </ul>
              <p className="mb-4">
                We will never sell Your Content or use it to train AI models
                without your explicit consent, as detailed in our Privacy Policy.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              4. Acceptable Use Policy
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  Generate spam, unsolicited commercial messages, or for any
                  mass-marketing purpose.
                </li>
                <li>
                  Create content that is illegal, harmful, hateful, harassing,
                  or discriminatory.
                </li>
                <li>
                  Generate misinformation, disinformation, or "fake news."
                </li>
                <li>Impersonate any person or entity.</li>
                <li>
                  Reverse-engineer, decompile, or attempt to discover the source
                  code of the Service.
                </li>
                <li>
                  Use any automated means (like scrapers or bots) to access the
                  Service, other than through our official API (if one is
                  provided).
                </li>
                <li>
                  Violate any applicable laws or the terms of service of any
                  third-party platform (such as LinkedIn).
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              5. Your Responsibility for AI Output
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                You are responsible for the messages you send. AI-generated
                content can contain inaccuracies, mistakes, or sound "off." You
                must review all AI Output before you use it. Opener Studio is a
                co-pilot, not an auto-pilot.
              </p>
              <p className="mb-4">
                We are not liable for any action you take based on the AI Output,
                or for any replies (or lack thereof) you receive from your
                outreach.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              6. Fees, Payments, and Beta
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                <strong>Beta Period:</strong> The Service is currently free
                during our Beta period. We reserve the right to introduce paid
                plans at any time. We will provide at least 30 days' notice
                before any changes that affect your account.
              </p>
              <p className="mb-4">
                <strong>Paid Plans (Future):</strong> In the future, we will
                offer paid subscription plans.
              </p>
              <p className="mb-4">
                <strong>"Opener" Credit System:</strong> Our plans (including
                the Free Beta) are based on "Opener" credits. We promise to
                operate on a "Fair Credit" system:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  A credit is ONLY consumed when you find a message you like and
                  click the "Copy and Save" button.
                </li>
                <li>
                  You will NOT be charged a credit for simply generating
                  messages, even if you generate multiple versions.
                </li>
              </ul>
              <p className="mb-4">
                <strong>Refunds:</strong> All fees for paid plans (in the
                future) will be non-refundable, except as required by law.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              7. Termination
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                <strong>By You:</strong> You can stop using the Service and
                delete your account at any time by contacting us at{" "}
                <a
                  href="mailto:hello@openerstudio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  hello@openerstudio.com
                </a>
                .
              </p>
              <p className="mb-4">
                <strong>By Us:</strong> We reserve the right to suspend or
                terminate your account if you breach these Terms or for any
                reason at our sole discretion (especially during the Beta
                period).
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              8. Disclaimers and Limitation of Liability
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4 font-semibold uppercase text-sm">
                "AS IS" SERVICE:
              </p>
              <p className="mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT ANY
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING
                THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
                PURPOSE, OR NON-INFRINGEMENT.
              </p>
              <p className="mb-4 font-semibold uppercase text-sm">
                AI OUTPUT DISCLAIMER:
              </p>
              <p className="mb-4">
                WE DO NOT MAKE ANY WARRANTIES ABOUT THE ACCURACY, RELIABILITY,
                COMPLETENESS, OR TIMELINESS OF THE AI OUTPUT. YOU USE ALL AI
                OUTPUT AT YOUR OWN RISK. THE SERVICE IS NOT A SUBSTITUTE FOR
                PROFESSIONAL OR LEGAL ADVICE.
              </p>
              <p className="mb-4 font-semibold uppercase text-sm">
                LIMITATION OF LIABILITY:
              </p>
              <p className="mb-4">
                TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL TWO
                STEPS AHEAD LLC, ITS OWNERS, OR AFFILIATES BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, (WHETHER INCURRED
                DIRECTLY OR INDIRECTLY), OR ANY LOSS OF DATA, USE, GOODWILL, OR
                OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>(A) YOUR USE OF, OR INABILITY TO USE, THE SERVICE;</li>
                <li>(B) ANY AI OUTPUT YOU RELY ON;</li>
                <li>
                  (C) ANY UNAUTHORIZED ACCESS TO OR USE OF YOUR ACCOUNT;
                </li>
                <li>
                  (D) ANY CONDUCT OF ANY THIRD PARTY ON THE SERVICE.
                </li>
              </ul>
              <p className="mb-4">
                OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS RELATING TO THE
                SERVICE WILL NOT EXCEED THE GREATER OF ONE HUNDRED DOLLARS ($100)
                OR THE AMOUNT YOU PAID US (IF ANY) IN THE 12 MONTHS PRECEDING
                THE CLAIM.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              9. Indemnification
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                You agree to defend, indemnify, and hold harmless Two Steps Ahead
                LLC and its officers, directors, employees, and agents from and
                against any claims, liabilities, damages, losses, and expenses,
                including, without limitation, reasonable legal and accounting
                fees, arising out of or in any way connected with (i) your
                breach of these Terms, (or) (ii) your use of the Service, or
                (iii) Your Content, especially if it infringes on a third
                party's rights.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              10. Governing Law and Dispute Resolution
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                These Terms shall be governed by the laws of the Commonwealth of
                Massachusetts, without regard to its conflict of law provisions.
              </p>
              <p className="mb-4">
                Any dispute arising from these Terms will be resolved first
                through informal negotiation by contacting us. If not resolved,
                we agree to binding arbitration in Boston, Massachusetts.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section className="mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
              11. General
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                <strong>Changes to Terms:</strong> We may modify these Terms at
                any time. We will notify you of material changes by email or
                through an in-app notification. Your continued use of the
                Service after such changes constitutes your acceptance of the new
                Terms.
              </p>
              <p className="mb-4">
                <strong>Entire Agreement:</strong> These Terms (and our Privacy
                Policy) constitute the entire agreement between you and us.
              </p>
              <p className="mb-4">
                <strong>Severability:</strong> If any part of these Terms is
                found to be unenforceable, the remaining parts will remain in
                full force and effect.
              </p>
              <p className="mb-4">
                <strong>Contact:</strong> If you have any questions about these
                Terms, please contact us at{" "}
                <a
                  href="mailto:hello@openerstudio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  hello@openerstudio.com
                </a>
                .
              </p>
            </div>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Terms;

