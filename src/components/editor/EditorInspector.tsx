import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  LayoutTemplate,
  Type,
  Palette,
  Image as ImageIcon,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { mockTemplates } from '@/lib/mocks/data';
import { useI18n } from '@/i18n';

const EditorInspector = () => {
  const [activeTab, setActiveTab] = useState('template');
  const { t } = useI18n();

  const effectPresets = [
    { key: 'editor.inspector.preset_clean', fallback: 'Clean' },
    { key: 'editor.inspector.preset_bold', fallback: 'Bold' },
    { key: 'editor.inspector.preset_glass', fallback: 'Glass' },
    { key: 'editor.inspector.preset_neon', fallback: 'Neon' },
  ];

  return (
    <div className="h-full flex flex-col bg-card">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-2 pt-2 gap-0">
          {[
            { value: 'template', icon: LayoutTemplate, labelKey: 'editor.inspector.tab_template' },
            { value: 'content', icon: Type, labelKey: 'editor.inspector.tab_content' },
            { value: 'brand', icon: Palette, labelKey: 'editor.inspector.tab_brand' },
            { value: 'assets', icon: ImageIcon, labelKey: 'editor.inspector.tab_assets' },
            { value: 'effects', icon: SlidersHorizontal, labelKey: 'editor.inspector.tab_effects' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs gap-1.5 px-2.5 py-1.5 data-[state=active]:bg-transparent rounded-t-md rounded-b-none data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors duration-150"
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t(tab.labelKey)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Template tab */}
          <TabsContent value="template" className="mt-0 space-y-4">
            {(['social', 'ecom', 'photoshoot'] as const).map((cat) => {
              const templates = mockTemplates.filter((t) => t.category === cat);
              const catLabelKey = cat === 'social' ? 'editor.inspector.cat_social' : cat === 'ecom' ? 'editor.inspector.cat_ecom' : 'editor.inspector.cat_photoshoot';
              return (
                <div key={cat}>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {t(catLabelKey)} ({templates.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        className="bg-muted/50 border border-border rounded-md p-3 text-left hover-lift"
                      >
                        <div className="aspect-[4/3] rounded bg-muted skeleton-shimmer mb-2" />
                        <p className="text-xs font-medium truncate">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* Content tab */}
          <TabsContent value="content" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_headline')}</Label>
              <Input placeholder={t('editor.inspector.placeholder_headline')} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_subheadline')}</Label>
              <Input placeholder={t('editor.inspector.placeholder_subheadline')} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_cta')}</Label>
              <Input placeholder={t('editor.inspector.placeholder_cta')} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_price')}</Label>
              <Input placeholder="$29.99" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_badge')}</Label>
              <Input placeholder={t('editor.inspector.placeholder_badge')} />
            </div>
            <div className="h-px bg-border" />
            <Button variant="outline" size="sm" className="w-full" disabled>
              {t('editor.inspector.generate_copy_variations')}
            </Button>
          </TabsContent>

          {/* Brand tab */}
          <TabsContent value="brand" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_primary_color')}</Label>
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-md bg-primary border border-border" />
                <Input defaultValue="#FF6A3D" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_secondary_color')}</Label>
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-md bg-secondary border border-border" />
                <Input defaultValue="#3A7BFF" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_accent_color')}</Label>
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-md bg-accent border border-border" />
                <Input defaultValue="#FF6A3D" className="flex-1" />
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_font_preset')}</Label>
              <Textarea placeholder={t('editor.inspector.placeholder_font_preset')} className="h-16 resize-none" readOnly defaultValue="Outfit + Instrument Sans" />
            </div>
            <Button variant="outline" size="sm" className="w-full" disabled>
              <Upload className="h-3.5 w-3.5 mr-2" />
              {t('editor.inspector.upload_logo')}
            </Button>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('editor.inspector.auto_contrast')}</Label>
              <Switch disabled />
            </div>
          </TabsContent>

          {/* Assets tab */}
          <TabsContent value="assets" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_product_image')}</Label>
              <button className="w-full bg-muted/50 border border-dashed border-border rounded-md p-6 text-center hover-lift">
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t('editor.inspector.click_to_upload')}</p>
              </button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('editor.inspector.label_extra_image')}</Label>
              <button className="w-full bg-muted/50 border border-dashed border-border rounded-md p-6 text-center hover-lift">
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t('editor.inspector.click_to_upload')}</p>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('editor.inspector.auto_remove_bg')}</Label>
              <Switch disabled />
            </div>
          </TabsContent>

          {/* Effects tab */}
          <TabsContent value="effects" className="mt-0 space-y-4">
            {[
              { labelKey: 'editor.inspector.effect_text_outline', default: 0 },
              { labelKey: 'editor.inspector.effect_shadow_intensity', default: 30 },
              { labelKey: 'editor.inspector.effect_3d_depth', default: 0 },
              { labelKey: 'editor.inspector.effect_tilt_angle', default: 0 },
            ].map((effect) => (
              <div key={effect.labelKey} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t(effect.labelKey)}</Label>
                  <span className="text-xs text-muted-foreground">{effect.default}%</span>
                </div>
                <Slider defaultValue={[effect.default]} max={100} step={1} className="w-full" />
              </div>
            ))}
            <div className="h-px bg-border" />
            <div>
              <Label className="text-xs mb-2 block">{t('editor.inspector.presets')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {effectPresets.map((preset) => (
                  <Button key={preset.key} variant="outline" size="sm" className="text-xs">
                    {t(preset.key)}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default EditorInspector;
