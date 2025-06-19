import { useState } from "react";

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maps, setMaps] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setMaps(data.maps);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📄 Upload a PDF</h1>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Uploading..." : "Upload & Generate Map"}
      </button>

      {maps && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">📚 Knowledge Map</h2>
          {maps.map((map, i) => (
            <pre
              key={i}
              className="bg-gray-100 p-4 rounded mb-4 overflow-auto text-sm whitespace-pre-wrap"
            >
              {map}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}
