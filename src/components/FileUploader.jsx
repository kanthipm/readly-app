import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";


export default function FileUploader() {
  const hasUpdatedRef = useRef(false);
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState("");
  const [inputMode, setInputMode] = useState("file");
  const [loading, setLoading] = useState(false);
  const [allMaps, setAllMaps] = useState([]); // Array of {id, title, maps, createdAt}
  const [activeMapId, setActiveMapId] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState("add"); // add | configure
  const [editText, setEditText] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [configPrompt, setConfigPrompt] = useState("");
  const [instructions, setInstructions] = useState(""); // For initial upload
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasAppliedUpdate = useRef(false);

  // Generate unique ID for new maps
  const generateMapId = () => {
    return `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  useEffect(() => {
    const stored = localStorage.getItem("knowledgeMaps");
    if (stored) {
      const mapsData = JSON.parse(stored);
      // If we have old format, convert to new format
      if (Array.isArray(mapsData) && mapsData.length > 0 && typeof mapsData[0] === 'string') {
        // Old format - convert to new format
        const newMap = {
          id: generateMapId(),
          title: "Knowledge Map 1",
          maps: mapsData,
          createdAt: new Date().toISOString()
        };
        setAllMaps([newMap]);
        setActiveMapId(newMap.id);
      } else if (Array.isArray(mapsData) && mapsData.length > 0) {
        setAllMaps(mapsData);
        if (mapsData.length > 0) {
          setActiveMapId(mapsData[0].id);
        }
      }
    }
  }, []);

  useEffect(() => {
    const updatedParam = searchParams.get("updated");

    if (updatedParam && !hasAppliedUpdate.current) {
      try {
        const updatedSubtopic = JSON.parse(updatedParam);

        const accuracy = updatedSubtopic.answered
          ? (updatedSubtopic.correct || 0) / updatedSubtopic.answered
          : 0;
        updatedSubtopic.status = accuracy >= 0.8 ? "mastered" : "unmastered";

        const updatedAllMaps = allMaps.map((mapGroup) => {
          const updatedMaps = mapGroup.maps.map((mapStr) => {
          let map;
          try {
            map = JSON.parse(mapStr);
          } catch {
            return mapStr;
          }

          map.subtopics = map.subtopics.map((sub) =>
            sub.title === updatedSubtopic.title ? updatedSubtopic : sub
          );

          return JSON.stringify(map);
        });

          return { ...mapGroup, maps: updatedMaps };
        });

        setAllMaps(updatedAllMaps);
        localStorage.setItem("knowledgeMaps", JSON.stringify(updatedAllMaps));
        hasAppliedUpdate.current = true;
      } catch (err) {
        console.error("Failed to update subtopic", err);
      }
    }
  }, [searchParams, allMaps]);

  const handleUpload = async () => {
    if (inputMode === "file" && !file) return;
    if (inputMode === "text" && !textContent.trim()) return;

    setLoading(true);

    try {
      let res;
      
      if (inputMode === "file") {
        const formData = new FormData();
        formData.append("file", file);
        if (instructions.trim()) {
          formData.append("instructions", instructions);
        }
        
        res = await fetch("http://localhost:5000/api/v1/upload", {
        method: "POST",
        body: formData,
      });
      } else {
        const content = instructions.trim() 
          ? `Instructions: ${instructions}\n\n${textContent}`
          : textContent;
        res = await fetch("http://localhost:5000/api/v1/process-text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        });
      }

      const data = await res.json();
      
      // Create new map group
      const newMapGroup = {
        id: generateMapId(),
        title: inputMode === "file" ? file.name.replace('.pdf', '') : 'Text Content',
        maps: data.maps,
        createdAt: new Date().toISOString()
      };

      const updatedAllMaps = [...allMaps, newMapGroup];
      setAllMaps(updatedAllMaps);
      setActiveMapId(newMapGroup.id);
      localStorage.setItem("knowledgeMaps", JSON.stringify(updatedAllMaps));

      // Clear inputs
      setFile(null);
      setTextContent("");
      setInstructions("");
    } catch (err) {
      console.error("Processing failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditApply = async () => {
    if (!activeMap) return;
    setLoading(true);
    try {
      let res;
      if (editMode === 'add') {
        if (editFile) {
          const formData = new FormData();
          formData.append('file', editFile);
          res = await fetch('http://localhost:5000/api/v1/upload', { method: 'POST', body: formData });
        } else if (editText.trim()) {
          const payload = { content: (configPrompt ? `Instructions: ${configPrompt}\n\n` : '') + editText };
          res = await fetch('http://localhost:5000/api/v1/process-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
          return;
        }

        const data = await res.json();
        const merged = mergeKnowledgeMaps(activeMap.maps, data.maps || []);
        const updatedAll = allMaps.map(m => m.id === activeMap.id ? { ...m, maps: merged } : m);
        setAllMaps(updatedAll);
        localStorage.setItem('knowledgeMaps', JSON.stringify(updatedAll));
      } else {
        // configure mode: apply prompt-only transformation to keep API contract simple
        if (!configPrompt.trim()) return;
        const payload = { content: `Modify structure with these instructions while preserving progress: ${configPrompt}` };
        res = await fetch('http://localhost:5000/api/v1/process-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        const merged = mergeKnowledgeMaps(activeMap.maps, data.maps || []);
        const updatedAll = allMaps.map(m => m.id === activeMap.id ? { ...m, maps: merged } : m);
        setAllMaps(updatedAll);
        localStorage.setItem('knowledgeMaps', JSON.stringify(updatedAll));
      }
      setIsEditModalOpen(false);
      setEditText('');
      setEditFile(null);
      setConfigPrompt('');
    } catch (e) {
      console.error('Edit apply failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMap = (mapId) => {
    const updatedMaps = allMaps.filter(m => m.id !== mapId);
    setAllMaps(updatedMaps);
    localStorage.setItem("knowledgeMaps", JSON.stringify(updatedMaps));
    if (updatedMaps.length > 0) {
      setActiveMapId(updatedMaps[0].id);
    } else {
      setActiveMapId(null);
    }
  };

  const startEditingTitle = (mapId, currentTitle) => {
    setEditingTitle(true);
    setEditingTitleId(mapId);
    setNewTitle(currentTitle);
  };

  const saveTitle = (mapId) => {
    const updatedMaps = allMaps.map(m => 
      m.id === mapId ? { ...m, title: newTitle } : m
    );
    setAllMaps(updatedMaps);
    localStorage.setItem("knowledgeMaps", JSON.stringify(updatedMaps));
    setEditingTitle(false);
    setEditingTitleId(null);
    setNewTitle("");
  };

  const cancelEditingTitle = () => {
    setEditingTitle(false);
    setEditingTitleId(null);
    setNewTitle("");
  };

  const activeMap = allMaps.find(m => m.id === activeMapId);

  const mergeKnowledgeMaps = (existingMaps, incomingMaps) => {
    // existingMaps, incomingMaps are arrays of JSON strings
    const parseSafe = (s) => { try { return JSON.parse(s); } catch { return null; } };
    const existingParsed = existingMaps.map(parseSafe).filter(Boolean);
    const incomingParsed = incomingMaps.map(parseSafe).filter(Boolean);

    // Merge by subtopic title within the first map (assumes single-topic maps)
    const result = existingParsed.length ? existingParsed[0] : (incomingParsed[0] || null);
    if (!result) return existingMaps; // fallback

    const titleToSub = new Map();
    (result.subtopics || []).forEach((sub) => {
      titleToSub.set(sub.title, sub);
    });

    // Preserve progress fields if present
    const preserveProgress = (oldSub, newSub) => {
      const preserved = { ...newSub };
      if (oldSub) {
        if (typeof oldSub.answered !== "undefined") preserved.answered = oldSub.answered;
        if (typeof oldSub.correct !== "undefined") preserved.correct = oldSub.correct;
        if (typeof oldSub.status !== "undefined") preserved.status = oldSub.status;
      }
      return preserved;
    };

    // Merge incoming
    incomingParsed.forEach((inc) => {
      (inc.subtopics || []).forEach((incSub) => {
        const existing = titleToSub.get(incSub.title);
        if (existing) {
          // Merge fields; append quizzes
          const merged = preserveProgress(existing, {
            ...existing,
            description: incSub.description || existing.description,
            key_concepts: Array.from(new Set([...(existing.key_concepts || []), ...(incSub.key_concepts || [])])),
            quiz: [...(existing.quiz || []), ...(incSub.quiz || [])],
          });
          titleToSub.set(incSub.title, merged);
        } else {
          titleToSub.set(incSub.title, preserveProgress(null, { ...incSub }));
        }
      });
    });

    const mergedMap = {
      topic: result.topic,
      subtopics: Array.from(titleToSub.values()),
    };

    return [JSON.stringify(mergedMap)];
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8" style={{ color: '#111827' }}>
          Create Knowledge Map
        </h1>

        {/* Input Mode Toggle */}
        <div className="mb-8">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setInputMode("file")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                inputMode === "file"
                  ? "text-white shadow-lg"
                  : "hover:opacity-80"
              }`}
                    style={{
                      backgroundColor: inputMode === "file" ? '#6366f1' : 'white',
                      color: inputMode === "file" ? 'white' : '#6b7280',
                      border: inputMode === "file" ? 'none' : '2px solid #e5e7eb'
                    }}
            >
              Upload PDF
            </button>
            <button
              onClick={() => setInputMode("text")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                inputMode === "text"
                  ? "text-white shadow-lg"
                  : "hover:opacity-80"
              }`}
                    style={{
                      backgroundColor: inputMode === "text" ? '#6366f1' : 'white',
                      color: inputMode === "text" ? 'white' : '#6b7280',
                      border: inputMode === "text" ? 'none' : '2px solid #e5e7eb'
                    }}
            >
              Paste Text
            </button>
          </div>

          {/* File Upload Input */}
          {inputMode === "file" && (
            <div className="p-6 rounded-lg" style={{ backgroundColor: '#ffffff', border: '2px dashed #d1d5db' }}>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm"
                style={{ color: '#1f2937' }}
              />
              {file && (
                <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#f3f4f6' }}>
                  <p className="text-sm font-medium" style={{ color: '#1f2937' }}>
                    Selected: {file.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          {inputMode === "text" && (
            <div>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste your educational content here..."
                className="w-full h-64 p-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e5e7eb',
                  color: '#1f2937',
                }}
              />
              <div className="mt-3 flex justify-between text-sm" style={{ color: '#6b7280' }}>
                <span>Characters: {textContent.length}</span>
                <span>Words: {textContent.split(/\s+/).filter(word => word.length > 0).length}</span>
              </div>
            </div>
          )}

          {/* Optional Instructions Field */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optional Instructions
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., focus on chapter 3 only; add more math questions; create 5 subtopics"
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              style={{
                backgroundColor: '#ffffff',
                color: '#1f2937',
              }}
            />
            <p className="mt-2 text-xs text-gray-500">
              Provide guidance on how to structure or focus the knowledge map generation
            </p>
          </div>
        </div>

      <button
        onClick={handleUpload}
          disabled={loading || (inputMode === "file" && !file) || (inputMode === "text" && !textContent.trim())}
          className="px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: loading ? '#9ca3af' : '#6366f1',
            color: 'white',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.2)'
          }}
        >
          {loading ? "Processing..." : inputMode === "file" ? "Upload & Generate Map" : "Generate Knowledge Map"}
      </button>

        {/* Tabs for Multiple Knowledge Maps */}
        {allMaps.length > 0 && (
          <div className="mt-12">
            <div className="flex flex-wrap gap-0 mb-6 border-b border-gray-200">
              {allMaps.map((m) => (
                <button
                  key={m.id}
                  onContextMenu={(e) => { e.preventDefault(); startEditingTitle(m.id, m.title); }}
                  onClick={() => setActiveMapId(m.id)}
                  className={`px-4 py-2 text-sm font-medium -mb-px border border-b-0 ${
                    activeMapId === m.id
                      ? 'bg-white text-gray-900 border-gray-200'
                      : 'bg-gray-50 text-gray-600 border-transparent hover:bg-white hover:text-gray-900'
                  }`}
                  style={{ borderTopLeftRadius: '0.375rem', borderTopRightRadius: '0.375rem' }}
                  title="Right click to rename"
                >
                  {editingTitle && editingTitleId === m.id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle(m.id);
                        if (e.key === 'Escape') cancelEditingTitle();
                      }}
                      className="px-2 py-1 rounded text-sm border border-gray-300"
                      style={{ color: '#1f2937', backgroundColor: 'white' }}
                      autoFocus
                    />
                  ) : (
                    <span>{m.title}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Display Active Map */}
            {activeMap && (
              <div>
                {activeMap.maps.map((map, i) => {
            let parsed;
            try {
                    parsed = JSON.parse(map);
            } catch (e) {
                    return (
                      <div key={i} className="p-4 rounded-lg mb-6 bg-gray-100">
                        <p className="text-sm font-medium text-gray-700">
                          Invalid map data
                        </p>
                      </div>
                    );
            }

            return (
                    <div key={i} className="mb-8 p-6 rounded-lg shadow-lg bg-white border border-gray-200">
                      <h3 className="text-2xl font-bold mb-6 text-gray-900">
                        {parsed.topic}
                      </h3>
                      <div className="space-y-4">
                        {parsed.subtopics.map((sub, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md bg-white border border-gray-200"
                            style={{ 
                              borderLeft: '4px solid #6366f1'
                            }}
                        onClick={() => {
                          console.log("Subtopic on click:", sub);
                          router.push(`/quiz?subtopic=${encodeURIComponent(sub.title)}&data=${encodeURIComponent(JSON.stringify(sub))}`);
                        }}
                      >
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {sub.title}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                sub.status === "mastered" ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {sub.status}
                              </span>
                            </div>

                            <p className="text-sm mb-3 text-gray-600">
                              {sub.description}
                            </p>

                            <div className="mb-3">
                              <p className="text-xs font-medium mb-2 text-gray-500">
                                Key Concepts:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {sub.key_concepts.map((concept, conceptIdx) => (
                                  <span
                                    key={conceptIdx}
                                    className="px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700"
                                  >
                                    {concept}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-600">
                                Mastery: {sub.answered ? `${Math.round((sub.correct || 0) / sub.answered * 100)}%` : "0%"}
                              </div>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all duration-300 bg-indigo-600"
                                  style={{
                                    width: `${sub.answered ? ((sub.correct || 0) / sub.answered) * 100 : 0}%`,
                                  }}
                                ></div>
                        </div>
                            </div>
                          </div>
                        ))}
                      </div>
              </div>
            );
          })}

                {/* Bottom actions: Edit (append) / Delete */}
                <div className="mt-8 flex items-center gap-3">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Edit knowledge map
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Delete this knowledge map?')) handleDeleteMap(activeMap.id);
                    }}
                    className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
        </div>
      )}
          </div>
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit knowledge map</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>

              <div className="mb-4 flex gap-2">
                <button
                  className={`px-3 py-2 rounded ${editMode === 'add' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setEditMode('add')}
                >
                  Add content
                </button>
                <button
                  className={`px-3 py-2 rounded ${editMode === 'configure' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setEditMode('configure')}
                >
                  Configure map
                </button>
              </div>

              {editMode === 'add' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload additional PDF (optional)</label>
                    <input type="file" accept=".pdf" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
                    {editFile && (
                      <p className="text-xs text-gray-500 mt-1">Selected: {editFile.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Or paste additional text</label>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full h-36 p-3 border border-gray-300 rounded"
                      placeholder="Paste more content to extend this knowledge map"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Optional instructions</label>
                    <input
                      type="text"
                      value={configPrompt}
                      onChange={(e) => setConfigPrompt(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="e.g., focus on chapter 3 only; add more math questions"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">Provide instructions to reorganize or enrich the current knowledge map. Existing progress will be preserved where subtopics are unchanged.</p>
                  <textarea
                    value={configPrompt}
                    onChange={(e) => setConfigPrompt(e.target.value)}
                    className="w-full h-40 p-3 border border-gray-300 rounded"
                    placeholder="e.g., regroup subtopics by difficulty; add 5 advanced questions to Algebra; mark vocabulary subtopics as unmastered"
                  />
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</button>
                <button onClick={handleEditApply} className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Apply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Edit Modal Component (inline)
// Placed at the end for simplicity; using portal is optional