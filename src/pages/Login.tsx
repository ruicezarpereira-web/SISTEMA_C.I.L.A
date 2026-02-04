import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Award, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulated login - will be replaced with Supabase auth
    setTimeout(() => {
      if (formData.email && formData.password) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao Sistema de Licenças Prêmio",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Erro no login",
          description: "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-header items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <div className="flex justify-center mb-8">
            <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Award className="h-14 w-14 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">TRANSALVADOR</h1>
          <h2 className="text-2xl font-semibold mb-6">Sistema de Gestão de Licenças Prêmio</h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Gerencie processos de licença prêmio de forma eficiente, com cálculos automatizados 
            e geração de documentos integrada.
          </p>
          
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">1.247</div>
              <div className="text-sm text-white/70">Servidores</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">118</div>
              <div className="text-sm text-white/70">Processos Ativos</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">42</div>
              <div className="text-sm text-white/70">Deferidos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
        <Card className="w-full max-w-md animate-fade-in shadow-elevated">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-3 mb-2 lg:hidden">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Award className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">TRANSALVADOR</span>
            </div>
            <CardTitle className="text-2xl font-bold">Entrar no Sistema</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@transalvador.gov.br"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a href="#" className="text-sm text-primary hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Entrando...
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Acesso restrito a funcionários autorizados</p>
              <p className="mt-1">TRANSALVADOR © 2025</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
