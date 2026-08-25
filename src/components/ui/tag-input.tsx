"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  "aria-label"?: string;
  id?: string;
  maxTags?: number;
  maxLength?: number;
  className?: string;
}

/**
 * إدخال قائمة نصوص كرقائق — لمناطق التغطية.
 *
 * المنطقة الواحدة سطرٌ قصير يُضاف ويُحذف، لا نصّ حرّ مفصول بفواصل: الفاصلة
 * تترك للمزوّد أن يخطئ في الشكل («المزة, داريا ,صحنايا») ثم تُخزَّن المسافات
 * مع الأسماء فلا يطابقها بحث لاحق.
 */
export function TagInput({
  value,
  onChange,
  placeholder,
  id,
  maxTags = 20,
  maxLength = 60,
  className,
  ...props
}: TagInputProps) {
  const [draft, setDraft] = React.useState("");
  const atLimit = value.length >= maxTags;

  const add = () => {
    const tag = draft.trim();
    // التكرار يُمنع بلا رسالة خطأ: إضافة اسم موجود ليست خطأً يستحقّ تحذيراً،
    // والنتيجة المرئية (لا شيء يتغيّر) كافية.
    if (!tag || atLimit || value.some((item) => item === tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag.slice(0, maxLength)]);
    setDraft("");
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter يضيف ولا يُرسل النموذج: الحقل داخل <form>، وبدون المنع
            // كان الضغط عليه يحفظ الملف بدل أن يضيف المنطقة.
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={props["aria-label"]}
          maxLength={maxLength}
          disabled={atLimit}
          className="h-11"
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim() || atLimit}>
          <Plus aria-hidden /> إضافة
        </Button>
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== tag))}
                className="group inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 py-1.5 ps-3.5 pe-2.5 text-sm font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/20"
              >
                {tag}
                <X className="size-4 opacity-60 transition-opacity group-hover:opacity-100" aria-hidden />
                <span className="sr-only">إزالة {tag}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
