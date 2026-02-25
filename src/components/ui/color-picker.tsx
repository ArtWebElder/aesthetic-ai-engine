import { useCallback, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [localHex, setLocalHex] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handlePickerChange = useCallback(
    (color: string) => {
      setLocalHex(color);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(color), 30);
    },
    [onChange]
  );

  const handleHexInput = useCallback(
    (raw: string) => {
      const hex = raw.startsWith("#") ? raw : `#${raw}`;
      setLocalHex(hex);
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
        onChange(hex);
      }
    },
    [onChange]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={[
            "w-7 h-7 rounded-full shadow-sm border border-border/60 transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ backgroundColor: value }}
          aria-label="Pick color"
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 rounded-xl border border-border bg-popover shadow-xl space-y-3"
        align="start"
        sideOffset={8}
      >
        <div className="[&_.react-colorful]:!w-[200px] [&_.react-colorful]:!h-[160px] [&_.react-colorful]:rounded-lg [&_.react-colorful__saturation]:!rounded-t-lg [&_.react-colorful__hue]:!rounded-b-lg [&_.react-colorful__pointer]:!w-4 [&_.react-colorful__pointer]:!h-4 [&_.react-colorful__pointer]:!border-2">
          <HexColorPicker color={value} onChange={handlePickerChange} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono uppercase">HEX</span>
          <Input
            value={localHex}
            onChange={(e) => handleHexInput(e.target.value)}
            onBlur={() => setLocalHex(value)}
            className="h-7 text-xs font-mono px-2 w-[90px]"
            maxLength={7}
          />
          <div
            className="w-5 h-5 rounded-full border border-border/40 shrink-0"
            style={{ backgroundColor: value }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
