/** Shown wherever a Mapbox pin is planned but not wired up yet — gated by FEATURES.MAP_VIEW. */
export function MapPlaceholder() {
  return (
    <div className="border-border text-muted-foreground flex h-40 items-center justify-center rounded-lg border border-dashed text-sm">
      Map view coming soon
    </div>
  );
}
