import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
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
      icon: <Home className="h-3.5 w-3.5" />
    });

    // Add Profile if we're on any profile-related page
    if (path.startsWith("/profile")) {
      items.push({
        name: "Profile",
        path: "/profile",
        isCurrentPage: path === "/profile",
        icon: null
      });
    }

    // Add specific sections based on paths
    if (path === "/job-targets") {
      items.push({
        name: "Targets",
        path: "/job-targets",
        isCurrentPage: true,
        icon: null
      });
    }
    if (path === "/companies") {
      items.push({
        name: "Companies & Contacts",
        path: "/companies",
        isCurrentPage: true,
        icon: null
      });
    }
    if (path === "/tracking") {
      items.push({
        name: "Tracking",
        path: "/tracking",
        isCurrentPage: true,
        icon: null
      });
    }
    if (path === "/pipeline") {
      items.push({
        name: "Pipeline",
        path: "/pipeline",
        isCurrentPage: true,
        icon: null
      });
    }

    // Add specific profile sections
    if (path === "/profile/edit") {
      items.push({
        name: "Edit Profile",
        path: "/profile/edit",
        isCurrentPage: true,
        icon: null
      });
    }
    return items;
  };
  const breadcrumbs = getBreadcrumbsForPath();
  return <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => <React.Fragment key={item.path}>
            <BreadcrumbItem>
              {item.isCurrentPage ? <BreadcrumbPage className="flex items-center gap-1">
                  {item.icon && item.icon}
                  {item.name}
                </BreadcrumbPage> : <BreadcrumbLink asChild>
                  
                </BreadcrumbLink>}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>}
          </React.Fragment>)}
      </BreadcrumbList>
    </Breadcrumb>;
}