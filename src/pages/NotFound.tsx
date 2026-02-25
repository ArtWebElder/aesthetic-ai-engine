import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="bg-card border border-border rounded-xl shadow-lg p-10 max-w-md text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <circle cx="12" cy="12" r="10"/>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </div>
        <div>
          <h1 className="text-5xl font-heading font-bold text-foreground">404</h1>
          <p className="text-base text-muted-foreground mt-2">{t("not_found.title")}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" asChild>
            <Link to="/">{t("not_found.back_home")}</Link>
          </Button>
          <Button asChild>
            <Link to="/app/projects">Projects</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
