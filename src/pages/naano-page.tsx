import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Mic, StopCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useNaanoStore, type ChatMessage } from "@/stores/naano-store";
import { getModulesWithChildren, type Module } from "@/lib/supabase";

// Use local NAANO image from public folder
import naanoImage from "/naano.png";

/** Grade-specific fallback suggestions based on actual curriculum topics */
const FALLBACK_SUGGESTIONS: Record<number, string[]> = {
  4: [
    "Can you explain whole numbers and decimals to me?",
    "What are nouns and pronouns and how do I use them?",
    "How do I read a pictograph or bar chart?",
  ],
  5: [
    "How do I add fractions with different denominators?",
    "Can you teach me about prefixes and suffixes?",
    "Help me understand how to calculate perimeter and area.",
  ],
  6: [
    "Can you explain percentages and ratios to me?",
    "What is reported speech and how do I use it?",
    "How do I find the mean, median, and mode of numbers?",
  ],
};

/** Build 3 suggested questions from actual curriculum topics */
function buildSuggestions(mathModules: Module[], englishModules: Module[], grade: number): string[] {
  // Collect all topics with their subject label
  const allTopics: { title: string; subject: 'mathematics' | 'english' }[] = [];
  for (const m of mathModules) {
    for (const t of (m as any).topics || []) {
      allTopics.push({ title: t.title || t.content, subject: 'mathematics' });
    }
  }
  for (const m of englishModules) {
    for (const t of (m as any).topics || []) {
      allTopics.push({ title: t.title || t.content, subject: 'english' });
    }
  }

  if (allTopics.length === 0) {
    return FALLBACK_SUGGESTIONS[grade] || FALLBACK_SUGGESTIONS[5];
  }

  // Shuffle and pick up to 3 distinct topics (try to mix subjects)
  const shuffled = allTopics.sort(() => Math.random() - 0.5);
  const picked: typeof allTopics = [];
  const usedSubjects = new Set<string>();
  for (const t of shuffled) {
    if (picked.length >= 3) break;
    // Prefer mixing subjects if possible
    if (picked.length < 2 || usedSubjects.size >= 2 || !usedSubjects.has(t.subject)) {
      picked.push(t);
      usedSubjects.add(t.subject);
    }
  }
  // Fill remaining if we're short
  for (const t of shuffled) {
    if (picked.length >= 3) break;
    if (!picked.includes(t)) picked.push(t);
  }

  const mathTemplates = [
    (topic: string) => `Can you explain ${topic} to me?`,
    (topic: string) => `Help me understand ${topic} with examples.`,
    (topic: string) => `How do I solve ${topic} problems?`,
  ];
  const englishTemplates = [
    (topic: string) => `What is ${topic} and how do I use it?`,
    (topic: string) => `Can you teach me about ${topic}?`,
    (topic: string) => `Help me understand ${topic} with examples.`,
  ];

  return picked.map((t, i) => {
    const templates = t.subject === 'mathematics' ? mathTemplates : englishTemplates;
    return templates[i % templates.length](t.title);
  });
}

export function NAANOPage() {
  const { profile } = useAuthStore();
  const { messages, addMessage, updateLastMessage } = useNaanoStore();
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const greetingSentRef = useRef(false);

  // Initial greeting — only if no persisted messages (ref prevents StrictMode double-fire)
  useEffect(() => {
    if (messages.length === 0 && !greetingSentRef.current) {
      greetingSentRef.current = true;
      addMessage({
        id: Date.now().toString(),
        content: `Hello ${profile?.username || "there"}! I'm NAANO, your learning assistant. How can I help you with your English or Mathematics lessons today?`,
        sender: "naano",
        timestamp: new Date().toISOString(),
      });
    }
  }, [profile, messages.length, addMessage]);
  
  // Fetch curriculum topics to build dynamic suggestions
  useEffect(() => {
    const grade = profile?.grade_level || 5;
    Promise.all([
      getModulesWithChildren(grade, 'mathematics'),
      getModulesWithChildren(grade, 'english'),
    ]).then(([math, english]) => {
      setSuggestions(buildSuggestions(math, english, grade));
    }).catch(() => {
      setSuggestions(FALLBACK_SUGGESTIONS[grade] || FALLBACK_SUGGESTIONS[5]);
    });
  }, [profile?.grade_level]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setMessage("");
    setIsProcessing(true);

    try {
      const response = await fetch('/api/naano/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userMessage.content,
          subject: 'mathematics',
          grade: profile?.grade_level || 5,
          studentName: profile?.first_name || profile?.username || 'Student',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        addMessage({
          id: Date.now().toString(),
          content: data?.message || "Oops! NAANO ran into a small problem. Please try again in a moment!",
          sender: 'naano',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Add the complete response — simulate typing effect by progressively revealing text
      const fullText = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
      const messageId = `naano-${Date.now()}`;

      addMessage({
        id: messageId,
        content: '',
        sender: 'naano',
        timestamp: new Date().toISOString(),
      });

      // Reveal text progressively for a natural feel
      const chunkSize = 8;
      for (let i = 0; i < fullText.length; i += chunkSize) {
        updateLastMessage(fullText.slice(0, i + chunkSize));
        await new Promise(r => setTimeout(r, 15));
      }
      updateLastMessage(fullText);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        id: Date.now().toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again!",
        sender: "naano",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const toggleRecording = () => {
    // This would be integrated with browser's Speech Recognition API
    // and then send the transcribed text to the AI service
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Start recording simulation
      setTimeout(() => {
        setIsRecording(false);
        setMessage("Can you explain fractions to me?");
      }, 3000);
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-lg animate-slide-up">
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ghana-green/20 to-ghana-green-dark/20 dark:from-ghana-gold/20 dark:to-ghana-gold-dark/20 flex items-center justify-center mr-3">
              <Bot className="h-6 w-6 text-ghana-green-dark dark:text-ghana-gold-dark" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-ghana-green to-ghana-green-dark dark:from-ghana-gold dark:to-ghana-gold-dark bg-clip-text text-transparent">
                Chat with NAANO
              </h1>
              <p className="text-muted-foreground">
                Your AI learning assistant for English and Mathematics
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="md:col-span-2 animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-glass-lg flex flex-col h-[600px] overflow-hidden">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[80%] ${
                        msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden ${
                          msg.sender === "user"
                            ? "bg-ghana-green ml-2"
                            : "bg-transparent mr-2 border-2 border-ghana-green dark:border-ghana-gold"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          <User className="h-5 w-5 text-white" />
                        ) : (
                          <img
                            src={naanoImage}
                            alt="NAANO"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div
                        className={`rounded-2xl p-4 ${
                          msg.sender === "user"
                            ? "bg-ghana-green dark:bg-ghana-green text-white"
                            : "bg-ghana-green/10 dark:bg-white/10 backdrop-blur-sm border border-ghana-green/20 dark:border-white/20"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`mt-1 text-xs ${msg.sender === "user" ? "opacity-70" : "text-muted-foreground"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="flex flex-row">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-transparent mr-2 border-2 border-ghana-green dark:border-ghana-gold">
                        <img
                          src={naanoImage}
                          alt="NAANO"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="rounded-2xl p-4 bg-white/40 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 rounded-full bg-ghana-green dark:bg-ghana-gold animate-pulse"></div>
                          <div className="h-2 w-2 rounded-full bg-ghana-green dark:bg-ghana-gold animate-pulse delay-150"></div>
                          <div className="h-2 w-2 rounded-full bg-ghana-green dark:bg-ghana-gold animate-pulse delay-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={toggleRecording}
                    className={`rounded-full ${
                      isRecording ? "bg-error-100 text-error-600" : ""
                    }`}
                  >
                    {isRecording ? (
                      <StopCircle className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                  <textarea
                    className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Type your question here..."
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="bg-gradient-to-r from-ghana-green to-ghana-green-dark hover:from-ghana-green-dark hover:to-ghana-green dark:from-ghana-gold dark:to-ghana-gold-dark dark:hover:from-ghana-gold-dark dark:hover:to-ghana-gold text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isProcessing}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {isRecording && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-error-600 animate-pulse">
                      Recording... Speak clearly
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NAANO Profile */}
          <div className="md:col-span-1 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-lg">
              <div className="flex flex-col items-center">
                <div className="mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-ghana-green dark:border-ghana-gold">
                  <img
                    src={naanoImage}
                    alt="NAANO AI Assistant"
                    className="h-full w-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold">NAANO</h2>
                <p className="text-center text-muted-foreground mb-4">
                  Your AI Learning Assistant
                </p>
                
                <div className="w-full space-y-2 mt-4">
                  <h3 className="text-lg font-semibold">How NAANO Can Help</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2 text-ghana-green dark:text-ghana-gold">✓</span>
                      <span>Explain difficult concepts in English and Mathematics</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-ghana-green dark:text-ghana-gold">✓</span>
                      <span>Help with homework questions and problem-solving</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-ghana-green dark:text-ghana-gold">✓</span>
                      <span>Provide examples with Ghanaian context</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-ghana-green dark:text-ghana-gold">✓</span>
                      <span>Guide you through practice exercises</span>
                    </li>
                  </ul>
                </div>
                
                <div className="w-full mt-6">
                  <h3 className="text-lg font-semibold mb-2">Try asking:</h3>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, i) => (
                      <Button
                        key={i}
                        className="w-full justify-start text-left whitespace-normal h-auto py-3 bg-ghana-green/10 hover:bg-ghana-green/20 text-ghana-green-dark border-2 border-ghana-green/30 hover:border-ghana-green/50 dark:bg-ghana-gold/10 dark:hover:bg-ghana-gold/20 dark:text-ghana-gold-dark dark:border-ghana-gold/30 dark:hover:border-ghana-gold/50 rounded-xl shadow-sm hover:shadow-md transition-all"
                        onClick={() => setMessage(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}