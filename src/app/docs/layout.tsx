import { SiteHeader } from "@/components/site-header";
import { DocsSidebar } from "@/components/docs-sidebar";
import { Footer } from "@/components/footer";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <SiteHeader variant="docs" />
      </div>

      {/* Fixed sidebar */}
      <DocsSidebar />

      {/* Main content with padding for fixed header */}
      <div className="pt-14 lg:pl-64 min-h-screen flex flex-col">
        <div className="flex-1 flex justify-center overflow-x-hidden">
          <div className="w-full max-w-5xl min-w-0">
            {children}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
