export interface SEOData {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
}

const BASE_URL = "https://openerstudio.com"; 

export const SEO_CONFIG: Record<string, SEOData> = {
  home: {
    title: "Opener Studio | The AI Networking Workspace for Job Seekers",
    description:
      "Stop staring at a blank LinkedIn message box. Opener Studio is the AI workspace that helps you draft authentic, personalized connection requests that actually get replies.",
    
    ogTitle: "Stop sending generic connection requests.",
    ogDescription:
      "Turn a blank message box into a brilliant Opener. Craft personalized, professional outreach in seconds. Try the private beta.",
    ogImage: `${BASE_URL}/opener-studio-logo-head.png`, // Replace later with a UI screenshot
    ogUrl: `${BASE_URL}/`,
    twitterCard: "summary",
  },
  
  about: {
    title: "Built by a Rocket Scientist turned PM | The Opener Studio Story",
        description:
      "Networking shouldn't feel transactional. Learn why a former rocket scientist & MBA built a tool for himself to optimize for authentic connections, not spam.",
    ogTitle: "Why I built Opener Studio",
    ogDescription: "I hated the 'blank box' anxiety of networking. I hated getting dozens of generic messages in my inbox. So I fixed it.",
    ogImage: `${BASE_URL}/opener-studio-logo-head.png`, // Ideally a picture of you or the "mission"
    ogUrl: `${BASE_URL}/about`,
    twitterCard: "summary",
  },
  
  pricing: {
    title: "Pricing | Fair Credits & Free Beta | Opener Studio",
    
    description:
      "Experience the 'Aha!' moment for free. Our Fair Credit system means you only use credits when you save a draft you love. No credit card required for beta.",
    
    ogTitle: "Opener Studio Pricing: Pay only for what you use.",
    ogDescription:
      "Join the free beta. Generate unlimited drafts; only spend credits when you save the perfect one.",
    ogImage: `${BASE_URL}/opener-studio-logo-head.png`,
    ogUrl: `${BASE_URL}/pricing`,
    twitterCard: "summary",
  },
  
  privacy: {
    title: "Privacy Policy | Your Data is Yours | Opener Studio",
    description:
      "We are a tool, not a data broker. We don't, and never will, sell ads. Read how we protect your inputs and why we never use your data to train public AI models or target you with ads.",
    ogTitle: "Privacy First: We don't train on your data or sell ads.",
    ogDescription:
      "Read our clear-English privacy policy. Your networking data stays yours.",
    ogImage: `${BASE_URL}/opener-studio-logo-head.png`,
    ogUrl: `${BASE_URL}/privacy`,
    twitterCard: "summary",
  },
  
  terms: {
    title: "Terms of Service | Opener Studio",
    description:
      "The rules of the road. Understand your rights and our 'Fair Credit' promise when using the Opener Studio workspace.",
    ogTitle: "Terms of Service",
    ogDescription:
      "Understand your rights and responsibilities when using Opener Studio.",
    ogImage: `${BASE_URL}/opener-studio-logo-head.png`,
    ogUrl: `${BASE_URL}/terms`,
    twitterCard: "summary",
  },
  
  landingMobile: {
    title: "Opener Studio | The AI Networking Workspace for Job Seekers",
    description:
      "Stop staring at a blank LinkedIn message box. Opener Studio is the AI workspace that helps you draft authentic, personalized connection requests that actually get replies.",
    
    ogTitle: "Stop sending generic connection requests.",
    ogDescription:
      "Turn a blank message box into a brilliant Opener. Craft personalized, professional outreach in seconds. Try the private beta.",
    ogImage: `${BASE_URL}/opener-studio-logo-head.png`,
    ogUrl: `${BASE_URL}/landing-mobile`,
    twitterCard: "summary",
  },
};
