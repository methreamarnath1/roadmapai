import React, { useState, useEffect } from 'react';
import { Send, BookOpen, Target, Map, ChevronRight, Award, Clock, Brain, Rocket, ExternalLink, Save, Download, Moon, Sun } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface RoadmapStep {
  title: string;
  description: string;
  resources: Array<{
    title: string;
    url: string;
  }>;
  timeframe: string;
  skills: string[];
}

interface UserPreferences {
  goal: string;
  timeframe: string;
  experience: string;
  dedication: string;
}

interface SavedRoadmap {
  preferences: UserPreferences;
  steps: RoadmapStep[];
  createdAt: string;
}

function App() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('lastPreferences');
    return saved ? JSON.parse(saved) : {
      goal: '',
      timeframe: '6 months',
      experience: 'beginner',
      dedication: '10 hours/week',
    };
  });

  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [showApiInput, setShowApiInput] = useState(!localStorage.getItem('geminiApiKey'));
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>(() => {
    const saved = localStorage.getItem('savedRoadmaps');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const generatePrompt = (prefs: UserPreferences) => {
    return `Create a detailed learning roadmap for someone who wants to ${prefs.goal}. 
    They have ${prefs.experience} experience level and can dedicate ${prefs.dedication} to learning. 
    They want to achieve their goal in ${prefs.timeframe}.
    
    Format the response as a JSON array with exactly 3-4 steps. Each step should have:
    - title: short name for the phase
    - description: detailed explanation
    - resources: array of objects with {title: string, url: string} for specific learning resources with real, working URLs
    - timeframe: estimated time for this step
    - skills: array of key skills to master
    
    Make it realistic and actionable within their timeframe. Ensure all resource URLs are real and accessible.`;
  };

  const saveRoadmap = () => {
    if (roadmap.length === 0) return;

    const newSavedRoadmap: SavedRoadmap = {
      preferences,
      steps: roadmap,
      createdAt: new Date().toISOString(),
    };

    const updatedRoadmaps = [...savedRoadmaps, newSavedRoadmap];
    setSavedRoadmaps(updatedRoadmaps);
    localStorage.setItem('savedRoadmaps', JSON.stringify(updatedRoadmaps));
  };

  const loadRoadmap = (saved: SavedRoadmap) => {
    setPreferences(saved.preferences);
    setRoadmap(saved.steps);
  };

  const generateRoadmap = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Gemini API key');
      return;
    }

    if (!preferences.goal.trim()) {
      setError('Please enter your learning goal');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = generatePrompt(preferences);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const parsedRoadmap = JSON.parse(jsonMatch[0]);
      setRoadmap(parsedRoadmap);
      
      // Save preferences and API key
      localStorage.setItem('lastPreferences', JSON.stringify(preferences));
      localStorage.setItem('geminiApiKey', apiKey);
    } catch (err) {
      setError('Failed to generate roadmap. Please check your API key and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openGeminiConsole = () => {
    window.open('https://makersuite.google.com/app/apikey', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isDarkMode ? <Sun className="text-white" /> : <Moon className="text-gray-800" />}
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
              AI Roadmap Creator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Let AI create your personalized learning journey
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {showApiInput ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Setup</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <button
                  onClick={openGeminiConsole}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors mb-2"
                >
                  Get API Key <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => setShowApiInput(false)}
                  disabled={!apiKey.trim()}
                  className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 dark:disabled:bg-blue-800"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    What's your learning goal?
                  </label>
                  <input
                    type="text"
                    value={preferences.goal}
                    onChange={(e) => setPreferences({ ...preferences, goal: e.target.value })}
                    placeholder="e.g., Become a full-stack developer..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timeframe
                    </label>
                    <select
                      value={preferences.timeframe}
                      onChange={(e) => setPreferences({ ...preferences, timeframe: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="3 months">3 months</option>
                      <option value="6 months">6 months</option>
                      <option value="1 year">1 year</option>
                      <option value="2 years">2 years</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Experience Level
                    </label>
                    <select
                      value={preferences.experience}
                      onChange={(e) => setPreferences({ ...preferences, experience: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Weekly Dedication
                    </label>
                    <select
                      value={preferences.dedication}
                      onChange={(e) => setPreferences({ ...preferences, dedication: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="5 hours/week">5 hours/week</option>
                      <option value="10 hours/week">10 hours/week</option>
                      <option value="20 hours/week">20 hours/week</option>
                      <option value="40 hours/week">40 hours/week</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={generateRoadmap}
                    disabled={!preferences.goal.trim() || loading}
                    className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 dark:disabled:bg-blue-800 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Roadmap
                        <Rocket size={18} />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowApiInput(true)}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    API Key
                  </button>
                </div>

                {error && (
                  <div className="text-red-500 dark:text-red-400 text-sm mt-2">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {roadmap.length > 0 && !loading && (
            <>
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={saveRoadmap}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save size={16} />
                  Save Roadmap
                </button>
              </div>

              <div className="space-y-6">
                {roadmap.map((step, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 transition-transform hover:scale-[1.02]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                        {index === 0 ? (
                          <Target className="text-blue-600 dark:text-blue-400" />
                        ) : index === roadmap.length - 1 ? (
                          <Award className="text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Map className="text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                            {step.title}
                          </h3>
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <Clock size={16} className="mr-1" />
                            {step.timeframe}
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{step.description}</p>
                        
                        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <BookOpen size={18} />
                            Recommended Resources:
                          </h4>
                          <ul className="space-y-2">
                            {step.resources.map((resource, idx) => (
                              <li
                                key={idx}
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                              >
                                <ChevronRight size={16} className="text-blue-500" />
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  {resource.title}
                                  <ExternalLink size={14} />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {step.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {savedRoadmaps.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Saved Roadmaps</h2>
              <div className="space-y-4">
                {savedRoadmaps.map((saved, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">{saved.preferences.goal}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created: {new Date(saved.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => loadRoadmap(saved)}
                      className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

 
