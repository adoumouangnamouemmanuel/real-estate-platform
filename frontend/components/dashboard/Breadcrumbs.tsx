import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Only meant for pages more than two levels deep in the dashboard IA (e.g. My
 * Properties → [listing title] → Edit) — most dashboard pages render no breadcrumb
 * at all. The last item is always the current page: non-link, aria-current="page".
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={item.label}>
              {index > 0 && (
                <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              )}
              <li>
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-foreground">
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={
                      isLast ? "text-foreground font-medium" : undefined
                    }
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
