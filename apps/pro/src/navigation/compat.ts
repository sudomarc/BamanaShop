import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef<any>();

function targetFor(href: string | { pathname: string }): string {
  const path = (typeof href === "string" ? href : href.pathname).toLowerCase();
  return path.includes("(courier)") || path.includes("mission") ? "Courier" : "Seller";
}

export function useRouter() {
  return {
    push(href: string | { pathname: string }) {
      if (navigationRef.isReady()) navigationRef.navigate(targetFor(href));
    },
    replace(href: string | { pathname: string }) {
      if (navigationRef.isReady()) navigationRef.navigate(targetFor(href));
    },
    back() {
      if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
    },
  };
}
