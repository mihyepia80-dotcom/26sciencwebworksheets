import Link from "next/link";
import { SITE_CONTACT, SITE_POLICIES } from "@/lib/legal/policies";

export function SiteLegalFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t border-slate-200 pt-8 text-sm text-slate-500 ${className}`}>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {SITE_POLICIES.map((item, index) => (
          <span key={item.href} className="inline-flex items-center gap-4">
            {index > 0 && <span className="hidden text-slate-300 sm:inline">|</span>}
            <Link href={item.href} className="hover:text-slate-800 hover:underline">
              {item.label}
            </Link>
          </span>
        ))}
      </div>
      <p className="mt-3 leading-relaxed">
        © {SITE_CONTACT.copyrightYear} {SITE_CONTACT.serviceName}. All rights reserved.
      </p>
      <p className="mt-1 leading-relaxed">
        개인정보책임자: {SITE_CONTACT.privacyOfficer} ({SITE_CONTACT.organization}) | 문의:{" "}
        {SITE_CONTACT.contact}
      </p>
    </footer>
  );
}
