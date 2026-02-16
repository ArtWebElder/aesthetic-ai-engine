import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Copy, Download, PanelRight, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import EditorPreview from '@/components/editor/EditorPreview';
import EditorInspector from '@/components/editor/EditorInspector';
import { mockProjects, mockTemplates } from '@/lib/mocks/data';

const ProjectEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = mockProjects.find((p) => p.id === id) || mockProjects[0];
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] animate-fade-in">
      {/* Editor toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-card/30 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/app/projects')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{project?.name || 'New Project'}</p>
        </div>

        {/* Mobile triggers */}
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setTemplatesOpen(true)}>
          <LayoutTemplate className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setInspectorOpen(true)}>
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor body */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Templates (desktop) */}
        <aside className="hidden lg:flex w-56 border-r border-border/50 overflow-y-auto p-3 bg-card/20 shrink-0">
          <div className="space-y-3 w-full">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Templates</h3>
            {mockTemplates.map((t) => (
              <button key={t.id} className="w-full glass-surface rounded-md p-2.5 text-left hover-lift">
                <div className="aspect-[4/3] rounded bg-secondary/50 skeleton-shimmer mb-1.5" />
                <p className="text-xs font-medium truncate">{t.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{t.category}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <EditorPreview />

        {/* Right Panel - Inspector (desktop) */}
        <aside className="hidden lg:flex w-72 xl:w-80 border-l border-border/50 overflow-hidden shrink-0">
          <div className="w-full overflow-y-auto">
            <EditorInspector />
          </div>
        </aside>
      </div>

      {/* Actions bar (sticky bottom) */}
      <div className="border-t border-border/50 bg-card/40 px-4 py-3 flex flex-col sm:flex-row gap-2 shrink-0">
        <Button className="flex-1 sm:flex-none">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Base Image
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          <Copy className="h-4 w-4 mr-2" />
          Create 10 Variations
          <span className="ml-1.5 text-xs text-muted-foreground">(free)</span>
        </Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          <Download className="h-4 w-4 mr-2" />
          Export 2K
        </Button>
      </div>

      {/* Mobile: Inspector bottom sheet */}
      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent side="bottom" className="h-[75vh] p-0 rounded-t-2xl">
          <EditorInspector />
        </SheetContent>
      </Sheet>

      {/* Mobile: Templates drawer */}
      <Sheet open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <SheetContent side="left" className="w-72 p-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Templates</h3>
          <div className="space-y-2 overflow-y-auto">
            {mockTemplates.map((t) => (
              <button key={t.id} className="w-full glass-surface rounded-md p-2.5 text-left hover-lift">
                <div className="aspect-[4/3] rounded bg-secondary/50 skeleton-shimmer mb-1.5" />
                <p className="text-xs font-medium truncate">{t.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{t.category}</p>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ProjectEditor;
