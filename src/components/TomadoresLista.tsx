import React, { useMemo, useState } from 'react';
import { Users, Pencil, Trash2, Loader2, Search, PlusCircle } from 'lucide-react';

export interface TomadorListaItem {
  id: string;
  cpfCnpj: string;
  razaoSocial: string;
  localidadeUf?: string;
  email?: string;
  substitutoTributario?: boolean;
}

interface Props {
  tomadores: TomadorListaItem[];
  loading: boolean;
  onEditar?: (tomador: TomadorListaItem) => void;
  onExcluir?: (id: string) => void;
  onNovo?: () => void;
  editingId?: string | null;
}

const TomadoresLista: React.FC<Props> = ({ tomadores, loading, onEditar, onExcluir, onNovo, editingId = null }) => {
  const canCreate = typeof onNovo === 'function';
  const canEdit = typeof onEditar === 'function';
  const canDelete = typeof onExcluir === 'function';
  const showActions = canEdit || canDelete;
  const [filtro, setFiltro] = useState('');

  const tomadoresFiltrados = useMemo(() => {
    if (!filtro.trim()) return tomadores;
    const termo = filtro.toLowerCase();
    return tomadores.filter(
      (t) =>
        t.razaoSocial.toLowerCase().includes(termo)
        || t.cpfCnpj.includes(termo)
        || (t.email && t.email.toLowerCase().includes(termo))
        || (t.localidadeUf && t.localidadeUf.toLowerCase().includes(termo)),
    );
  }, [tomadores, filtro]);

  if (loading) {
    return (
      <div className="section-card flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="section-card">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="section-title mb-0">
          <Users className="w-5 h-5 text-primary" />
          Tomadores Cadastrados ({tomadoresFiltrados.length})
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="field-input pl-8 py-1.5 text-sm w-48 sm:w-64"
              placeholder="Pesquisar tomador..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
          {canCreate ? (
            <button
              onClick={() => onNovo?.()}
              className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Tomador</span>
            </button>
          ) : null}
        </div>
      </div>

      {tomadoresFiltrados.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {filtro ? 'Nenhum tomador encontrado para a pesquisa.' : 'Nenhum tomador cadastrado ainda. Clique em "Novo Tomador" para começar.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">CNPJ/CPF</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Nome / Razão Social</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Localidade</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden lg:table-cell">E-mail</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground hidden sm:table-cell w-20">SubTrib</th>
                {showActions ? <th className="text-right py-2 px-3 font-medium text-muted-foreground w-24">Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {tomadoresFiltrados.map((t) => (
                <tr key={t.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${editingId === t.id ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}>
                  <td className="py-2.5 px-3 text-sm text-foreground">{t.cpfCnpj}</td>
                  <td className="py-2.5 px-3 text-sm text-foreground">{t.razaoSocial}</td>
                  <td className="py-2.5 px-3 text-sm text-muted-foreground hidden md:table-cell">{t.localidadeUf || '—'}</td>
                  <td className="py-2.5 px-3 text-sm text-muted-foreground hidden lg:table-cell">{t.email || '—'}</td>
                  <td className="py-2.5 px-3 text-center hidden sm:table-cell">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-md font-medium ${
                      t.substitutoTributario
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {t.substitutoTributario ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  {showActions ? (
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit ? (
                          <button
                            onClick={() => onEditar?.(t)}
                            className="rounded-full border border-sky-200 bg-sky-50 p-1.5 text-sky-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-100 hover:text-sky-950"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            onClick={() => {
                              if (window.confirm(`Excluir o tomador "${t.razaoSocial}"?`)) {
                                onExcluir?.(t.id);
                              }
                            }}
                            className="rounded-full border border-rose-200 bg-rose-50 p-1.5 text-rose-800 shadow-sm transition-colors hover:border-rose-300 hover:bg-rose-100 hover:text-rose-950"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TomadoresLista;
