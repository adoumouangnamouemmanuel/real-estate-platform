"use client";
import { use, useState } from "react";
import { DashboardPageContainer } from "@/components/dashboard/DashboardPageContainer";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { ListingForm } from "@/components/dashboard/listings/ListingForm";
import { useListingForEdit } from "@/hooks/useListingEditor";
import { useLanguage } from "@/components/common/LanguageContext";
export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params),
    { language } = useLanguage(),
    [contentLanguage, setContentLanguage] = useState<"en" | "fr">(language);
  const [dirty, setDirty] = useState(false);
  const query = useListingForEdit(id, contentLanguage);
  return (
    <DashboardPageContainer>
      <DashboardPageHeader
        title={language === "fr" ? "Modifier le bien" : "Edit listing"}
        description=""
      />
      <label>
        {language === "fr" ? "Langue du contenu" : "Content language"}{" "}
        <select
          disabled={dirty}
          aria-label="Content language"
          value={contentLanguage}
          onChange={(e) => setContentLanguage(e.target.value as "en" | "fr")}
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </label>
      {dirty && (
        <p>
          {language === "fr"
            ? "Enregistrez avant de changer la langue du contenu."
            : "Save before changing the content language."}
        </p>
      )}
      {query.isPending ? (
        <p>Chargement… / Loading…</p>
      ) : query.isError ? (
        <p role="alert">
          Impossible de charger le bien. / Listing could not be loaded.
        </p>
      ) : (
        <ListingForm
          key={id + contentLanguage}
          mode="edit"
          listing={query.data}
          onDirtyChange={setDirty}
        />
      )}
    </DashboardPageContainer>
  );
}
