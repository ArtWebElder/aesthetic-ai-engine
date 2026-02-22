import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/fake-auth";
import AuroraDivider from "@/components/AuroraDivider";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isAuthed } = useAuth();
  const navigate = useNavigate();

  // ✅ redirect só quando o estado mudar (evita loop)
  useEffect(() => {
    if (isAuthed) navigate("/app/dashboard", { replace: true });
  }, [isAuthed, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
    navigate("/app/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center noise-overlay p-4">
      <div className="relative z-10 w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold mb-2">Magic Idea</h1>
          <p className="text-sm text-muted-foreground">
            Create high-performing creatives in minutes.
          </p>
        </div>

        {/* Login card */}
        <div className="glass-surface rounded-lg p-6 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
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
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full group">
              Sign in
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </form>

          <AuroraDivider className="my-5" />

          {/* Social login placeholder */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full text-muted-foreground"
              disabled
            >
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full text-muted-foreground"
              disabled
            >
              Continue with GitHub
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => alert("Signup (placeholder)")}
            >
              Sign up free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;