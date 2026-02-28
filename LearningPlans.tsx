import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ChevronDown, ChevronUp, CheckCircle2, Play, Timer, HelpCircle, X, Sparkles, MessageSquare, Send, FileText, ExternalLink } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Module {
  id: number;
  title: string;
  content: string;
  pdf_url?: string;
  resource_link?: string;
  completed: boolean;
  order_index: number;
}

interface LearningPath {
  id: number;
  title: string;
  is_industrial: boolean;
}

export default function LearningPlans({ user }: { user: any }) {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [isAddingPath, setIsAddingPath] = useState(false);
  const [newPathTitle, setNewPathTitle] = useState('');
  const [isIndustrial, setIsIndustrial] = useState(false);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleContent, setNewModuleContent] = useState('');
  const [newModulePdf, setNewModulePdf] = useState('');
  const [newModuleResourceLink, setNewModuleResourceLink] = useState('');
  
  // AI Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // AI Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Quiz State
  const [activeQuizModule, setActiveQuizModule] = useState<number | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isQuizGeneratorOpen, setIsQuizGeneratorOpen] = useState(false);
  const [quizTopic, setQuizTopic] = useState('');
  const [isGeneratingTopicQuiz, setIsGeneratingTopicQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);

  useEffect(() => {
    fetchPaths();
  }, [user.id]);

  useEffect(() => {
    if (selectedPath) fetchModules(selectedPath.id);
  }, [selectedPath]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      alert(isBreak ? 'Break finished! Time to study.' : 'Study session finished! Take a break.');
      setTimeLeft(isBreak ? 25 * 60 : 5 * 60);
      setIsBreak(!isBreak);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const fetchPaths = async () => {
    const res = await fetch(`/api/learning-paths/${user.id}`);
    const data = await res.json();
    setPaths(data);
    if (data.length > 0 && !selectedPath) setSelectedPath(data[0]);
  };

  const fetchModules = async (pathId: number) => {
    const res = await fetch(`/api/modules/${pathId}?userId=${user.id}`);
    const data = await res.json();
    setModules(data);
  };

  const handleAddPath = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/learning-paths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, title: newPathTitle, isIndustrial }),
    });
    if (res.ok) {
      const newPath = await res.json();
      setPaths([...paths, newPath]);
      setSelectedPath(newPath);
      setIsAddingPath(false);
      setNewPathTitle('');
      setIsIndustrial(false);
      logHistory(`Created new learning path: ${newPathTitle}`);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a structured learning plan for: ${aiPrompt}. 
        Return a JSON object with a 'title' and an array of 'modules'. 
        Each module should have a 'title', a 'summary' (around 100 words), and an 'orderIndex'.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              modules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    orderIndex: { type: Type.INTEGER }
                  },
                  required: ["title", "summary", "orderIndex"]
                }
              }
            },
            required: ["title", "modules"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      // Create Path
      const pathRes = await fetch('/api/learning-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, title: data.title, isIndustrial: false }),
      });
      const newPath = await pathRes.json();
      
      // Create Modules
      for (const mod of data.modules) {
        await fetch('/api/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pathId: newPath.id, 
            title: mod.title, 
            content: mod.summary,
            orderIndex: mod.orderIndex 
          }),
        });
      }
      
      fetchPaths();
      setIsAddingPath(false);
      setAiPrompt('');
      logHistory(`AI generated learning path: ${data.title}`);
    } catch (err) {
      console.error('AI Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddModule = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPath) return;
    const res = await fetch('/api/modules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        pathId: selectedPath.id, 
        title: newModuleTitle, 
        content: newModuleContent,
        pdfUrl: newModulePdf,
        resourceLink: newModuleResourceLink,
        orderIndex: modules.length 
      }),
    });
    if (res.ok) {
      fetchModules(selectedPath.id);
      setIsAddingModule(false);
      setNewModuleTitle('');
      setNewModuleContent('');
      setNewModulePdf('');
      setNewModuleResourceLink('');
      logHistory(`Added module: ${newModuleTitle} to ${selectedPath.title}`);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput) return;
    const newMessages = [...chatMessages, { role: 'user' as const, text: userInput }];
    setChatMessages(newMessages);
    setUserInput('');
    setIsTyping(true);

    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are an AI Study Assistant for the AI Curriculum Planner app. Help students clarify their doubts about their learning paths and modules. Be concise and encouraging.",
        },
      });
      
      const response = await chat.sendMessage({ message: userInput });
      setChatMessages([...newMessages, { role: 'model' as const, text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      console.error('Assistant error', err);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleModuleCompletion = async (moduleId: number, completed: boolean) => {
    const res = await fetch(`/api/modules/${moduleId}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed, userId: user.id }),
    });
    if (res.ok) {
      setModules(modules.map(m => m.id === moduleId ? { ...m, completed } : m));
      if (completed) {
        logHistory(`Completed module: ${modules.find(m => m.id === moduleId)?.title}`);
      }
    }
  };

  const startQuiz = async (moduleId: number, moduleContent: string) => {
    setIsGeneratingQuiz(true);
    try {
      const res = await fetch(`/api/quizzes/${moduleId}`);
      let data = await res.json();
      
      if (data.length === 0) {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Generate 5 multiple-choice quiz questions based on the following module content. 
          Return the response as a JSON array of objects, where each object has:
          - question: string
          - options: string array (exactly 4 options)
          - correctAnswer: number (index of the correct option, 0-3)
          
          Content: ${moduleContent}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  correctAnswer: { type: Type.NUMBER }
                },
                required: ['question', 'options', 'correctAnswer']
              }
            }
          }
        });

        const questions = JSON.parse(response.text || '[]');
        
        // Save to DB
        for (const q of questions) {
          await fetch('/api/quizzes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ moduleId, ...q }),
          });
        }
        
        const newRes = await fetch(`/api/quizzes/${moduleId}`);
        data = await newRes.json();
      }
      
      setQuizQuestions(data);
      setActiveQuizModule(moduleId);
      setCurrentQuestion(0);
      setScore(0);
      setShowScore(false);
      setUserAnswers([]);
    } catch (err) {
      console.error('Failed to start quiz', err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAnswer = async (index: number) => {
    const q = quizQuestions[currentQuestion];
    const correctAnswer = q.correct_answer !== undefined ? q.correct_answer : q.correctAnswer;
    const isCorrect = index === correctAnswer;
    const newScore = isCorrect ? score + 1 : score;
    
    const newAnswers = [...userAnswers, index];
    setUserAnswers(newAnswers);

    if (isCorrect) setScore(newScore);

    const next = currentQuestion + 1;
    if (next < quizQuestions.length) {
      setCurrentQuestion(next);
    } else {
      setShowScore(true);
      const finalScore = newScore;
      
      if (activeQuizModule !== -1) {
        logHistory(`Completed quiz for module ${activeQuizModule} with score ${finalScore}/5`);
      } else {
        logHistory(`Completed AI Topic Quiz with score ${finalScore}/5`);
      }
    }
  };

  const generateTopicQuiz = async (e: FormEvent) => {
    e.preventDefault();
    if (!quizTopic) return;
    setIsGeneratingTopicQuiz(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate 5 multiple-choice quiz questions based on the following topic: ${quizTopic}. 
        Return the response as a JSON array of objects, where each object has:
        - question: string
        - options: string array (exactly 4 options)
        - correctAnswer: number (index of the correct option, 0-3)`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                },
                correctAnswer: { type: Type.NUMBER }
              },
              required: ['question', 'options', 'correctAnswer']
            }
          }
        }
      });

      const questions = JSON.parse(response.text || '[]');
      setQuizQuestions(questions);
      setActiveQuizModule(-1);
      setCurrentQuestion(0);
      setScore(0);
      setShowScore(false);
      setUserAnswers([]);
      setIsQuizGeneratorOpen(false);
      setQuizTopic('');
    } catch (err) {
      console.error('Failed to generate topic quiz', err);
    } finally {
      setIsGeneratingTopicQuiz(false);
    }
  };

  const logHistory = async (action: string) => {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, action }),
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      {/* Left Column: Paths & Modules */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Plans</h1>
          <button 
            onClick={() => setIsAddingPath(true)}
            className="sapphire-btn flex items-center gap-2"
          >
            <Plus size={20} /> New Plan
          </button>
        </div>

        {/* Path Selection */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {paths.map(path => (
            <button
              key={path.id}
              onClick={() => setSelectedPath(path)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedPath?.id === path.id 
                  ? 'bg-sapphire text-white shadow-lg shadow-sapphire/20' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-sapphire/5'
              }`}
            >
              {path.is_industrial && <FileText size={14} />}
              {path.title}
            </button>
          ))}
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map((module, index) => (
            <div key={module.id} className="card overflow-hidden">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    module.completed ? 'bg-green-500 text-white' : 'bg-sapphire/10 text-sapphire'
                  }`}>
                    {module.completed ? <CheckCircle2 size={18} /> : index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold dark:text-white">{module.title}</h3>
                    {module.pdf_url && <span className="text-xs text-sapphire font-medium flex items-center gap-1 mt-1"><FileText size={12} /> PDF Available</span>}
                  </div>
                </div>
                {expandedModule === module.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              <AnimatePresence>
                {expandedModule === module.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-black/5 dark:border-white/5"
                  >
                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 mb-6">
                      {module.content}
                    </div>
                    
                    {module.pdf_url && (
                      <div className="mb-4 p-4 rounded-xl bg-sapphire/5 border border-sapphire/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="text-sapphire" size={24} />
                          <div>
                            <p className="font-bold text-sm dark:text-white">Industrial Learning Resource</p>
                            <p className="text-xs text-gray-500">Supplementary PDF Material</p>
                          </div>
                        </div>
                        <a 
                          href={module.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sapphire font-bold text-sm hover:underline"
                        >
                          View PDF <ExternalLink size={14} />
                        </a>
                      </div>
                    )}

                    {module.resource_link && (
                      <div className="mb-6 p-4 rounded-xl bg-orange-light/20 border border-sapphire/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ExternalLink className="text-sapphire" size={24} />
                          <div>
                            <p className="font-bold text-sm dark:text-white">Related Website</p>
                            <p className="text-xs text-gray-500">External Study Resource</p>
                          </div>
                        </div>
                        <a 
                          href={module.resource_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sapphire font-bold text-sm hover:underline"
                        >
                          Visit Website <ExternalLink size={14} />
                        </a>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      {user.role === 'lecturer' || module.completed ? (
                        <button
                          onClick={() => toggleModuleCompletion(module.id, !module.completed)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                            module.completed 
                              ? 'bg-green-500/10 text-green-600' 
                              : 'bg-sapphire text-white hover:bg-sapphire-light'
                          }`}
                        >
                          {module.completed ? <><CheckCircle2 size={18} /> Completed</> : 'Mark as Complete'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-bold text-sm">
                          <HelpCircle size={18} /> Quiz Required to Complete
                        </div>
                      )}
                      
                      <button 
                        onClick={() => startQuiz(module.id, module.content)}
                        disabled={isGeneratingQuiz}
                        className="flex items-center gap-2 text-sapphire font-bold hover:underline disabled:opacity-50"
                      >
                        {isGeneratingQuiz ? (
                          <div className="w-4 h-4 border-2 border-sapphire border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><HelpCircle size={18} /> {module.completed ? 'Retake Quiz' : 'Take Quiz'}</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {user.role === 'lecturer' && (
            selectedPath ? (
              <button 
                onClick={() => setIsAddingModule(true)}
                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-gray-500 hover:text-sapphire hover:border-sapphire transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={20} /> Add Module to "{selectedPath.title}"
              </button>
            ) : (
              <div className="w-full py-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-center">
                <p className="text-gray-500 mb-4">Please select or create a learning plan first to add modules.</p>
                <button 
                  onClick={() => setIsAddingPath(true)}
                  className="text-sapphire font-bold hover:underline flex items-center gap-2 mx-auto"
                >
                  <Plus size={18} /> Create New Plan
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Right Column: Timer & Assistant */}
      <div className="space-y-6">
        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Timer className="text-sapphire" size={24} />
            <h2 className="text-xl font-bold dark:text-white">Pomodoro Timer</h2>
          </div>
          
          <div className="relative w-48 h-48 mx-auto mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96" cy="96" r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-100 dark:text-gray-700"
              />
              <motion.circle
                cx="96" cy="96" r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={552.92}
                animate={{ strokeDashoffset: 552.92 * (1 - timeLeft / (isBreak ? 5 * 60 : 25 * 60)) }}
                className="text-sapphire"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-mono font-bold text-gray-900 dark:text-white">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs font-bold text-sapphire uppercase tracking-widest mt-1">
                {isBreak ? 'Break' : 'Focus'}
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            {!isActive ? (
              <button
                onClick={() => setIsActive(true)}
                className="flex-1 sapphire-btn flex items-center justify-center gap-2"
              >
                <Play size={20} /> Start
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-sapphire/10 text-sapphire font-bold">
                <Timer size={20} className="animate-pulse" /> Running...
              </div>
            )}
            <button
              onClick={() => {
                setIsActive(false);
                setTimeLeft(25 * 60);
                setIsBreak(false);
              }}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="card bg-sapphire text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles size={24} />
            AI Assistant
          </h2>
          <p className="text-sm text-blue-100 mb-6">Have doubts about your study material? Ask our AI assistant for instant clarification.</p>
          <button 
            onClick={() => setIsAssistantOpen(true)}
            className="w-full bg-white text-sapphire py-3 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare size={20} /> Ask Assistant
          </button>
        </div>

        <div className="card border-2 border-sapphire/20 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
            <HelpCircle className="text-sapphire" size={24} />
            AI Quiz Generator
          </h2>
          <p className="text-sm text-gray-500 mb-6">Test your knowledge on any topic. AI will generate 5 custom questions for you.</p>
          <button 
            onClick={() => setIsQuizGeneratorOpen(true)}
            className="w-full sapphire-btn py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Sparkles size={20} /> Generate Quiz
          </button>
        </div>
      </div>

      {/* AI Assistant Drawer */}
      <AnimatePresence>
        {isAssistantOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssistantOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-sapphire text-white">
                <div className="flex items-center gap-3">
                  <Sparkles size={24} />
                  <h2 className="text-xl font-bold">Study Assistant</h2>
                </div>
                <button onClick={() => setIsAssistantOpen(false)}><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-sapphire/10 text-sapphire rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">Ask me anything about your courses!</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-sapphire text-white rounded-tr-none' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl rounded-tl-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 border-t border-black/5 dark:border-white/5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your doubt here..."
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="p-3 bg-sapphire text-white rounded-xl hover:bg-sapphire-light transition-all"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isAddingPath && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">New Learning Plan</h2>
                <button onClick={() => setIsAddingPath(false)}><X size={24} className="text-gray-400" /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-sapphire uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles size={16} /> AI Plan Generator
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Full Stack Web Development"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                    />
                    <button 
                      onClick={handleAiGenerate}
                      disabled={isGenerating}
                      className="p-3 bg-sapphire text-white rounded-xl hover:bg-sapphire-light transition-all disabled:opacity-50"
                    >
                      {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Let AI design a comprehensive curriculum for you.</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-700" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-800 px-2 text-gray-400">Or Manual</span></div>
                </div>

                <form onSubmit={handleAddPath} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Plan Title"
                    value={newPathTitle}
                    onChange={(e) => setNewPathTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                    required={!isGenerating}
                  />
                  {user.role === 'lecturer' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isIndustrial} 
                        onChange={(e) => setIsIndustrial(e.target.checked)}
                        className="w-4 h-4 text-sapphire rounded"
                      />
                      <span className="text-sm font-medium dark:text-white">Mark as Industrial Learning Course</span>
                    </label>
                  )}
                  <button type="submit" className="w-full sapphire-btn font-bold py-3">Create Manually</button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {isAddingModule && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-2xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Add Module to {selectedPath?.title}</h2>
              <form onSubmit={handleAddModule} className="space-y-4">
                <input
                  autoFocus
                  type="text"
                  placeholder="Module Title"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                  required
                />
                <textarea
                  placeholder="Module Content (Markdown supported)"
                  value={newModuleContent}
                  onChange={(e) => setNewModuleContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire resize-none"
                  required
                />
                <input
                  type="url"
                  placeholder="PDF URL (Optional)"
                  value={newModulePdf}
                  onChange={(e) => setNewModulePdf(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                />
                <input
                  type="url"
                  placeholder="Related Website Link (Optional)"
                  value={newModuleResourceLink}
                  onChange={(e) => setNewModuleResourceLink(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                />
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsAddingModule(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:text-white font-bold">Cancel</button>
                  <button type="submit" className="flex-1 sapphire-btn font-bold">Add Module</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {activeQuizModule && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl"
            >
              {!showScore ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-bold text-sapphire uppercase tracking-widest">Question {currentQuestion + 1} of 5</span>
                    <button onClick={() => setActiveQuizModule(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  </div>
                  <h2 className="text-xl font-bold mb-8 dark:text-white">{quizQuestions[currentQuestion]?.question}</h2>
                  <div className="space-y-3">
                    {quizQuestions[currentQuestion]?.options.map((option: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className="w-full text-left px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:text-white hover:bg-sapphire/5 hover:border-sapphire transition-all font-medium"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-4">
                  <div className="text-center mb-8">
                    <div className={`w-20 h-20 ${score >= 3 ? 'bg-green-500' : 'bg-amber-500'} rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg`}>
                      {score >= 3 ? <CheckCircle2 size={40} /> : <HelpCircle size={40} />}
                    </div>
                    <h2 className="text-3xl font-bold mb-2 dark:text-white">
                      {score >= 3 ? 'Quiz Passed!' : 'Quiz Not Passed'}
                    </h2>
                    <p className="text-gray-500 mb-4 text-lg">
                      You scored <span className="text-sapphire font-bold">{score}/{quizQuestions.length}</span>
                    </p>
                    {score < 3 && activeQuizModule !== -1 && (
                      <p className="text-sm text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 py-2 rounded-lg">
                        You need at least 3 correct answers to complete this module.
                      </p>
                    )}
                  </div>

                  <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 mb-8">
                    {quizQuestions.map((q, idx) => {
                      const userAnswer = userAnswers[idx];
                      const correctAnswer = q.correct_answer !== undefined ? q.correct_answer : q.correctAnswer;
                      const isCorrect = userAnswer === correctAnswer;

                      return (
                        <div key={idx} className={`p-4 rounded-2xl border ${isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'}`}>
                          <p className="font-bold text-sm dark:text-white mb-2">Q{idx + 1}: {q.question}</p>
                          <div className="space-y-1">
                            <p className={`text-xs ${isCorrect ? 'text-green-600' : 'text-red-600'} font-medium`}>
                              Your Answer: {q.options[userAnswer]}
                            </p>
                            {!isCorrect && (
                              <p className="text-xs text-green-600 font-medium">
                                Correct Answer: {q.options[correctAnswer]}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4">
                    {score >= 3 && activeQuizModule !== -1 && !modules.find(m => m.id === activeQuizModule)?.completed && (
                      <button 
                        onClick={() => {
                          if (activeQuizModule !== -1) {
                            toggleModuleCompletion(activeQuizModule, true);
                            setActiveQuizModule(null);
                          }
                        }}
                        className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={20} /> Mark as Completed
                      </button>
                    )}
                    {score < 3 && activeQuizModule !== -1 ? (
                      <button 
                        onClick={() => {
                          const moduleId = activeQuizModule;
                          const content = modules.find(m => m.id === moduleId)?.content || '';
                          startQuiz(moduleId, content);
                        }}
                        className="flex-1 sapphire-btn font-bold py-3"
                      >
                        Retake Quiz
                      </button>
                    ) : (
                      <button 
                        onClick={() => setActiveQuizModule(null)}
                        className={`flex-1 font-bold py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:text-white ${score >= 3 && activeQuizModule !== -1 ? 'bg-gray-50 dark:bg-gray-700' : 'sapphire-btn'}`}
                      >
                        {activeQuizModule === -1 ? 'Close' : 'Back to Learning'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {isQuizGeneratorOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">AI Quiz Generator</h2>
                <button onClick={() => setIsQuizGeneratorOpen(false)}><X size={24} className="text-gray-400" /></button>
              </div>

              <form onSubmit={generateTopicQuiz} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">What topic do you want to be tested on?</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Quantum Physics, React Hooks, World War II"
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-sapphire"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isGeneratingTopicQuiz}
                  className="w-full sapphire-btn font-bold py-3 flex items-center justify-center gap-2"
                >
                  {isGeneratingTopicQuiz ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Sparkles size={20} /> Generate Quiz</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
