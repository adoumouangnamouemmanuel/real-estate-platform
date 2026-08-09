import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Fresh QueryClient per test (retries disabled so failed queries surface
 * immediately). `rerender` re-wraps its argument in the same provider —
 * calling the raw RTL `rerender` with a bare element would unmount the
 * QueryClientProvider along with the old tree.
 */
export function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const result = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );

  return {
    ...result,
    rerender: (nextUi: ReactElement) =>
      result.rerender(
        <QueryClientProvider client={queryClient}>
          {nextUi}
        </QueryClientProvider>,
      ),
  };
}
