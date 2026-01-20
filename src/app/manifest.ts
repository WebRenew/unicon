import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unicon by WebRenew — Icon Library for React",
    short_name: "Unicon",
    description: "Browse 10,000+ icons from Lucide, Phosphor, and Huge Icons. Copy React components, SVGs, or bundle multiple icons.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["developer tools", "productivity", "design"],
    orientation: "any",
    scope: "/",
    lang: "en",
    dir: "ltr",
  };
}
