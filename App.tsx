
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from './geminiService';
import { Message, ChatSession } from './types';
import { ChatBubble } from './components/ChatBubble';
import { Sidebar } from './components/Sidebar';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  setDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  GraduationCap, 
  Languages, 
  PlusCircle,
  AlertCircle,
  Mic,
  MicOff,
  History,
  Globe,
  Calculator,
  Sparkles,
  Atom,
  Binary,
  Shapes,
  Menu,
  Cpu,
  User
} from 'lucide-react';

const gemini = new GeminiService();

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('General');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const subjects = [
    { id: 'General', label: 'General', icon: <Sparkles size={14} />, color: 'emerald' },
    { id: 'Math', label: 'Mathematics', icon: <Calculator size={14} />, color: 'blue' },
    { id: 'Science', label: 'Science', icon: <Atom size={14} />, color: 'purple' },
    { id: 'History', label: 'History', icon: <History size={14} />, color: 'amber' },
    { id: 'English', label: 'English', icon: <Languages size={14} />, color: 'rose' },
    { id: 'CS', label: 'Computer Science', icon: <Cpu size={14} />, color: 'indigo' },
  ];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Save user to Firestore
        setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
          createdAt: serverTimestamp()
        }, { merge: true });
      } else {
        setSessions([]);
        setCurrentSessionId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'sessions'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSessions: ChatSession[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        messages: [] // Messages will be fetched per session
      } as ChatSession));
      
      setSessions(fetchedSessions);
      
      if (fetchedSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(fetchedSessions[0].id);
      } else if (fetchedSessions.length === 0) {
        createNewSession();
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!currentSessionId || !user) return;

    const q = query(
      collection(db, 'sessions', currentSessionId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: fetchedMessages } : s
      ));
    });

    return () => unsubscribe();
  }, [currentSessionId, user]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Automatically send voice input
        handleSendMessage(transcript, 'voice');
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    // Initialize first session if none exists
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const createNewSession = async () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Question',
      messages: []
    };

    if (user) {
      try {
        const docRef = await addDoc(collection(db, 'sessions'), {
          uid: user.uid,
          title: 'New Question',
          createdAt: serverTimestamp()
        });
        setCurrentSessionId(docRef.id);
      } catch (error) {
        console.error("Error creating session:", error);
      }
    } else {
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newId);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (overrideInput?: string, method: 'text' | 'voice' | 'image' = 'text') => {
    const messageText = overrideInput || input;
    const finalMethod = selectedImage ? 'image' : method;

    if ((!messageText.trim() && !selectedImage) || isLoading || !currentSessionId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      image: selectedImage || undefined,
      inputMethod: finalMethod,
      subject: selectedSubject,
      timestamp: Date.now(),
    };

    // Update session with user message
    if (user && currentSessionId) {
      try {
        const sessionRef = doc(db, 'sessions', currentSessionId);
        if (currentSession?.messages.length === 0) {
          await setDoc(sessionRef, { 
            title: messageText.slice(0, 30) || 'Image Question',
            subject: selectedSubject
          }, { merge: true });
        }

        await addDoc(collection(db, 'sessions', currentSessionId, 'messages'), {
          role: 'user',
          text: messageText,
          image: selectedImage || null,
          inputMethod: finalMethod,
          subject: selectedSubject,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error("Error saving user message:", error);
      }
    } else {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: [...s.messages, userMsg], 
              title: s.messages.length === 0 ? (messageText.slice(0, 30) || 'Image Question') : s.title,
              subject: s.messages.length === 0 ? selectedSubject : s.subject
            } 
          : s
      ));
    }

    const prompt = messageText;
    const img = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await gemini.solveQuestion(prompt, img || undefined, finalMethod, selectedSubject);
      
      if (user && currentSessionId) {
        try {
          await addDoc(collection(db, 'sessions', currentSessionId, 'messages'), {
            role: 'model',
            text: response,
            subject: selectedSubject,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error("Error saving model message:", error);
        }
      } else {
        const modelMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: response,
          subject: selectedSubject,
          timestamp: Date.now(),
        };

        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: [...s.messages, modelMsg] } 
            : s
        ));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a051a] overflow-hidden relative font-sans selection:bg-emerald-500/30">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-10 text-emerald-500/20 floating">
        <Atom size={120} />
      </div>
      <div className="absolute bottom-20 right-10 text-purple-500/20 floating-delayed">
        <Binary size={100} />
      </div>
      <div className="absolute top-1/2 left-1/4 text-blue-500/10 floating">
        <Shapes size={80} />
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-0 z-50 md:relative md:z-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar 
          sessions={sessions} 
          activeId={currentSessionId} 
          onSelect={(id) => {
            setCurrentSessionId(id);
            setIsSidebarOpen(false);
          }} 
          onNew={() => {
            createNewSession();
            setIsSidebarOpen(false);
          }}
        />
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/50 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full z-10 min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="h-20 glass-panel flex items-center justify-between px-4 md:px-6 shrink-0 border-b-0 sticky top-0 z-50 gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 p-2 md:px-3 md:py-2 text-slate-300 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 group shrink-0"
              title="Search History"
            >
              <History size={20} className="group-hover:text-emerald-400 transition-colors" />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">History</span>
            </button>
            
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="hidden sm:flex bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl text-white shadow-lg neon-glow-emerald shrink-0">
                <GraduationCap size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="font-bold text-white text-sm md:text-lg tracking-tight leading-none truncate">Flex ai</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <p className="text-[8px] md:text-[10px] text-emerald-400 font-medium uppercase tracking-widest truncate">Neural Tutor Active</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="hidden lg:flex gap-6 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-6">
              <div className="flex items-center gap-2 text-emerald-400 cursor-default"><Calculator size={12} /> Mathematics</div>
              <div className="flex items-center gap-2 text-blue-400 cursor-default"><Languages size={12} /> Humanities</div>
              <div className="flex items-center gap-2 text-purple-400 cursor-default"><History size={12} /> History</div>
            </div>
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-white text-xs font-bold">{user.displayName}</span>
                  <button onClick={logout} className="text-[10px] text-slate-400 hover:text-red-400 transition-colors uppercase tracking-widest font-bold">Logout</button>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-emerald-500/50" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/50">
                    <User size={16} />
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold transition-all group"
              >
                <User size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Sign In with Google</span>
              </button>
            )}
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar">
          {currentSession?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-10">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                <div className="w-24 h-24 glass-panel rounded-3xl flex items-center justify-center text-emerald-400 relative z-10 neon-glow-emerald">
                  <Sparkles size={48} />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Master</span> Your Studies?
                </h2>
                <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
                  I'm your futuristic AI tutor. Scan your homework, speak your thoughts, or type any question to begin our session.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  { q: "Solve for x: 2x + 5 = 15", icon: <Calculator className="text-emerald-400" />, subject: 'Math' },
                  { q: "Explain quantum entanglement simply", icon: <Atom className="text-blue-400" />, subject: 'Science' },
                  { q: "What are the main causes of WWI?", icon: <History className="text-purple-400" />, subject: 'History' },
                  { q: "How does photosynthesis work?", icon: <Globe className="text-amber-400" />, subject: 'Science' }
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setSelectedSubject(item.subject);
                      setInput(item.q);
                      handleSendMessage(item.q, 'text');
                    }}
                    className="group p-5 glass-panel rounded-2xl text-left hover:bg-white/10 transition-all duration-300 flex items-center gap-4"
                  >
                    <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">"{item.q}"</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full space-y-8">
              {currentSession?.messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
            </div>
          )}
          {isLoading && (
            <div className="max-w-4xl mx-auto w-full flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-white/5 rounded-full w-1/4"></div>
                <div className="h-20 bg-white/5 rounded-2xl w-full"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-10 shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* Subject Selector */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar no-scrollbar">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border shrink-0 ${
                    selectedSubject === subject.id
                      ? `bg-${subject.color}-500/20 text-${subject.color}-400 border-${subject.color}-500/50 neon-glow-${subject.color}`
                      : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {subject.icon}
                  {subject.label}
                </button>
              ))}
            </div>

            {selectedImage && (
              <div className="mb-6 relative inline-block group">
                <div className="absolute -inset-1 bg-emerald-500/50 blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 rounded-2xl"></div>
                <img src={selectedImage} alt="Selected" className="h-40 rounded-2xl border border-white/20 shadow-2xl relative z-10" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-xl z-20 hover:scale-110 transition-transform"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <div className="relative glass-panel rounded-[2rem] p-3 flex items-end gap-3 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all duration-500">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-2xl transition-all"
                  title="Scan Homework"
                >
                  <ImageIcon size={24} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                />
                <button 
                  onClick={toggleListening}
                  className={`p-4 rounded-2xl transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500/20 text-red-500 neon-glow-purple animate-pulse' 
                      : 'text-slate-400 hover:text-blue-400 hover:bg-white/5'
                  }`}
                  title="Voice Input"
                >
                  {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={isListening ? "Listening to your thoughts..." : "Type your question here..."}
                className="flex-1 bg-transparent border-none focus:ring-0 text-white py-4 px-2 resize-none max-h-48 text-lg placeholder:text-slate-500"
                rows={1}
              />

              <button 
                onClick={() => handleSendMessage()}
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className={`p-4 rounded-[1.5rem] transition-all duration-300 ${
                  (!input.trim() && !selectedImage) || isLoading 
                    ? 'bg-white/5 text-slate-600' 
                    : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl neon-glow-emerald hover:scale-105 active:scale-95'
                }`}
              >
                <Send size={24} />
              </button>
            </div>
            
            <div className="flex justify-center gap-8 mt-6">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                Multimodal AI
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                Real-time Analysis
              </div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-500"></div>
                Step-by-Step Logic
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
