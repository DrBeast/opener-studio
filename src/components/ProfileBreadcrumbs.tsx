import React from "react";
import { useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/airtable-ds/breadcrumb";
import { Link } from "react-router-dom";
export function ProfileBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  // Map paths to user-friendly names
  const getBreadcrumbsForPath = () => {
    const items = [];

    // Always start with Home
    items.push({
      name: "Home",
      path: "/",
      isCurrentPage: path === "/",
      icon: <Home className="h-3.5 w-3.5" />,
    });

    // Add Profile if we're on any profile-related page
    if (path.startsWith("/profile")) {
      items.push({
        name: "Profile",
        path: "/profile",
        isCurrentPage: path === "/profile",
        icon: null,
      });
    }

    // Add specific sections based on paths
    if (path === "/tracking") {
      items.push({
        name: "Tracking",
        path: "/tracking",
        isCurrentPage: true,
        icon: null,
      });
    }
    if (path === "/studio") {
      items.push({
        name: "Studio",
        path: "/studio",
        isCurrentPage: true,
        icon: null,
      });
    }
    return items;
  };
  const breadcrumbs = getBreadcrumbsForPath();
  return <Breadcrumb className="mb-6"></Breadcrumb>;
}
