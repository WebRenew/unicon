import { SiteHeader } from "@/components/site-header";
import { DocsSidebar } from "@/components/docs-sidebar";
import { Footer } from "@/components/footer";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <SiteHeader variant="docs" />
      <div className="flex-1 flex">
        <DocsSidebar />
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <div className="flex-1 flex justify-center overflow-x-hidden">
            <div className="w-full max-w-5xl min-w-0">
              {children}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
