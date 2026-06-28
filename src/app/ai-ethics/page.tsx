import { PolicyPageShell } from "@/components/legal/PolicyDocumentView";
import { SitePolicyFooter } from "@/components/legal/SitePolicyLinks";
import { AI_ETHICS_POLICY } from "@/lib/legal/policies";

export default function AiEthicsPage() {
  return (
    <PolicyPageShell policy={AI_ETHICS_POLICY}>
      <div className="mt-6">
        <SitePolicyFooter />
      </div>
    </PolicyPageShell>
  );
}
