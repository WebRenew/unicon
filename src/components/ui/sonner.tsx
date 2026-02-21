"use client";

import { useEffect, useState } from "react";

type SonnerComponentType = typeof import("sonner")["Toaster"];
type ToasterProps = React.ComponentProps<SonnerComponentType>;

function Toaster({ ...props }: ToasterProps) {
  const [SonnerComponent, setSonnerComponent] = useState<SonnerComponentType | null>(null);

  useEffect(() => {
    let isActive = true;

    import("sonner").then((module) => {
      if (isActive) {
        setSonnerComponent(() => module.Toaster);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (!SonnerComponent) {
    return null;
  }

  return (
    <SonnerComponent
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-zinc-100 group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-zinc-400",
          actionButton:
            "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-900",
          cancelButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-400",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
