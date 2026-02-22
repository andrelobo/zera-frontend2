import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { isAxiosError } from 'axios';
import BrandLogo from '@/components/BrandLogo';
import { toast } from '@/hooks/use-toast';

const WAITING_TIPS = [
  'No primeiro acesso do dia o servidor pode levar alguns segundos para iniciar.',
  'Aproveite para validar CNPJ, IM e certificado digital da empresa.',
  'Revise também o CNAE e o regime tributário antes de emitir NFSe.',
];

const LOADING_STEPS = [
  'Conectando ao servidor',
  'Inicializando ambiente',
  'Validando credenciais',
];

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [warmupState, setWarmupState] = useState<'warming' | 'ready' | 'failed'>('warming');
  const [tipIndex, setTipIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    authApi.warmup()
      .then(() => {
        if (active) setWarmupState('ready');
      })
      .catch(() => {
        if (active) setWarmupState('failed');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % WAITING_TIPS.length);
    }, 3500);
    return () => clearInterval(tipTimer);
  }, []);

  useEffect(() => {
    if (!loading) {
      setStepIndex(0);
      return;
    }
    const stepTimer = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, LOADING_STEPS.length - 1));
    }, 1600);
    return () => clearInterval(stepTimer);
  }, [loading]);

  const warmupMessage = useMemo(() => {
    if (warmupState === 'ready') return 'Servidor pronto para autenticação.';
    if (warmupState === 'failed') return 'Servidor pode estar em inicialização. O login pode demorar alguns segundos.';
    return 'Preparando conexão com o servidor...';
  }, [warmupState]);

  const shouldRetryLogin = (error: unknown) => {
    if (!isAxiosError(error)) return false;
    if (!error.response) return true;
    const status = error.response.status;
    return status >= 500;
  };

  const loginWithRetry = async (maxAttempts = 3) => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await authApi.login({ email, password });
      } catch (error) {
        lastError = error;
        if (!shouldRetryLogin(error) || attempt === maxAttempts) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
      }
    }
    throw lastError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginWithRetry();
      const token = res.accessToken || res.access_token;
      if (!token) {
        toast({
          title: 'Falha no login',
          description: 'Resposta de autenticação inválida. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }
      await login(token);
      navigate('/');
    } catch (error) {
      let message = 'Não foi possível autenticar. Verifique os dados e tente novamente.';
      if (isAxiosError(error)) {
        if (!error.response) {
          message = 'Servidor em inicialização ou indisponível. Aguarde alguns segundos e tente novamente.';
        } else if (error.response.status === 401) {
          message = 'E-mail ou senha inválidos.';
        } else if (error.response.status >= 500) {
          message = 'Servidor indisponível no momento. Tente novamente em instantes.';
        } else if (typeof error.response.data?.message === 'string') {
          message = error.response.data.message;
        }
      }
      toast({
        title: 'Falha no login',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-3">
          <BrandLogo size="lg" showTagline centered className="mx-auto flex-col gap-2" />
          <CardTitle className="text-xl font-semibold tracking-tight">Painel de Emissão de NFSe</CardTitle>
          <CardDescription>Operação Manaus</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
          <div className="mt-5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 space-y-1.5">
            <p className="text-xs font-medium text-foreground">{loading ? LOADING_STEPS[stepIndex] : warmupMessage}</p>
            <p className="text-xs text-muted-foreground">{WAITING_TIPS[tipIndex]}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
