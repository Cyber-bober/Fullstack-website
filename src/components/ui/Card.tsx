import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function Card({ children, className, style }: CardProps) {
  return (
    <div className={`card ${className || ""}`} style={style}>
      {children}
    </div>
  );
}