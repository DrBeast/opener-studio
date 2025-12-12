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

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      {seoData.ogTitle && (
        <meta property="og:title" content={seoData.ogTitle} />
      )}
      {seoData.ogDescription && (
        <meta property="og:description" content={seoData.ogDescription} />
      )}
      {seoData.ogImage && (
        <meta property="og:image" content={seoData.ogImage} />
      )}
      {seoData.ogUrl && <meta property="og:url" content={seoData.ogUrl} />}

      {/* Twitter */}
      {seoData.twitterCard && (
        <meta name="twitter:card" content={seoData.twitterCard} />
      )}
      {seoData.ogTitle && (
        <meta name="twitter:title" content={seoData.ogTitle} />
      )}
      {seoData.ogDescription && (
        <meta name="twitter:description" content={seoData.ogDescription} />
      )}
    </Helmet>
  );
};
