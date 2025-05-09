
import { useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
    
    // Add specific profile sections
    if (path === "/profile/edit") {
      items.push({
        name: "Edit Profile",
        path: "/profile/edit",
        isCurrentPage: true,
        icon: null
      });
    } else if (path === "/profile/enrich") {
      items.push({
        name: "Professional Background",
        path: "/profile/enrich",
        isCurrentPage: true,
        icon: null
      });
    } else if (path === "/profile/job-targets") {
      items.push({
        name: "Job Targets",
        path: "/profile/job-targets",
        isCurrentPage: true,
        icon: null
      });
    }
    
    return items;
  };
  
  const breadcrumbs = getBreadcrumbsForPath();
  
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.path}>
            <BreadcrumbItem>
              {item.isCurrentPage ? (
                <BreadcrumbPage className="flex items-center">
                  {item.icon}
                  {item.icon && <span className="ml-1">{item.name}</span>}
                  {!item.icon && item.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild className="flex items-center">
                  <Link to={item.path}>
                    {item.icon}
                    {item.icon && <span className="ml-1">{item.name}</span>}
                    {!item.icon && item.name}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator><ChevronRight className="h-3.5 w-3.5" /></BreadcrumbSeparator>}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
