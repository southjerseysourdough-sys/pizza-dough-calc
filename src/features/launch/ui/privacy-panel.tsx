import { PRIVACY_AND_DATA_FACTS } from "../domain/help-content";

export function PrivacyPanel() {
  return (
    <section
      aria-labelledby="privacy-data-heading"
      className="surface-inset p-4"
      data-privacy-explanation
    >
      <h3 id="privacy-data-heading" className="text-sm font-medium">
        Privacy and data
      </h3>
      <ul className="mt-3 grid gap-2 text-xs leading-relaxed text-muted-foreground">
        {PRIVACY_AND_DATA_FACTS.map((fact) => (
          <li
            key={fact}
            className="before:mr-2 before:text-acid-lime before:content-['—']"
          >
            {fact}
          </li>
        ))}
      </ul>
    </section>
  );
}
