import React from 'react';
import { Mail } from 'lucide-react';

interface Props {
  email: string;
  whatsapp: string;
  onFieldChange: (field: string, value: string) => void;
  onFieldBlur?: (field: string, value: string) => void;
}

const ContatoCard: React.FC<Props> = ({ email, whatsapp, onFieldChange, onFieldBlur }) => (
  <div className="section-card">
    <h2 className="section-title">
      <Mail className="w-5 h-5 text-primary" />
      Contato
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="field-label">E-mail</label>
        <input
          className="field-input"
          type="text"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="contato@empresa.com.br"
          value={email}
          onChange={(e) => onFieldChange('email', e.target.value)}
        />
      </div>
      <div>
        <label className="field-label">WhatsApp</label>
        <input className="field-input" placeholder="(00) 00000-0000" value={whatsapp} onChange={(e) => onFieldChange('whatsapp', e.target.value)} onBlur={(e) => onFieldBlur?.('whatsapp', e.target.value)} />
      </div>
    </div>
  </div>
);

export default ContatoCard;
