import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

/** Props this component may inject into the control it wraps. */
interface DescribableControlProps {
  "aria-describedby"?: string;
}

/**
 * Shared label + control + validation-error layout, used by every form in the app.
 *
 * The error is programmatically associated with the control, not just placed
 * near it. `role="alert"` announces the message once when it appears, but on its
 * own that leaves a screen-reader user who tabs back to the field later hearing
 * "invalid entry" with no reason — `aria-invalid` says *that* something is
 * wrong, `aria-describedby` says *what*.
 *
 * The association is made here rather than in each form because the id has to
 * agree on both ends: deriving it from `htmlFor` (already the control's id, so
 * already unique on the page) means the two can never drift apart, and no
 * caller has to remember to wire it. Every one of the 23 call sites passes a
 * single control element, so cloning it is sufficient; anything else is
 * rendered untouched rather than silently dropped.
 */
export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  const errorId = `${htmlFor}-error`;

  const control =
    error && isValidElement<DescribableControlProps>(children)
      ? cloneElement(children as ReactElement<DescribableControlProps>, {
          // Preserve anything the caller already described the control with —
          // a hint or a character counter would otherwise be dropped the moment
          // the field became invalid.
          "aria-describedby": [children.props["aria-describedby"], errorId]
            .filter(Boolean)
            .join(" "),
        })
      : children;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {control}
      {/* Rendered only when there is an error, so a valid control never points
          `aria-describedby` at an id that does not exist in the document. */}
      {error && (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
