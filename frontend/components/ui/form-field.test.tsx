import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "./form-field";
import { Input } from "./input";

describe("FormField", () => {
  it("labels the control", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <Input id="email" />
      </FormField>,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  describe("when the field is valid", () => {
    it("renders no error and leaves the control undescribed", () => {
      render(
        <FormField label="Email" htmlFor="email">
          <Input id="email" />
        </FormField>,
      );

      // The critical half of the contract: a valid control must not point at an
      // id that isn't in the document. A dangling aria-describedby is worse
      // than none — screen readers announce nothing and the bug is invisible.
      expect(screen.getByLabelText("Email")).not.toHaveAttribute(
        "aria-describedby",
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(document.getElementById("email-error")).toBeNull();
    });
  });

  describe("when the field has an error", () => {
    it("exposes aria-invalid on the control", () => {
      render(
        <FormField label="Email" htmlFor="email" error="Enter a valid email.">
          <Input id="email" aria-invalid />
        </FormField>,
      );

      expect(screen.getByLabelText("Email")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });

    it("gives the error a stable id derived from the control id", () => {
      render(
        <FormField label="Email" htmlFor="email" error="Enter a valid email.">
          <Input id="email" aria-invalid />
        </FormField>,
      );

      const error = screen.getByRole("alert");
      expect(error).toHaveAttribute("id", "email-error");
      expect(error).toHaveTextContent("Enter a valid email.");
    });

    it("points aria-describedby at that error, and the target exists", () => {
      render(
        <FormField label="Email" htmlFor="email" error="Enter a valid email.">
          <Input id="email" aria-invalid />
        </FormField>,
      );

      const control = screen.getByLabelText("Email");
      const describedBy = control.getAttribute("aria-describedby");

      expect(describedBy).toBe("email-error");
      // Resolve the reference rather than trusting the string: this is what an
      // assistive technology actually does.
      expect(document.getElementById(describedBy!)).toHaveTextContent(
        "Enter a valid email.",
      );
    });

    it("keeps ids distinct when several fields are on the same form", () => {
      render(
        <form>
          <FormField label="Email" htmlFor="email" error="Enter a valid email.">
            <Input id="email" aria-invalid />
          </FormField>
          <FormField label="Password" htmlFor="password" error="Too short.">
            <Input id="password" aria-invalid />
          </FormField>
        </form>,
      );

      expect(screen.getByLabelText("Email")).toHaveAttribute(
        "aria-describedby",
        "email-error",
      );
      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "aria-describedby",
        "password-error",
      );
    });

    it("preserves a description the caller already set on the control", () => {
      render(
        <>
          <FormField label="Password" htmlFor="password" error="Too short.">
            <Input
              id="password"
              aria-describedby="password-hint"
              aria-invalid
            />
          </FormField>
          <span id="password-hint">At least 8 characters.</span>
        </>,
      );

      // A hint must survive the field becoming invalid, not be replaced by the
      // error — the user needs both.
      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "aria-describedby",
        "password-hint password-error",
      );
    });
  });

  it("renders non-element children untouched rather than dropping them", () => {
    render(
      <FormField label="Notes" htmlFor="notes" error="Required.">
        plain text
      </FormField>,
    );

    expect(screen.getByText("plain text")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveAttribute("id", "notes-error");
  });
});
