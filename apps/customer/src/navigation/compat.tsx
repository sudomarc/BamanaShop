import {
  createNavigationContainerRef,
  StackActions,
  useRoute,
  type ParamListBase,
  type RouteProp,
} from "@react-navigation/native";

type CustomerRootParamList = {
  CustomerTabs: { screen?: "Home" | "Categories" | "Cart" | "Orders" | "Profile" } | undefined;
  Login: Record<string, unknown> | undefined;
  ProfileSetup: Record<string, unknown> | undefined;
  CategoryDetail: { slug: string } | undefined;
  ProductDetail: { id: string } | undefined;
  StoreDetail: { id: string } | undefined;
  OrderDetail: { id: string } | undefined;
};

export const navigationRef = createNavigationContainerRef<CustomerRootParamList>();

type RouteTarget = {
  name: keyof CustomerRootParamList;
  params?: Record<string, unknown>;
};

function resolveTarget(
  href: string | { pathname: string; params?: Record<string, unknown> },
): RouteTarget {
  const pathname = typeof href === "string" ? href : href.pathname;
  const supplied = typeof href === "string" ? {} : href.params ?? {};
  const path = pathname.replace(/^\/+|\/+$/g, "");

  if (path.includes("categories/")) {
    const slug = decodeURIComponent(path.split("categories/")[1].split("/")[0]);
    return { name: "CategoryDetail", params: { ...supplied, slug } };
  }
  if (path.startsWith("product/")) return { name: "ProductDetail", params: { ...supplied, id: path.split("/")[1] } };
  if (path.startsWith("store/")) return { name: "StoreDetail", params: { ...supplied, id: path.split("/")[1] } };
  if (path.startsWith("orders/")) return { name: "OrderDetail", params: { ...supplied, id: path.split("/")[1] } };
  if (path.includes("(auth)") || path === "login" || path === "register") return { name: "Login", params: supplied };
  if (path.includes("(onboarding)")) return { name: "ProfileSetup", params: supplied };

  const tab = path.includes("cart") ? "Cart"
    : path.includes("orders") ? "Orders"
    : path.includes("profile") ? "Profile"
    : path.includes("categories") ? "Categories"
    : "Home";
  return { name: "CustomerTabs", params: { ...supplied, screen: tab } };
}

export function useRouter() {
  return {
    push(href: string | { pathname: string; params?: Record<string, unknown> }) {
      const target = resolveTarget(href);
      if (navigationRef.isReady()) {
        navigationRef.navigate(target.name, target.params as never);
      }
    },
    replace(href: string | { pathname: string; params?: Record<string, unknown> }) {
      const target = resolveTarget(href);
      if (navigationRef.isReady()) {
        navigationRef.dispatch(StackActions.replace(target.name, target.params));
      }
    },
    back() {
      if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
    },
  };
}

export function useLocalSearchParams<T extends Record<string, unknown> = Record<string, unknown>>(): T {
  const route = useRoute<RouteProp<ParamListBase, string>>();
  return (route.params ?? {}) as T;
}
