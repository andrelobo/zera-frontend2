import { Mail } from 'lucide-react';

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2');
};

interface Props {
  email: string;
  whatsapp: string;
  onFieldChange: (field: string, value: string) => void;
}

const ContatoCard = ({ email, whatsapp, onFieldChange }: Props) => (
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
          type="email"
          placeholder="contato@empresa.com.br"
          value={email}
          onChange={(e) => onFieldChange('email', e.target.value)}
        />
      </div>
      <div>
        <label className="field-label">WhatsApp</label>
        <input
          className="field-input"
          placeholder="(00) 00000-0000"
          value={whatsapp}
          onChange={(e) => onFieldChange('whatsapp', formatPhone(e.target.value))}
          maxLength={15}
        />
      </div>
    </div>
  </div>
);

export default ContatoCard;
