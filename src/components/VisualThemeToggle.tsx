import { Sparkles } from 'lucide-react';
import { Sparkle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useVisualTheme } from '@/hooks/useVisualTheme';

const VisualThemeToggle = () => {
  const { isElegant, toggleVisualTheme } = useVisualTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Alternar visual da interface"
      title={isElegant ? 'Voltar ao visual clássico' : 'Ativar visual elegante'}
      onClick={toggleVisualTheme}
      className="h-8 w-full justify-start px-2 font-normal"
    >
      {isElegant ? (
        <Sparkle className="mr-2 h-4 w-4" weight="duotone" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      <span>{isElegant ? 'Visual clássico' : 'Visual elegante'}</span>
    </Button>
  );
};

export default VisualThemeToggle;
