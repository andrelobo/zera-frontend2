import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, ArrowLeft, KeyRound, Loader2, MailPlus, Save, ShieldCheck } from 'lucide-react';
import { usersApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import type { CreateUserRequest, InviteUserResponse, UserRole } from '@/types/api';
import LoadingState from '@/components/LoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/roles';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type CreationMode = 'invite' | 'manual';

const buildLocalInviteLink = (invite: InviteUserResponse | null) => {
  if (!invite) return '';
  if (invite.inviteUrl) return invite.inviteUrl;
  if (typeof window === 'undefined') return invite.inviteToken;
  return `${window.location.origin}/accept-invite?token=${invite.inviteToken}`;
};

const UserFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const { user } = useAuth();
  const isAdmin = normalizeRole(user?.role || 'user') === 'admin';
  const [creationMode, setCreationMode] = useState<CreationMode>('invite');
  const [inviteResult, setInviteResult] = useState<InviteUserResponse | null>(null);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id!),
    enabled: isEdit && isAdmin,
  });

  const [form, setForm] = useState<CreateUserRequest>({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active',
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        email: existing.email,
        password: '',
        role: existing.role,
        status: existing.status || 'active',
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
        };
        if (form.password) payload.password = form.password;
        return { kind: 'update' as const, data: await usersApi.update(id!, payload) };
      }

      if (creationMode === 'invite') {
        return {
          kind: 'invite' as const,
          data: await usersApi.invite({
            name: form.name,
            email: form.email,
            role: form.role,
          }),
        };
      }

      return { kind: 'create' as const, data: await usersApi.create(form) };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });

      if (result.kind === 'invite') {
        setInviteResult(result.data);
        toast({
          title: 'Convite criado',
          description: 'Copie o link de primeiro acesso e envie ao usuário.',
        });
        return;
      }

      toast({ title: isEdit ? 'Usuário atualizado' : 'Usuário criado' });
      navigate('/users');
    },
  });

  const inviteLink = buildLocalInviteLink(inviteResult);

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({ title: 'Link copiado' });
    } catch {
      toast({
        title: 'Não foi possível copiar',
        description: 'Selecione o link manualmente e copie.',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Usuários</h1>
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>Esta área é exclusiva para administradores.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isEdit && isLoading) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => navigate('/users')} aria-label="Voltar para usuários">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{isEdit ? 'Editar usuário' : 'Convidar usuário'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize perfil, status ou senha.' : 'Crie acesso sem enviar senha por e-mail.'}
          </p>
        </div>
      </div>

      {inviteResult ? (
        <Card className="border-success/25 bg-success/10">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start gap-3" role="status" aria-live="polite">
              <div className="mt-1 rounded-full bg-success/15 p-2 text-success">
                <MailPlus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-foreground">Convite pronto para envio</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  O usuário está inativo até aceitar o convite e definir a própria senha.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={inviteLink} readOnly className="bg-background" aria-label="Link de convite" />
              <Button type="button" onClick={copyInviteLink} className="shrink-0">
                <Copy className="mr-2 h-4 w-4" />
                Copiar link
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-5">
            {!isEdit ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => { setCreationMode('invite'); setInviteResult(null); }}
                  className={`rounded-xl border p-4 text-left transition ${
                    creationMode === 'invite'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <MailPlus className="h-4 w-4 text-primary" />
                    Convite seguro
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Recomendado: o usuário define a própria senha no primeiro acesso.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => { setCreationMode('manual'); setInviteResult(null); }}
                  className={`rounded-xl border p-4 text-left transition ${
                    creationMode === 'manual'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <KeyRound className="h-4 w-4 text-primary" />
                    Senha manual
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Mantém o fluxo antigo: o administrador define a senha inicial.
                  </p>
                </button>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
              </div>
            </div>

            {(isEdit || creationMode === 'manual') ? (
              <div className="space-y-2">
                <Label>{isEdit ? 'Nova Senha (deixe vazio para manter)' : 'Senha inicial'}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required={!isEdit && creationMode === 'manual'}
                />
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select value={form.role || 'user'} onValueChange={(v) => setForm((p) => ({ ...p, role: v as UserRole }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="readonly">Somente leitura</SelectItem>
                    <SelectItem value="manager">Gestor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(isEdit || creationMode === 'manual') ? (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status || 'active'} onValueChange={(v) => setForm((p) => ({ ...p, status: v as 'active' | 'inactive' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                Voltar
              </Button>
              <Button type="submit" size="lg" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : creationMode === 'invite' && !isEdit ? (
                  <MailPlus className="mr-2 h-4 w-4" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isEdit ? 'Salvar usuário' : creationMode === 'invite' ? 'Gerar convite' : 'Cadastrar usuário'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserFormPage;
