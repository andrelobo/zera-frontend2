import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { nfseApi } from '@/services/api';
import type { ServicoCatalogItem } from '@/types/api';

const MIN_AUTOCOMPLETE_CHARS = 2;

interface ServicoAutocompleteProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  selectedCode?: string;
  onValueChange: (value: string) => void;
  onSelect: (item: ServicoCatalogItem) => void;
  queryScope: string;
  helperClassName?: string;
}

export default function ServicoAutocomplete({
  id = 'serviceSearch',
  label = 'Serviço (autocomplete)',
  placeholder = 'Digite código ou descrição do serviço',
  value,
  selectedCode,
  onValueChange,
  onSelect,
  queryScope,
  helperClassName = 'text-sm',
}: ServicoAutocompleteProps) {
  const [searchDebounced, setSearchDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(value), 250);
    return () => clearTimeout(timer);
  }, [value]);

  const canSearch = searchDebounced.trim().length >= MIN_AUTOCOMPLETE_CHARS;
  const serviceQuery = useQuery({
    queryKey: ['nfse-service-autocomplete', queryScope, searchDebounced],
    queryFn: async () => {
      try {
        return await nfseApi.servicosList(
          { q: searchDebounced, limit: 8 },
          { skipGlobalErrorToast: true },
        );
      } catch {
        return nfseApi.servicosAutocomplete({ q: searchDebounced, limit: 8 });
      }
    },
    enabled: canSearch,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="field-label">{label}</Label>
      <Input
        id={id}
        className="field-input"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
      />

      {serviceQuery.isLoading && canSearch && (
        <p className={`${helperClassName} text-muted-foreground`}>Buscando serviços...</p>
      )}

      {serviceQuery.isSuccess && (serviceQuery.data?.items?.length ?? 0) > 0 && (
        <div className="max-h-44 overflow-auto rounded-md border p-1">
          {(serviceQuery.data?.items ?? []).map((item) => (
            <button
              key={`${item.codigoServico}-${item.sequencial ?? ''}`}
              type="button"
              className="w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
              onClick={() => onSelect(item)}
            >
              <span className="font-medium">{item.codigoServico}</span> - {item.descricao}
            </button>
          ))}
        </div>
      )}

      {serviceQuery.isFetched && !serviceQuery.isFetching && canSearch && (serviceQuery.data?.items?.length ?? 0) === 0 && (
        <p className={`${helperClassName} text-muted-foreground`}>Nenhum serviço encontrado.</p>
      )}

      <p className={`${helperClassName} text-muted-foreground`}>
        {selectedCode && selectedCode.length === 6
          ? `Código selecionado: ${selectedCode}`
          : 'Selecione um item da lista ou digite o código com 6 dígitos.'}
      </p>
    </div>
  );
}

