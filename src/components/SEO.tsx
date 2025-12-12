import { Helmet } from "react-helmet-async";
import { SEO_CONFIG, SEOData } from "@/lib/seo";

interface SEOProps {
  page: keyof typeof SEO_CONFIG;
  customData?: Partial<SEOData>;
}

export const SEO = ({ page, customData }: SEOProps) => {
  const seoData = { ...SEO_CONFIG[page], ...customData };

  return (
    <Helmet>
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />

      {/* Open Graph - Always render, Helmet will handle updates */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={seoData.ogTitle || seoData.title} />
      <meta
        property="og:description"
        content={seoData.ogDescription || seoData.description}
      />
      <meta property="og:image" content={seoData.ogImage || ""} />
      <meta property="og:url" content={seoData.ogUrl || ""} />

      {/* Twitter */}
      <meta name="twitter:card" content={seoData.twitterCard || "summary"} />
      <meta name="twitter:title" content={seoData.ogTitle || seoData.title} />
      <meta
        name="twitter:description"
        content={seoData.ogDescription || seoData.description}
      />
    </Helmet>
  );
};
