"use client";

import FileUploader from "@/src/components/FileUploader";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">📄 Upload PDF to Generate Knowledge Map</h1>
      <FileUploader />
    </main>
  );
}
