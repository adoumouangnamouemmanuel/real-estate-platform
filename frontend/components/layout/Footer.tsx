import { APP_NAME } from "@/constants/config";

export function Footer() {
  return (
    <footer className="border-border border-t">
      <div className="container-page text-muted-foreground py-6 text-sm">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
