"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProviderProfile } from "@/infrastructure/services/profile.service";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Settings, User, FileText, Lock } from "lucide-react";
import { ProfileForm } from "./components/profile-form";
import { DocumentsUploader } from "./components/documents-uploader";
import { SecurityPreferences } from "./components/security-preferences";

export default function ProviderSettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "documents" | "security">("profile");

  const { data: profileData, isLoading } = useQuery({
    queryKey: providerQueryKeys.profile,
    queryFn: getProviderProfile,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary/60 animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          جاري تحميل الإعدادات والوثائق...
        </p>
      </div>
    );
  }

  const provider = profileData?.data ?? profileData ?? {};
  
  const profileInitialData = {
    businessName: provider.businessName || "",
    ownerName: provider.ownerName || "",
    email: provider.email || "",
    address: provider.address || "",
    city: provider.city || "",
  };

  const registrationStatus = provider.registrationStatus || "pending";
  const rejectionReason = provider.rejectionReason || "";
  const initialDocuments = provider.documents || [];
  const phone = provider.phone || "";

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gradient tracking-tight">
              إعدادات الحساب
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              إدارة معلومات الملف الشخصي، الأوراق الرسمية، والأمان
            </p>
          </div>
        </div>
      </div>

      {/* ─── Premium Sliding Tabs ─── */}
      <div className="flex border-b border-border/20 gap-2 p-1 bg-secondary/5 backdrop-blur-md rounded-xl max-w-lg">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg transition-all ${
            activeTab === "profile"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/10"
          }`}
        >
          <User className="w-4 h-4" />
          الملف الشخصي
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg transition-all relative ${
            activeTab === "documents"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/10"
          }`}
        >
          <FileText className="w-4 h-4" />
          الوثائق والتوثيق
          {initialDocuments.length === 0 && (
            <span className="absolute top-1 left-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg transition-all ${
            activeTab === "security"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/10"
          }`}
        >
          <Lock className="w-4 h-4" />
          الأمان والتنبيهات
        </button>
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === "profile" && (
        <ProfileForm initialData={profileInitialData} />
      )}

      {activeTab === "documents" && (
        <DocumentsUploader
          registrationStatus={registrationStatus}
          rejectionReason={rejectionReason}
          initialDocuments={initialDocuments}
        />
      )}

      {activeTab === "security" && (
        <SecurityPreferences phone={phone} />
      )}
    </div>
  );
}

