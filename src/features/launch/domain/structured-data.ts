import { siteConfig } from "@/config/site";

export function createApplicationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteConfig.productionUrl}/#application`,
        name: siteConfig.name,
        url: siteConfig.productionUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any modern web browser",
        description: siteConfig.seo.description,
        browserRequirements: "Requires JavaScript and a modern web browser",
        provider: { "@id": `${siteConfig.productionUrl}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${siteConfig.productionUrl}/#organization`,
        name: siteConfig.brand,
        url: "https://southjerseysourdough.com",
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.productionUrl}/#website`,
        name: siteConfig.name,
        url: siteConfig.productionUrl,
        publisher: { "@id": `${siteConfig.productionUrl}/#organization` },
      },
    ],
  } as const;
}
