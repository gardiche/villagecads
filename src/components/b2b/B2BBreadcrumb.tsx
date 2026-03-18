import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "/pro/mentor/dashboard": "Mes entrepreneurs",
  "/pro/dashboard": "Dashboard cohorte",
  "/account/admin": "Paramètres",
};

interface B2BBreadcrumbProps {
  pageTitle: string;
}

const B2BBreadcrumb = ({ pageTitle }: B2BBreadcrumbProps) => {
  const location = useLocation();
  const isMentor = location.pathname.startsWith("/pro/mentor");
  const section = isMentor ? "Mentorat" : "Analytics";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink className="text-muted-foreground text-sm cursor-default">
            {section}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-sm">{pageTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default B2BBreadcrumb;
