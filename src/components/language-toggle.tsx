"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  return (
    <div className="flex items-center gap-1 rounded-md p-1 bg-muted/60">
      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs bg-background shadow-sm">
        ع
      </Button>
      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
        EN
      </Button>
    </div>
  );
}
