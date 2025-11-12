import React from "react";
import PublicLayout from "@/components/layout/PublicLayout";
import { PrimaryAction } from "@/components/ui/design-system";
import { useModal } from "@/contexts/ModalContext";
import { Check } from "lucide-react";

const Pricing = () => {
  const { openModal } = useModal();

  return (
    <PublicLayout>
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">
              Find the Right Plan for You
            </h1>
            <p className="text-lg text-gray-600">
              Join our free beta and get immediate access. No credit card
              required.
            </p>
          </div>

          {/* Pricing Table */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Tier 1: Free (Beta) */}
            <div className="border border-primary rounded-2xl p-8 shadow-2xl relative flex flex-col">
              <span className="absolute -top-3 left-8 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Best Value
              </span>
              <h2 className="text-2xl font-display font-bold mb-4">Free</h2>
              <p className="text-4xl font-bold mb-2">
                $0 <span className="text-lg font-normal">/ month</span>
              </p>
              <p className="text-gray-500 mb-6">&nbsp;</p>
              <PrimaryAction onClick={openModal} size="lg" className="w-full">
                Get Started - It's Free
              </PrimaryAction>
              <ul className="space-y-4 mt-8 text-gray-700 flex-1">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span>
                    <strong>Unlimited Openers</strong> in Beta, 15 per month
                    after launch
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span>Access to all core features</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span>Unlimited contacts</span>
                </li>
              </ul>
            </div>

            {/* Tier 2: Pro */}
            <div className="border border-gray-200 rounded-2xl p-8 flex flex-col">
              <h2 className="text-2xl font-display font-bold mb-4">Pro</h2>
              <p className="text-4xl font-bold mb-2">
                $14 <span className="text-lg font-normal">/ month</span>
              </p>
              <p className="text-gray-500 mb-6">(Coming Soon)</p>
              <PrimaryAction disabled size="lg" className="w-full">
                Get Notified
              </PrimaryAction>
              <ul className="space-y-4 mt-8 text-gray-700 flex-1">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span>
                    <strong>150 Openers</strong> per month
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span>All features from Free</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span>Reply and Follow Up</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
            </div>

            {/* Tier 3: Premium (Anchor) */}
            <div className="border border-gray-200 rounded-2xl p-8 flex flex-col">
              <h2 className="text-2xl font-display font-bold mb-4">Premium</h2>
              <p className="text-4xl font-bold mb-2">
                $29 <span className="text-lg font-normal">/ month</span>
              </p>
              <p className="text-gray-500 mb-6">(Future)</p>
              <PrimaryAction disabled size="lg" className="w-full">
                Get Notified
              </PrimaryAction>
              <ul className="space-y-4 mt-8 text-gray-700 flex-1">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span>
                    <strong>Unlimited Openers</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span>All features from Pro</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 shrink-0" />
                  <span>Chrome Extension to add LinkedIn contacts</span>
                </li>
              </ul>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-20">
            <h3 className="text-3xl font-display font-bold text-center mb-10">
              Frequently Asked Questions
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-lg mb-2">
                  What happens after the beta?
                </h4>
                <p className="text-gray-700">
                  We're still finalizing our official pricing. But don't worry,
                  all beta users will be given at least 30 days' notice before
                  any changes happen. We'll also be offering a special "founder"
                  package of 300 free Openers to all our early adopters as a
                  thank you.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">What is an "Opener"?</h4>
                <p className="text-gray-700">
                  An "Opener" is consumed only when you get a message you use.
                  You are only charged a credit when you click the "Copy and
                  Save" button on a generated message version. This means you
                  can experiment freely without fear of wasting credits on
                  results you don't use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Pricing;
