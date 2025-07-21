"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-md p-1 bg-muted/60">
      <Button
        variant={language === 'ar' ? 'ghost' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('ar')}
        className={cn(
          "h-6 px-2 text-xs",
          language === 'ar' && "bg-background shadow-sm"
        )}
      >
        ع
      </Button>
      <Button
        variant={language === 'en' ? 'ghost' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className={cn(
          "h-6 px-2 text-xs",
          language === 'en' && "bg-background shadow-sm"
        )}
      >
        EN
      </Button>
    </div>
  );
}
