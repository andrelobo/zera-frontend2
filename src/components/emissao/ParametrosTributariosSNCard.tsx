import React, { useState } from 'react';
import { ChevronDown, Info, Scale } from 'lucide-react';
import type { ParametroIssEmissao } from '@/pages/nfseEmit.tributacao';

interface Props {
  value?: ParametroIssEmissao;
  disabled?: boolean;
}

const PARAMETROS = [
  'Nao sujeitos ao fator "r" e tributados pelo Anexo III, sem retencao/substituicao tributaria de ISS, com ISS devido a outro(s) Municipio(s).',
  'Nao sujeitos ao fator "r" e tributados pelo Anexo III, sem retencao/substituicao tributaria de ISS, com ISS devido ao proprio Municipio do estabelecimento.',
  'Nao sujeitos ao fator "r" e tributados pelo Anexo III, com retencao/substituicao tributaria de ISS.',
];

const ParametrosTributariosSNCard: React.FC<Props> = ({ value, disabled = false }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="section-card p-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={open}
        disabled={disabled}
      >
        <h2 className="section-title text-sm mb-0 flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-primary" />
          Prestacao de servicos, exceto para o exterior.
        </h2>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground">
              Regra automatica na emissao da nfse por tomador e local.
            </span>
          </div>
          <ul className="space-y-1.5">
            {PARAMETROS.map((texto, index) => {
              const active =
                (value === 'iss_outro_municipio' && index === 0) ||
                (value === 'iss_proprio_municipio' && index === 1) ||
                (value === 'iss_retencao_substituicao' && index === 2);

              return (
                <li
                  key={index}
                  className={`text-xs leading-snug pl-3 border-l-2 ${active ? 'border-primary text-foreground font-medium' : 'border-primary/30 text-foreground'}`}
                >
                  {texto}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ParametrosTributariosSNCard;
