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

const effectPresets = ['Clean', 'Bold', 'Glass', 'Neon'];

const EditorInspector = () => {
  const [activeTab, setActiveTab] = useState('template');

  return (
    <div className="h-full flex flex-col bg-card">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-2 pt-2 gap-0">
          {[
            { value: 'template', icon: LayoutTemplate, label: 'Template' },
            { value: 'content', icon: Type, label: 'Content' },
            { value: 'brand', icon: Palette, label: 'Brand' },
            { value: 'assets', icon: ImageIcon, label: 'Assets' },
            { value: 'effects', icon: SlidersHorizontal, label: 'Effects' },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs gap-1.5 px-2.5 py-1.5 data-[state=active]:bg-transparent rounded-t-md rounded-b-none data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors duration-150"
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Template tab */}
          <TabsContent value="template" className="mt-0 space-y-4">
            {(['social', 'ecom', 'photoshoot'] as const).map((cat) => {
              const templates = mockTemplates.filter((t) => t.category === cat);
              return (
                <div key={cat}>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    {cat === 'social' ? 'Social' : cat === 'ecom' ? 'E-commerce' : 'Photoshoot'} ({templates.length})
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
              <Label className="text-xs">Headline</Label>
              <Input placeholder="Enter headline..." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Subheadline</Label>
              <Input placeholder="Enter subheadline..." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">CTA Text</Label>
              <Input placeholder="Shop Now" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Price (optional)</Label>
              <Input placeholder="$29.99" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Badge (optional)</Label>
              <Input placeholder="NEW" />
            </div>
            <div className="h-px bg-border" />
            <Button variant="outline" size="sm" className="w-full" disabled>
              Generate copy variations
            </Button>
          </TabsContent>

          {/* Brand tab */}
          <TabsContent value="brand" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Primary Color</Label>
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-md bg-primary border border-border" />
                <Input defaultValue="#FF6A3D" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Secondary Color</Label>
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-md bg-secondary border border-border" />
                <Input defaultValue="#3A7BFF" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Accent Color</Label>
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-md bg-accent border border-border" />
                <Input defaultValue="#FF6A3D" className="flex-1" />
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="space-y-2">
              <Label className="text-xs">Font Preset</Label>
              <Textarea placeholder="Select font pairing..." className="h-16 resize-none" readOnly defaultValue="Outfit + Instrument Sans" />
            </div>
            <Button variant="outline" size="sm" className="w-full" disabled>
              <Upload className="h-3.5 w-3.5 mr-2" />
              Upload Logo
            </Button>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Auto Contrast</Label>
              <Switch disabled />
            </div>
          </TabsContent>

          {/* Assets tab */}
          <TabsContent value="assets" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Product Image</Label>
              <button className="w-full bg-muted/50 border border-dashed border-border rounded-md p-6 text-center hover-lift">
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Click to upload</p>
              </button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Extra Image</Label>
              <button className="w-full bg-muted/50 border border-dashed border-border rounded-md p-6 text-center hover-lift">
                <Upload className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Click to upload</p>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Auto Remove Background</Label>
              <Switch disabled />
            </div>
          </TabsContent>

          {/* Effects tab */}
          <TabsContent value="effects" className="mt-0 space-y-4">
            {[
              { label: 'Text Outline', default: 0 },
              { label: 'Shadow Intensity', default: 30 },
              { label: '3D Depth', default: 0 },
              { label: 'Tilt Angle', default: 0 },
            ].map((effect) => (
              <div key={effect.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{effect.label}</Label>
                  <span className="text-xs text-muted-foreground">{effect.default}%</span>
                </div>
                <Slider defaultValue={[effect.default]} max={100} step={1} className="w-full" />
              </div>
            ))}
            <div className="h-px bg-border" />
            <div>
              <Label className="text-xs mb-2 block">Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {effectPresets.map((preset) => (
                  <Button key={preset} variant="outline" size="sm" className="text-xs">
                    {preset}
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
