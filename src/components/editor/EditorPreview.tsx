import { ImageOff } from 'lucide-react';
import { useI18n } from '@/i18n';

const EditorPreview = () => {
  const { t } = useI18n();

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background/50 min-h-[300px]">
      <div className="relative w-full max-w-lg aspect-[4/5] rounded-lg border border-border/30 bg-secondary/30 flex flex-col items-center justify-center gap-3">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 rounded-lg opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground/60 font-medium">{t("editor.preview.no_image_yet")}</p>
        <p className="text-xs text-muted-foreground/40">
          {t("editor.preview.select_template_hint")}
        </p>
      </div>
    </div>
  );
};

export default EditorPreview;
