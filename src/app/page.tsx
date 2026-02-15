"use client";

import { Suspense } from "react";
import FileUploader from "@/components/FileUploader";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Readly
          </h1>
          <p className="text-xl text-gray-600">
            Transform your content into interactive knowledge maps
          </p>
        </div>
        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <FileUploader />
        </Suspense>
      </div>
    </main>
  );
}
