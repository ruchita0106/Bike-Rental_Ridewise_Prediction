import { useState } from "react";
import { Send, Bot, Info } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  type: "user" | "assistant";
  message: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setError(null);

    const userMessage: Message = {
      id: Date.now(),
      type: "user",
      message: input.trim(),
    };

    // Optimistically show user message and a loading assistant bubble
    const loadingAssistant: Message = {
      id: Date.now() + 1,
      type: "assistant",
      message: "...",
    };

    setMessages((prev) => [...prev, userMessage, loadingAssistant]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.message })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Show the actual error message from the backend
        const errorMessage = data?.error || `Server error (${res.status})`;
        throw new Error(errorMessage);
      }

      const reply = data.reply || 'Sorry, RideWise Assistant did not return a reply.';

      // Replace the loading assistant message with actual reply
      setMessages((prev) => {
        return prev.map((m) => (m.id === loadingAssistant.id ? { ...m, message: reply } : m));
      });
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Chat error', err);
      // Show the actual error message from the backend
      const errorMessage = err?.message || 'RideWise Assistant is temporarily unavailable. Please try again.';
      setError(errorMessage);
      // Replace loading assistant with error message
      setMessages((prev) => prev.map((m) => (m.type === 'assistant' && m.message === '...' ? { ...m, message: 'Sorry — unable to get a response right now.' } : m)));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
              <p className="text-sm text-muted-foreground">
                The RideWise Assistant provides textual insights to help users understand 
                how weather and temporal factors influence bike-sharing demand.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="shadow-card flex-1 flex flex-col min-h-0">
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">RideWise Assistant</CardTitle>
                <CardDescription className="text-xs">Demand Insights Bot</CardDescription>
              </div>
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
                disabled={loading}
              />
              <Button onClick={handleSend} size="icon" disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {loading && (
              <div className="text-xs text-muted-foreground mt-2">Thinking...</div>
            )}
            {error && (
              <div className="text-xs text-destructive mt-2">{error}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
