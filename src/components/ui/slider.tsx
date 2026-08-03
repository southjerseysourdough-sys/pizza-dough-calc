import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        {/*
         * A measurement rail: a recessed inactive channel with a warm ember
         * fill up to the current value, so the control reads as a gauge
         * rather than a generic form slider.
         */}
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-inset shadow-[inset_0_1px_2px_oklch(0_0_0/10%)] ring-1 ring-hairline/40 select-none data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-gradient-to-r from-crust to-ember select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            // after:-inset-2 keeps the touch target comfortably larger than
            // the visible thumb without enlarging the instrument itself.
            className="relative block size-4 shrink-0 rounded-full border-2 border-ember bg-background shadow-[0_1px_3px_oklch(0_0_0/25%)] ring-ring/50 transition-[box-shadow,transform] select-none after:absolute after:-inset-2.5 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:scale-95 active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
