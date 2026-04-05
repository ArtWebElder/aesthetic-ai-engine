import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 16, height: 16, borderRadius: '50%',
            border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))',
            fontSize: 10, cursor: 'help', marginLeft: 6, flexShrink: 0,
          }}>?</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-normal" style={{ maxWidth: 260, fontSize: 12.5, lineHeight: 1.5, fontWeight: 400 }}>
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
