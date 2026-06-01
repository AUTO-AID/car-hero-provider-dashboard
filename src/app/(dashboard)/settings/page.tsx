"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, FileText, Lock, RefreshCw, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { providerQueryKeys } from "@/application/services/prefetch";
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <Settings className="w-7 h-7 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">جاري تحميل إعدادات الحساب...</p>
      </div>
    );
  }

  if (profileQuery.isError || accountQuery.isError) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <div>
          <h1 className="text-lg font-bold">تعذر تحميل إعدادات الحساب</h1>
          <p className="text-xs text-muted-foreground mt-1">تحقق من الاتصال ثم أعد المحاولة.</p>
        </div>
        <Button onClick={() => { void profileQuery.refetch(); void accountQuery.refetch(); }} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const provider = profileQuery.data ?? {};
  const account = accountQuery.data ?? {};
  const documents = Array.isArray(provider.documents) ? provider.documents : [];
  const notifications = account.preferences?.notifications ?? { push: true, sms: true, email: false };

  return (
    <div className="space-y-7 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight">إعدادات الحساب</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة الملف التجاري والوثائق وتفضيلات الأمان</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/10 border border-border/20 rounded-lg" role="tablist" aria-label="أقسام الإعدادات">
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
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`relative flex items-center justify-center gap-2 min-h-10 px-2 rounded-md text-xs font-bold transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"}`}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {attention && <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-rose-400" aria-label="يتطلب الانتباه" />}
    </button>
  );
}
