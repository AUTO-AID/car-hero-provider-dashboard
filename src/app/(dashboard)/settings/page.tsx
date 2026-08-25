"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { providerQueryKeys } from "@/application/services/prefetch";
import { ProviderProfile } from "@/domain/entities/provider.types";
import { getProviderProfile } from "@/infrastructure/services/profile.service";
import { ProfileForm } from "./components/profile-form";

/**
 * الملف الشخصي — وهو كلّ ما في هذه الصفحة.
 *
 * كانت ثلاثة تبويبات: الملف، والوثائق، والأمان والتنبيهات. حُذف الأخيران
 * بطلب صريح. أُزيل معهما استعلام `account` الذي لم يكن يخدم إلّا قسم الأمان،
 * وكانت الصفحة **تحجب نفسها كاملةً حتى يصل** — فينتظر المزوّد نداءً ثانياً
 * لا يرى من نتيجته شيئاً.
 */
export default function ProviderSettingsPage() {
  const profileQuery = useQuery({ queryKey: providerQueryKeys.profile, queryFn: getProviderProfile });

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <ErrorState
        title="تعذّر تحميل ملفّك"
        description="لم يستجب الخادم لطلب بيانات نشاطك."
        onRetry={() => void profileQuery.refetch()}
        isRetrying={profileQuery.isFetching}
      />
    );
  }

  const provider = (profileQuery.data ?? {}) as Partial<ProviderProfile>;

  return (
    <ProfileForm
      key={provider.updatedAt ?? "profile"}
      phone={provider.phone ?? ""}
      initialData={{
        businessName: provider.businessName ?? "",
        ownerName: provider.ownerName ?? "",
        email: provider.email ?? "",
        city: provider.city ?? "",
        address: provider.address ?? "",
        description: provider.description ?? "",
      }}
    />
  );
}
