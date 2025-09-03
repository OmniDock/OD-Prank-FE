import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { useHref, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthProvider";
import { PageTransitionProvider } from "@/context/PageTransitionContext";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <ToastProvider placement="top-left" />
      <AuthProvider>
        <PageTransitionProvider>{children}</PageTransitionProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}
