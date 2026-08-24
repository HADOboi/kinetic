"use client";
import React from "react";
import NotFoundView from "../components/layout/NotFoundView";

export default function NotFoundPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  return <NotFoundView onNavigate={onNavigate} />;
}
