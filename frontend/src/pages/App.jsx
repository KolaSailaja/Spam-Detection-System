import { useState } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import api from "../utils/axiosInstance";
import "../App.css";
import FeatureImportance from "../components/FeatureImportance";
import History from "../components/History";
import FeedbackWidget from "../components/FeedbackWidget";

const THEMES = {
  ocean: {
    name: "🌊 Ocean",
    light: "bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-500",
    dark: "bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900",
    card: "bg-[#FAF1E6]/35",
    accent: "bg-indigo-500 hover:bg-indigo-600",
  },
  sunset: {
    name: "🌅 Sunset",
    light: "bg-gradient-to-br from-orange-400 via-pink-400 to-red-500",
    dark: "bg-gradient-to-br from-orange-900 via-pink-900 to-red-900",
    card: "bg-[#FFF5E6]/35",
    accent: "bg-orange-500 hover:bg-orange-600",
  },
  forest: {
    name: "🌿 Forest",
    light: "bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500",
    dark: "bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900",
    card: "bg-[#E6FAF1]/35",
    accent: "bg-green-600 hover:bg-green-700",
  },
  purple: {
    name: "💜 Purple",
    light: "bg-gradient-to-br from-purple-500 via-violet-400 to-pink-500",
    dark: "bg-gradient-to-br from-purple-900 via-violet-900 to-pink-900",
    card: "bg-[#F5E6FA]/35",
    accent: "bg-purple-600 hover:bg-purple-700",
  },
  mono: {
    name: "🖤 Mono",
    light: "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500",
    dark: "bg-gradient-to-br from-gray-900 via-gray-800 to-black",
    card: "bg-white/35",
    accent: "bg-gray-700 hover:bg-gray-800",
  },
};

function SpamDetector() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("message");
  const [darkMode, setDarkMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [theme, setTheme] = useState("ocean");
  const [showThemes, setShowThemes] = useState(false);
  const { user, logout } = useAuth();

  const currentTheme = THEMES[theme];

  const handlePredict = async () => {
    if (!text) return;
    try {
      setLoading(true);
      const res = await api.post(`${import.meta.env.VITE_API_URI}/predict`, {
        text: text,
        type: type,
      });
      setResult(res.data.prediction);
      setConfidence(res.data.confidence ?? null);
    } catch (error) {
      setResult("Error");
    } finally {
      setLoading(false);
    }
  };

  const getColor = () => {
    if (result === "ham" || result === "safe") return "text-green-600";
    if (result === "spam" || result === "malicious") return "text-red-600";
    if (result === "smishing") return "text-orange-500";
    return "text-gray-600";
  };

  const getBg = () => {
    if (result === "ham" || result === "safe") return "bg-[#81912F]/25 backdrop-blur-md border border-white/30";
    if (result === "spam" || result === "malicious") return "bg-red-400/20 backdrop-blur-md border border-white/30";
    if (result === "smishing") return "bg-orange-400/20 backdrop-blur-md border border-white/30";
    return "bg-white/20 backdrop-blur-md border border-white/30";
  };

  const confidencePct = confidence !== null ? Math.min(confidence * 50 + 50, 100).toFixed(1) : "0.0";

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-all duration-500 ${darkMode ? currentTheme.dark : currentTheme.light}`}>
      
      {/* Top controls (Theme/User/History) kept as per your logic */}
      <div className="absolute top-4 right-4 flex gap-2 flex-wrap justify-end">
        <button onClick={() => setShowThemes(!showThemes)} className={`px-4 py-2 rounded-xl font-semibold ${darkMode ? "bg-gray-700 text-white" : "bg-white/30"}`}>🎨 Theme</button>
      </div>

      <div className="absolute top-4 left-4">
        <button onClick={() => setShowHistory(!showHistory)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">📜 History</button>
      </div>

      {showHistory && (
        <div className={`fixed top-0 left-0 h-full w-80 overflow-y-auto p-4 z-50 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
          <button onClick={() => setShowHistory(false)}>✕</button>
          <History darkMode={darkMode} />
        </div>
      )}

      {/* Main Card */}
      <div className={`w-full max-w-lg backdrop-blur-xl border rounded-3xl p-6 text-center ${darkMode ? "bg-gray-900/40 border-gray-600" : "bg-white/20 border-white/20"}`}>
        <div className={`w-full max-w-md rounded-2xl p-6 mx-auto ${darkMode ? "bg-gray-800/70" : `${currentTheme.card}`}`}>
          <h1 className="text-3xl font-bold mb-2">📨 Spam Detector</h1>
          
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-3 rounded-xl border mb-4">
            <option value="message">Message</option>
            <option value="email">Email</option>
            <option value="url">URL</option>
          </select>

          <textarea className="w-full border p-3 rounded-xl resize-none" rows="4" value={text} onChange={(e) => setText(e.target.value)} />

          <button onClick={handlePredict} className={`mt-4 w-full py-3 rounded-xl ${currentTheme.accent}`}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>

          {/* Fixed Result Display Section */}
          {result && (
            <div className="mt-4">
              <div className={`p-4 rounded-xl font-semibold ${getBg()} ${getColor()}`}>
                {result === "ham" && "✅ Safe Message"}
                {result === "spam" && "🚫 Spam Detected"}
                {result === "smishing" && "⚠️ Fraud Alert"}
                {result === "safe" && "✅ Safe URL"}
                {result === "malicious" && "🚨 Malicious URL"}
                {result === "Error" && "⚠️ Something went wrong"}
              </div>

              {result !== "Error" && confidence !== null && (
                <div className="mt-3 text-left">
                  <p className="text-xs font-medium mb-1">Model Confidence: {confidencePct}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${confidencePct}%` }} />
                  </div>
                </div>
              )}

              {result !== "Error" && type !== "url" && (
                <FeedbackWidget text={text} predictedLabel={result} darkMode={darkMode} />
              )}
            </div>
          )}

          <button onClick={() => { setText(""); setResult(""); }} className="mt-4 w-full py-3 rounded-xl bg-gray-500 text-white">Reset</button>
          <FeatureImportance darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}
export default SpamDetector;


