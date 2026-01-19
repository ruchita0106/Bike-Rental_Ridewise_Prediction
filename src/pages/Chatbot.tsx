import { useState, useEffect, useRef } from "react";
import { Send, Bot, Info, Mic, MicOff, Volume2, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  type: "user" | "assistant";
  message: string;
}

const CHAT_HISTORY_KEY = 'ridewise_chat_history';
const PREDICTION_DATA_KEY = 'ridewise_prediction_data';

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Voice chat state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [browserSupport, setBrowserSupport] = useState({
    speechRecognition: false,
    speechSynthesis: false,
  });
  
  // Refs for safe cleanup and preventing state updates after unmount
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const segmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load chat history and prediction data from localStorage on mount
  useEffect(() => {
    // Load chat history
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setMessages(parsedHistory);
          console.log('Loaded chat history from localStorage:', parsedHistory.length, 'messages');
        }
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }

    // Log prediction data availability (for debugging)
    const predictionData = localStorage.getItem(PREDICTION_DATA_KEY);
    if (predictionData) {
      console.log('Prediction data available in localStorage');
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        console.log('Saved chat history to localStorage:', messages.length, 'messages');
      } catch (err) {
        console.error('Error saving chat history:', err);
      }
    }
  }, [messages]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Check browser support for Web Speech API
  useEffect(() => {
    isMountedRef.current = true;
    
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const hasRecognition = !!SpeechRecognition;
      const hasSynthesis = 'speechSynthesis' in window;

      if (isMountedRef.current) {
        setBrowserSupport({
          speechRecognition: hasRecognition,
          speechSynthesis: hasSynthesis,
        });
      }

      if (hasRecognition) {
        try {
          const Recognition = SpeechRecognition;
          recognitionRef.current = new Recognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onresult = (event: any) => {
            if (!isMountedRef.current) return;
            
            try {
              const transcript = Array.from(event.results)
                .map((result: any) => result[0].transcript)
                .join('');
              
              if (transcript.trim() && isMountedRef.current) {
                setInput(transcript);
                // Automatically send after speech recognition
                setTimeout(() => {
                  if (isMountedRef.current) {
                    handleSend(transcript);
                  }
                }, 100);
              }
            } catch (err) {
              console.error('Error processing speech recognition result:', err);
            }
          };

          recognitionRef.current.onerror = (event: any) => {
            if (!isMountedRef.current) return;
            
            try {
              console.error('Speech recognition error:', event.error);
              if (isMountedRef.current) {
                setIsListening(false);
              }
              
              let errorMessage = 'Speech recognition error occurred.';
              if (event.error === 'no-speech') {
                errorMessage = 'No speech detected. Please try again.';
              } else if (event.error === 'audio-capture') {
                errorMessage = 'Microphone not found. Please check your microphone settings.';
              } else if (event.error === 'not-allowed') {
                errorMessage = 'Microphone permission denied. Please enable microphone access.';
              } else if (event.error === 'network') {
                errorMessage = 'Network error. Please check your connection.';
              }
              
              if (isMountedRef.current) {
                toast({
                  title: "Voice Input Error",
                  description: errorMessage,
                  variant: "destructive",
                });
              }
            } catch (err) {
              console.error('Error handling speech recognition error:', err);
            }
          };

          recognitionRef.current.onend = () => {
            if (isMountedRef.current) {
              setIsListening(false);
            }
          };
        } catch (err) {
          console.error('Error initializing speech recognition:', err);
        }
      }

      if (hasSynthesis) {
        try {
          synthesisRef.current = window.speechSynthesis;
          console.log('Speech Synthesis available:', hasSynthesis);
        } catch (err) {
          console.error('Error accessing speech synthesis:', err);
        }
      } else {
        console.warn('Speech Synthesis not available in this browser');
      }
    } catch (err) {
      console.error('Error setting up Web Speech API:', err);
    }

    // Handle page visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Cancel speech when tab becomes hidden
        try {
          if (synthesisRef.current) {
            synthesisRef.current.cancel();
          }
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          if (isMountedRef.current) {
            setIsSpeaking(false);
            setIsListening(false);
          }
        } catch (err) {
          console.error('Error handling visibility change:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      
      // Clear any pending timeouts
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
      if (segmentTimeoutRef.current) {
        clearTimeout(segmentTimeoutRef.current);
        segmentTimeoutRef.current = null;
      }
      
      // Cancel speech recognition
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      
      // Cancel speech synthesis
      try {
        if (synthesisRef.current) {
          synthesisRef.current.cancel();
        }
        if (currentUtteranceRef.current) {
          currentUtteranceRef.current = null;
        }
      } catch (err) {
        console.error('Error canceling synthesis:', err);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Parse text into speech segments (points, headings, etc.)
  const parseTextForSpeech = (text: string): string[] => {
    const segments: string[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentSegment = '';
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle headings (## Heading)
      if (line.startsWith('##')) {
        if (currentSegment.trim()) {
          segments.push(currentSegment.trim());
          currentSegment = '';
        }
        const heading = line.replace(/^##+\s*/, '').trim();
        if (heading) {
          segments.push(heading);
        }
        continue;
      }
      
      // Handle numbered lists (1., 2., 3. or 1), 2), etc.)
      const numberedMatch = line.match(/^(\d+)[.)]\s*(.+)$/);
      if (numberedMatch) {
        if (currentSegment.trim() && !inList) {
          segments.push(currentSegment.trim());
          currentSegment = '';
        }
        inList = true;
        segments.push(numberedMatch[2].trim());
        continue;
      }
      
      // Handle bulleted lists (•, -, *, or - with indentation)
      const bulletMatch = line.match(/^[•\-\*]\s*(.+)$/);
      if (bulletMatch) {
        if (currentSegment.trim() && !inList) {
          segments.push(currentSegment.trim());
          currentSegment = '';
        }
        inList = true;
        segments.push(bulletMatch[1].trim());
        continue;
      }
      
      // Handle indented sub-points (starts with spaces or tabs)
      if (line.match(/^\s+[•\-\*]\s*(.+)$/) || line.match(/^\s+(\d+)[.)]\s*(.+)$/)) {
        const subPointMatch = line.match(/^\s+[•\-\*]\s*(.+)$/) || line.match(/^\s+(\d+)[.)]\s*(.+)$/);
        if (subPointMatch) {
          const subPoint = subPointMatch[subPointMatch.length - 1].trim();
          if (subPoint) {
            segments.push(subPoint);
          }
          continue;
        }
      }
      
      // Regular text line
      if (line.length > 0) {
        if (inList && currentSegment.trim()) {
          segments.push(currentSegment.trim());
          currentSegment = '';
          inList = false;
        }
        if (currentSegment) {
          currentSegment += ' ' + line;
        } else {
          currentSegment = line;
        }
      } else {
        // Empty line - end current segment
        if (currentSegment.trim()) {
          segments.push(currentSegment.trim());
          currentSegment = '';
          inList = false;
        }
      }
    }
    
    // Add remaining segment
    if (currentSegment.trim()) {
      segments.push(currentSegment.trim());
    }
    
    // If no segments found, return the original text
    if (segments.length === 0) {
      return [text.trim()];
    }
    
    return segments.filter(s => s.length > 0);
  };

  // Text-to-Speech function - ALWAYS speaks, point-by-point with pauses (SAFE VERSION)
  const speakText = (text: string) => {
    // Safety check: Don't proceed if component is unmounted
    if (!isMountedRef.current) {
      console.warn('Component unmounted, skipping TTS');
      return;
    }

    try {
      // Check browser support
      if (!('speechSynthesis' in window)) {
        console.error('Speech Synthesis not supported in this browser');
        if (isMountedRef.current) {
          toast({
            title: "Text-to-Speech Unavailable",
            description: "Your browser doesn't support text-to-speech. Please use a modern browser.",
            variant: "destructive",
          });
        }
        return;
      }

      // Get or initialize synthesis
      if (!synthesisRef.current) {
        try {
          synthesisRef.current = window.speechSynthesis;
        } catch (err) {
          console.error('Error accessing speechSynthesis:', err);
          return;
        }
      }

      if (!synthesisRef.current) {
        console.error('Speech Synthesis API not available');
        return;
      }

      // Cancel any ongoing speech BEFORE starting new speech
      try {
        synthesisRef.current.cancel();
        // Clear any pending utterance
        if (currentUtteranceRef.current) {
          currentUtteranceRef.current = null;
        }
        // Clear any pending timeouts
        if (speakTimeoutRef.current) {
          clearTimeout(speakTimeoutRef.current);
          speakTimeoutRef.current = null;
        }
        if (segmentTimeoutRef.current) {
          clearTimeout(segmentTimeoutRef.current);
          segmentTimeoutRef.current = null;
        }
      } catch (err) {
        console.error('Error canceling previous speech:', err);
      }

      // Parse text into segments (points, headings, etc.)
      let finalSegments: string[] = [];
      try {
        const segments = parseTextForSpeech(text);
        finalSegments = segments.length > 0 ? segments : [text.trim()];
      } catch (err) {
        console.error('Error parsing text for speech:', err);
        finalSegments = [text.trim()];
      }
      
      if (finalSegments.length === 0 || !finalSegments[0] || finalSegments[0].length === 0) {
        console.warn('No text to speak');
        return;
      }

      // Safety check before state update
      if (!isMountedRef.current) return;
      setIsSpeaking(true);

      let currentIndex = 0;

      const speakNextSegment = () => {
        // Safety check: Don't proceed if component is unmounted
        if (!isMountedRef.current) {
          console.log('Component unmounted during speech, stopping');
          try {
            if (synthesisRef.current) {
              synthesisRef.current.cancel();
            }
          } catch (err) {
            console.error('Error canceling speech on unmount:', err);
          }
          return;
        }

        // Check if we've finished all segments
        if (currentIndex >= finalSegments.length) {
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
          currentUtteranceRef.current = null;
          return;
        }

        const segment = finalSegments[currentIndex];
        if (!segment || segment.trim().length === 0) {
          currentIndex++;
          segmentTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              speakNextSegment();
            }
          }, 300);
          return;
        }

        try {
          const utterance = new SpeechSynthesisUtterance(segment);
          currentUtteranceRef.current = utterance;
          
          // Clear, natural, and calm voice settings
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          utterance.lang = 'en-US';

          // Safe event handlers with mounted checks
          utterance.onstart = () => {
            if (!isMountedRef.current) return;
            console.log('Started speaking segment:', currentIndex + 1);
          };

          utterance.onend = () => {
            if (!isMountedRef.current) return;
            
            try {
              console.log('Finished speaking segment:', currentIndex + 1);
              currentIndex++;
              
              // Add pause between points (500ms for better clarity)
              if (currentIndex < finalSegments.length) {
                segmentTimeoutRef.current = setTimeout(() => {
                  if (isMountedRef.current) {
                    speakNextSegment();
                  }
                }, 500);
              } else {
                if (isMountedRef.current) {
                  setIsSpeaking(false);
                }
                currentUtteranceRef.current = null;
              }
            } catch (err) {
              console.error('Error in onend handler:', err);
              if (isMountedRef.current) {
                setIsSpeaking(false);
              }
            }
          };

          utterance.onerror = (event) => {
            if (!isMountedRef.current) return;
            
            try {
              console.error('Speech synthesis error:', event.error, event);
              
              // Don't show toast for common non-critical errors
              if (event.error !== 'interrupted' && event.error !== 'canceled') {
                toast({
                  title: "Speech Error",
                  description: `Failed to speak: ${event.error}`,
                  variant: "destructive",
                });
              }
              
              // Continue with next segment even if one fails
              currentIndex++;
              if (currentIndex < finalSegments.length) {
                segmentTimeoutRef.current = setTimeout(() => {
                  if (isMountedRef.current) {
                    speakNextSegment();
                  }
                }, 300);
              } else {
                if (isMountedRef.current) {
                  setIsSpeaking(false);
                }
                currentUtteranceRef.current = null;
              }
            } catch (err) {
              console.error('Error in onerror handler:', err);
              if (isMountedRef.current) {
                setIsSpeaking(false);
              }
            }
          };

          // Use a small delay to ensure the API is ready
          speakTimeoutRef.current = setTimeout(() => {
            if (!isMountedRef.current) return;
            
            try {
              if (synthesisRef.current) {
                synthesisRef.current.speak(utterance);
              }
            } catch (error) {
              console.error('Error calling speak:', error);
              if (isMountedRef.current) {
                setIsSpeaking(false);
              }
              currentUtteranceRef.current = null;
            }
          }, 100);
        } catch (err) {
          console.error('Error creating utterance:', err);
          if (isMountedRef.current) {
            setIsSpeaking(false);
          }
        }
      };

      // Start speaking the first segment
      speakNextSegment();
    } catch (err) {
      console.error('Error in speakText:', err);
      if (isMountedRef.current) {
        setIsSpeaking(false);
      }
    }
  };

  // Stop speaking (SAFE VERSION)
  const stopSpeaking = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      // Clear any pending timeouts
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }
      
      // Cancel speech synthesis
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      
      // Clear current utterance reference
      currentUtteranceRef.current = null;
      
      // Update state only if component is mounted
      if (isMountedRef.current) {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error('Error stopping speech:', err);
    }
  };

  // Clear chat history (SAFE VERSION)
  const clearChatHistory = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      if (isMountedRef.current) {
        setMessages([]);
        localStorage.removeItem(CHAT_HISTORY_KEY);
        toast({
          title: "Chat Cleared",
          description: "Chat history has been cleared.",
        });
      }
    } catch (err) {
      console.error('Error clearing chat history:', err);
    }
  };

  // Handle voice input toggle (SAFE VERSION)
  const toggleVoiceInput = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isMountedRef.current) return;
    
    try {
      if (!browserSupport.speechRecognition) {
        toast({
          title: "Voice Input Unavailable",
          description: "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.",
          variant: "destructive",
        });
        return;
      }

      if (isListening) {
        // Stop listening
        try {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
          if (isMountedRef.current) {
            setIsListening(false);
          }
        } catch (err) {
          console.error('Error stopping recognition:', err);
          if (isMountedRef.current) {
            setIsListening(false);
          }
        }
      } else {
        // Start listening
        try {
          if (recognitionRef.current) {
            recognitionRef.current.start();
            if (isMountedRef.current) {
              setIsListening(true);
              toast({
                title: "Listening...",
                description: "Speak now. Click the microphone again to stop.",
              });
            }
          }
        } catch (error: any) {
          console.error('Error starting recognition:', error);
          if (isMountedRef.current) {
            setIsListening(false);
            
            if (error.message?.includes('not-allowed') || error.name === 'NotAllowedError') {
              toast({
                title: "Microphone Permission Denied",
                description: "Please allow microphone access in your browser settings and try again.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Voice Input Error",
                description: "Failed to start voice input. Please try again.",
                variant: "destructive",
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in toggleVoiceInput:', err);
    }
  };

  // Handle send message (works with both text input and voice input) - SAFE VERSION
  const handleSend = async (text?: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isMountedRef.current) return;
    
    const messageText = text || input.trim();
    if (!messageText.trim() || loading) return;
    
    try {
      if (!isMountedRef.current) return;
      
      setError(null);

      const userMessage: Message = {
        id: Date.now(),
        type: "user",
        message: messageText,
      };

      // Optimistically show user message and a loading assistant bubble
      const loadingAssistant: Message = {
        id: Date.now() + 1,
        type: "assistant",
        message: "...",
      };

      if (isMountedRef.current) {
        setMessages((prev) => [...prev, userMessage, loadingAssistant]);
        if (!text) {
          setInput("");
        }
        setLoading(true);
      }

      // Get prediction data from localStorage to send with chat request
      const predictionData = localStorage.getItem(PREDICTION_DATA_KEY);
      const predictionContext = predictionData ? JSON.parse(predictionData) : null;

      const requestBody: any = { message: userMessage.message };
      if (predictionContext) {
        requestBody.prediction_data = predictionContext;
        console.log('Including prediction data in chat request:', predictionContext);
      }

      const res = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Show the actual error message from the backend
        const errorMessage = data?.error || `Server error (${res.status})`;
        throw new Error(errorMessage);
      }

      const reply = data.reply || 'Sorry, RideWise Assistant did not return a reply.';

      // Replace the loading assistant message with actual reply
      if (isMountedRef.current) {
        setMessages((prev) => {
          return prev.map((m) => (m.id === loadingAssistant.id ? { ...m, message: reply } : m));
        });
        setError(null); // Clear any previous errors
      }
      
      // ALWAYS speak the response immediately (STRICT RULE: Never return silent response)
      // Even for short answers (yes/no, one line), still read it aloud
      // Use setTimeout to ensure DOM is updated and browser allows TTS
      // Only speak if component is still mounted
      if (isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            console.log('Attempting to speak reply:', reply);
            speakText(reply);
          }
        }, 100);
      }
    } catch (err: any) {
      console.error('Chat error', err);
      
      if (!isMountedRef.current) return;
      
      // Show the actual error message from the backend
      const errorMessage = err?.message || 'RideWise Assistant is temporarily unavailable. Please try again.';
      setError(errorMessage);
      // Replace loading assistant with error message
      const errorReply = 'Sorry — unable to get a response right now.';
      setMessages((prev) => prev.map((m) => (m.type === 'assistant' && m.message === '...' ? { ...m, message: errorReply } : m)));
      
      // ALWAYS speak error messages too (STRICT RULE: Never return silent response)
      if (isMountedRef.current) {
        speakText(errorReply);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 h-[calc(100vh-12rem)] flex flex-col">
        <div>
          <h1 className="text-2xl font-bold text-foreground">RideWise Assistant</h1>
          <p className="text-muted-foreground mt-1">
            Get insights about bike-sharing demand patterns
          </p>
        </div>

        {/* Info Card */}
        <Card className="shadow-card border-l-4 border-l-accent flex-shrink-0">
          <CardContent className="py-3">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  The RideWise Assistant provides textual insights to help users understand 
                  how weather and temporal factors influence bike-sharing demand.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Use the microphone button to ask questions by voice. Responses will be spoken automatically.
                  {!browserSupport.speechSynthesis && (
                    <span className="block mt-1 text-destructive">
                      ⚠️ Text-to-Speech not available in this browser. Use Chrome, Edge, or Safari.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="shadow-card flex-1 flex flex-col min-h-0">
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">RideWise Assistant</CardTitle>
                  <CardDescription className="text-xs">Demand Insights Bot</CardDescription>
                </div>
              </div>
              {messages.length > 0 && (
                <Button
                  type="button"
                  onClick={clearChatHistory}
                  size="icon"
                  variant="ghost"
                  title="Clear chat history"
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.type === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2.5 text-sm",
                      msg.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2 pt-4 flex-shrink-0 border-t mt-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about bike demand patterns..."
                className="flex-1"
                disabled={loading || isListening}
              />
              <Button
                type="button"
                onClick={toggleVoiceInput}
                size="icon"
                variant={isListening ? "destructive" : "outline"}
                disabled={loading || !browserSupport.speechRecognition}
                title={isListening ? "Stop recording" : "Start voice input"}
                className={cn(
                  isListening && "animate-pulse"
                )}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              {isSpeaking && (
                <Button
                  type="button"
                  onClick={stopSpeaking}
                  size="icon"
                  variant="outline"
                  title="Stop speaking"
                >
                  <Volume2 className="h-4 w-4 animate-pulse" />
                </Button>
              )}
              <Button 
                type="button"
                onClick={(e) => handleSend(undefined, e)} 
                size="icon" 
                disabled={loading || isListening}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              {loading && (
                <div className="text-xs text-muted-foreground">Thinking...</div>
              )}
              {isListening && (
                <div className="text-xs text-primary flex items-center gap-1">
                  <Mic className="h-3 w-3 animate-pulse" />
                  Listening... Speak now
                </div>
              )}
              {isSpeaking && (
                <div className="text-xs text-primary flex items-center gap-1">
                  <Volume2 className="h-3 w-3 animate-pulse" />
                  Speaking...
                </div>
              )}
              {error && (
                <div className="text-xs text-destructive">{error}</div>
              )}
              {!browserSupport.speechRecognition && (
                <div className="text-xs text-muted-foreground">
                  Voice input not available in this browser. Use Chrome, Edge, or Safari for voice features.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
