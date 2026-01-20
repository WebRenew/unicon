import { SiteHeader } from "@/components/site-header";
import { DocsSidebar } from "@/components/docs-sidebar";

export default function CLILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex">
        <DocsSidebar />
        <main className="flex-1 lg:pl-64 flex justify-center">
          <div className="w-full max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
