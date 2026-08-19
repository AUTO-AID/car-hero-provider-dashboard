"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Lock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { providerQueryKeys } from "@/application/services/prefetch";
import { cn } from "@/lib/utils";
import { AccountProfile, ProviderProfile } from "@/domain/entities/provider.types";
import { getAccountProfile, getProviderProfile } from "@/infrastructure/services/profile.service";
import { DocumentsUploader } from "./components/documents-uploader";
import { ProfileForm } from "./components/profile-form";
import { SecurityPreferences } from "./components/security-preferences";

type Tab = "profile" | "documents" | "security";

export default function ProviderSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const profileQuery = useQuery({ queryKey: providerQueryKeys.profile, queryFn: getProviderProfile });
  const accountQuery = useQuery({ queryKey: providerQueryKeys.account, queryFn: getAccountProfile });

  if (profileQuery.isLoading || accountQuery.isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (profileQuery.isError || accountQuery.isError) {
    return (
      <ErrorState
        title="تعذّر تحميل إعدادات الحساب"
        description="لم يستجب الخادم لطلب بيانات ملفّك أو حسابك."
        onRetry={() => { void profileQuery.refetch(); void accountQuery.refetch(); }}
        isRetrying={profileQuery.isFetching || accountQuery.isFetching}
      />
    );
  }

  const provider = (profileQuery.data ?? {}) as Partial<ProviderProfile>;
  const account = (accountQuery.data ?? {}) as Partial<AccountProfile>;
  const documents = Array.isArray(provider.documents) ? provider.documents : [];
  const notifications = account.preferences?.notifications ?? { push: true, sms: true, email: false };

  return (
    <div className="max-w-4xl space-y-5 animate-fade-in">
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border bg-card p-1.5" role="tablist" aria-label="أقسام الإعدادات">
        <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={User} label="الملف الشخصي" />
        <TabButton active={activeTab === "documents"} onClick={() => setActiveTab("documents")} icon={FileText} label="الوثائق" attention={!documents.length} />
        <TabButton active={activeTab === "security"} onClick={() => setActiveTab("security")} icon={Lock} label="الأمان والتنبيهات" />
      </div>

      {activeTab === "profile" && (
        <ProfileForm
          key={provider.updatedAt ?? "profile"}
          initialData={{
            businessName: provider.businessName ?? "",
            ownerName: provider.ownerName ?? "",
            email: provider.email ?? "",
            city: provider.city ?? "",
            address: provider.address ?? "",
            description: provider.description ?? "",
          }}
        />
      )}
      {activeTab === "documents" && (
        <DocumentsUploader
          key={documents.join("|")}
          registrationStatus={provider.registrationStatus ?? "pending"}
          rejectionReason={provider.rejectionReason ?? ""}
          initialDocuments={documents}
        />
      )}
      {activeTab === "security" && (
        <SecurityPreferences
          key={JSON.stringify(notifications)}
          phone={provider.phone ?? account.phoneNumber ?? ""}
          isVerified={Boolean(account.isVerified)}
          initialPreferences={notifications}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, attention = false }: { active: boolean; onClick: () => void; icon: typeof User; label: string; attention?: boolean }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold transition-colors",
        active
          ? "bg-primary/12 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span className="truncate">{label}</span>
      {attention && (
        <span className="absolute top-2 end-2 size-2 rounded-full bg-danger" title="يتطلّب انتباهك">
          <span className="sr-only">يتطلّب انتباهك</span>
        </span>
      )}
    </button>
  );
}
