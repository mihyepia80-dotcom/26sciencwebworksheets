import { PolicyPageShell } from "@/components/legal/PolicyDocumentView";
import { SitePolicyFooter } from "@/components/legal/SitePolicyLinks";
import { PRIVACY_POLICY } from "@/lib/legal/policies";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageShell policy={PRIVACY_POLICY}>
      <div className="mt-6">
        <SitePolicyFooter />
      </div>
    </PolicyPageShell>
  );
}
