import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/fake-auth";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/i18n";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isAuthed } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (isAuthed) navigate("/app/dashboard", { replace: true });
  }, [isAuthed, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    navigate("/app/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary mb-4">
            <span className="text-xl font-heading font-bold text-primary-foreground">C</span>
          </div>
          <h1 className="text-2xl font-heading font-bold mb-2 tracking-tight">Creatyng</h1>
          <p className="text-sm text-muted-foreground">
            {t('auth.subtitle')}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={t('auth.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full group">
              {t('auth.sign_in')}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-150" />
            </Button>
          </form>

          <Separator className="my-5" />

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full text-muted-foreground"
              disabled
            >
              {t('auth.continue_google')}
            </Button>
            <Button
              variant="outline"
              className="w-full text-muted-foreground"
              disabled
            >
              {t('auth.continue_github')}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {t('auth.no_account')} {" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => alert(t("auth.signup_placeholder_alert"))}
            >
              {t('auth.sign_up_free')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
