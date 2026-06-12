//src/components/ui/Card.tsx

import React from "react";
import { CardProps } from "@/types/Card";

export default function Card({ children, className, style }: CardProps) {
  return (
    <div className={`card ${className || ""}`} style={style}>
      {children}
    </div>
  );
}