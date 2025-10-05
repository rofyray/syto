import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Mic, StopCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

// Use local Chale image from public folder
import chaleImage from "/chale.png";

interface Message {
  id: string;
  content: string;
  sender: "user" | "chale";
  timestamp: Date;
}

export function ChalePage() {
  const { profile } = useAuthStore();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: Message = {
        id: Date.now().toString(),
        content: `Hello ${profile?.username || "there"}! I'm Chale, your learning assistant. How can I help you with your English or Mathematics lessons today?`,
        sender: "chale",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [profile, messages.length]);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsProcessing(true);

    try {
      // Call new Claude-powered Chale API with streaming
      const response = await fetch('/api/chale/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userMessage.content,
          subject: 'mathematics', // Could be dynamic based on context
          grade: profile?.grade_level || 5,
        }),
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let chaleResponseText = '';
      let chaleMessageId = Date.now().toString();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                chaleResponseText += parsed.chunk;

                // Update UI with streaming response
                setMessages((prev) => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage?.id === chaleMessageId && lastMessage?.sender === 'chale') {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMessage, content: chaleResponseText },
                    ];
                  } else {
                    return [
                      ...prev,
                      {
                        id: chaleMessageId,
                        content: chaleResponseText,
                        sender: 'chale',
                        timestamp: new Date(),
                      },
                    ];
                  }
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry chale, I'm having trouble responding right now. Please try again!",
        sender: "chale",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
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
        <h1 className="text-3xl font-bold mb-2">Chat with Chale</h1>
        <p className="text-muted-foreground mb-8">
          Your AI learning assistant for English and Mathematics
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="md:col-span-2">
            <Card className="flex flex-col h-[600px] overflow-hidden">
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
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          msg.sender === "user"
                            ? "bg-ghana-green ml-2"
                            : "bg-ghana-gold mr-2"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          <User className="h-5 w-5 text-white" />
                        ) : (
                          <Bot className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          msg.sender === "user"
                            ? "bg-ghana-green text-white"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="mt-1 text-xs opacity-70">
                          {msg.timestamp.toLocaleTimeString([], {
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
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ghana-gold mr-2">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="rounded-lg p-3 bg-muted">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 rounded-full bg-ghana-gold animate-pulse"></div>
                          <div className="h-2 w-2 rounded-full bg-ghana-gold animate-pulse delay-150"></div>
                          <div className="h-2 w-2 rounded-full bg-ghana-gold animate-pulse delay-300"></div>
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
                    variant="ghana"
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
            </Card>
          </div>
          
          {/* Chale Profile */}
          <div className="md:col-span-1">
            <Card className="p-6">
              <div className="flex flex-col items-center">
                <div className="mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-ghana-gold">
                  <img
                    src={chaleImage}
                    alt="Chale AI Assistant"
                    className="h-full w-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold">Chale</h2>
                <p className="text-center text-muted-foreground mb-4">
                  Your AI Learning Assistant
                </p>
                
                <div className="w-full space-y-2 mt-4">
                  <h3 className="text-lg font-semibold">How Chale Can Help</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2 text-ghana-green">✓</span>
                      <span>Explain difficult concepts in English and Mathematics</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-ghana-green">✓</span>
                      <span>Help with homework questions and problem-solving</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-ghana-green">✓</span>
                      <span>Provide examples with Ghanaian context</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-ghana-green">✓</span>
                      <span>Guide you through practice exercises</span>
                    </li>
                  </ul>
                </div>
                
                <div className="w-full mt-6">
                  <h3 className="text-lg font-semibold mb-2">Try asking:</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => setMessage("Can you explain fractions to me?")}
                    >
                      Can you explain fractions to me?
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() =>
                        setMessage("What are adjectives and how do I use them?")
                      }
                    >
                      What are adjectives and how do I use them?
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() =>
                        setMessage("Help me solve this word problem about market prices.")
                      }
                    >
                      Help me solve this word problem.
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}