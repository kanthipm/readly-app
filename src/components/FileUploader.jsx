import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maps, setMaps] = useState(null);
  const router = useRouter();

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
      <h1 className="text-2xl font-bold text-black mb-4">📄 Upload a PDF</h1>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4 text-black"
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
          {maps.map((map, i) => {
            let parsed;
            try {
              parsed = JSON.parse(map); // parses the JSON knowledge map
            } catch (e) {
              return <p className="text-red-500">Invalid map data</p>;
            }

            return (
              <div key={i} className="bg-white text-black p-4 rounded mb-6 shadow-md">
                <h3 className="text-2xl font-bold mb-4">{parsed.topic}</h3>
                <ul>
                  {parsed.subtopics.map((sub, idx) => (
                    <li
                      key={idx}
                      className="mb-4 border-b pb-2 cursor-pointer hover:bg-gray-100"
                      onClick={() =>
                        router.push(`/quiz?subtopic=${encodeURIComponent(sub.title)}&data=${encodeURIComponent(JSON.stringify(sub))}`)
                      }
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{sub.title}</span>
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${
                            sub.status === "mastered"
                              ? "bg-green-200 text-green-800"
                              : "bg-red-200 text-red-800"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
