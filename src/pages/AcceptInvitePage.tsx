import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BrandLogo from '@/components/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

const AcceptInvitePage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = useMemo(() => params.get('token')?.trim() || '', [params]);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password && confirmation && password === confirmation;
  const canSubmit = Boolean(token && passwordsMatch && password.length >= 8 && !loading);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      toast({
        title: 'Convite inválido',
        description: 'O link de convite está incompleto. Solicite um novo convite ao administrador.',
        variant: 'destructive',
      });
      return;
    }
    if (password.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'Use pelo menos 8 caracteres para proteger seu acesso.',
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirmation) {
      toast({
        title: 'Senhas diferentes',
        description: 'Confirme a senha digitando o mesmo valor nos dois campos.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.acceptInvite({ token, password });
      const accessToken = response.accessToken || response.access_token;
      if (!accessToken) {
        throw new Error('Resposta de autenticação inválida.');
      }
      await login(accessToken);
      toast({
        title: 'Bem-vindo à Jupati',
        description: 'Seu acesso foi ativado com sucesso.',
      });
      navigate('/');
    } catch (error) {
      let message = 'Não foi possível ativar seu convite. Solicite um novo link ao administrador.';
      if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        message = error.response.data.message;
      }
      toast({
        title: 'Falha no convite',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#F7F5F0_0%,#EBE6DE_48%,#C3C5B6_140%)] p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <Card className="hidden overflow-hidden border-0 bg-night-950 text-ivory-100 shadow-xl lg:block">
            <CardContent className="flex h-full flex-col justify-between p-8">
              <div>
                <BrandLogo size="lg" showTagline inverse className="mb-10" />
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/45">Onboarding seguro</p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight">
                  Primeiro acesso com senha definida pelo próprio usuário.
                </h1>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
                  O administrador libera o convite, você cria sua senha e a Jupati ativa sua conta sem trafegar senha por e-mail.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/80">
                <div className="flex items-center gap-2 font-medium text-white">
                  <ShieldCheck className="h-4 w-4" />
                  Segurança em primeiro lugar
                </div>
                <p className="mt-2 text-xs leading-5 text-white/65">
                  Links de convite expiram e só podem ser aceitos uma vez.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-3 text-center">
              <BrandLogo size="lg" showTagline centered className="mx-auto flex-col gap-2 lg:hidden" />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl tracking-tight">Ative seu acesso</CardTitle>
              <CardDescription>
                Defina sua senha para entrar na Jupati.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!token ? (
                <Alert variant="destructive">
                  <AlertTitle>Link incompleto</AlertTitle>
                  <AlertDescription>
                    Este convite não possui token. Solicite um novo link ao administrador.
                  </AlertDescription>
                </Alert>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmation">Confirmar senha</Label>
                  <Input
                    id="confirmation"
                    type="password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder="Digite a senha novamente"
                    required
                    minLength={8}
                  />
                </div>

                {confirmation && !passwordsMatch ? (
                  <p className="text-sm text-destructive">As senhas ainda não conferem.</p>
                ) : null}

                <Button type="submit" className="w-full" disabled={!canSubmit}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Ativar acesso
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
