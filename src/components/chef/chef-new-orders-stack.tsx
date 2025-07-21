"use client";

import { motion } from "framer-motion";
import { type Order } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Bell, ArrowDown } from "lucide-react";

interface ChefNewOrdersStackProps {
  orders: Order[];
  onClick: () => void;
}

export function ChefNewOrdersStack({ orders, onClick }: ChefNewOrdersStackProps) {
  const count = orders.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative cursor-pointer select-none"
      onClick={onClick}
    >
      {/* Create a visual stack effect */}
      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
        <Card
          key={i}
          className="absolute w-full h-full bg-card/80 border-2 border-red-500/50"
          style={{
            transform: `translate(${i * 4}px, ${i * 4}px) rotate(${i * 1.5}deg)`,
            zIndex: -i,
          }}
        />
      ))}

      <Card className="relative z-10 w-full bg-card border-2 border-red-500/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-6 text-center flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -15, 15, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 2, duration: 0.5 }}
          >
            <Bell className="h-10 w-10 text-red-500" />
          </motion.div>
          <div className="text-red-600 dark:text-red-400">
            <h3 className="font-headline text-2xl font-bold">
              {count} {count > 2 ? 'طلبات جديدة' : 'طلب جديد'}
            </h3>
            <p className="text-sm">بانتظار التأكيد</p>
          </div>
          <Button variant="default" size="lg" className="mt-2 w-full">
            <ArrowDown className="ml-2 h-5 w-5" />
            عرض الطلبات
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
