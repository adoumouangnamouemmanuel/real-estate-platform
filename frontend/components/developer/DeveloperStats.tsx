interface DeveloperStatsProps {
  activeListings: number;
  totalListings: number;
  yearsActive: number;
  rating?: number;
}

export function DeveloperStats({
  activeListings,
  totalListings,
  yearsActive,
  rating,
}: DeveloperStatsProps) {
  const stats = [
    { label: "Active Listings", value: activeListings },
    { label: "Total Listings", value: totalListings },
    { label: "Years Active", value: yearsActive },
    ...(rating !== undefined
      ? [{ label: "Rating", value: `${rating.toFixed(1)} / 5` }]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border-border rounded-lg border p-4 text-center"
        >
          <p className="text-xl font-semibold">{stat.value}</p>
          <p className="text-muted-foreground text-xs">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
