"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface AddServiceFormProps {
  onAdd: (serviceName: string) => void;
  isPending: boolean;
}

export function AddServiceForm({ onAdd, isPending }: AddServiceFormProps) {
  const [newService, setNewService] = useState("");

  const handleSubmit = () => {
    const trimmed = newService.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewService("");
  };

  return (
    <div className="flex gap-3">
      <Input
        placeholder="مثال: غسيل سيارة VIP"
        value={newService}
        onChange={(e) => setNewService(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="dark-input h-12 rounded-xl flex-1"
      />
      <Button
        onClick={handleSubmit}
        disabled={isPending || !newService.trim()}
        className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/85 text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-100 transition-all gap-2"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        إضافة
      </Button>
    </div>
  );
}
