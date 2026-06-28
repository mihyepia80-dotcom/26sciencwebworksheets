import { PolicyPageShell } from "@/components/legal/PolicyDocumentView";
import { SitePolicyFooter } from "@/components/legal/SitePolicyLinks";
import { TERMS_OF_SERVICE } from "@/lib/legal/policies";

export default function TermsPage() {
  return (
    <PolicyPageShell policy={TERMS_OF_SERVICE}>
      <div className="mt-6">
        <SitePolicyFooter />
      </div>
    </PolicyPageShell>
  );
}
