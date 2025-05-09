
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, ChevronUp, ChevronDown, Send } from "lucide-react";
import { useLocation } from "react-router-dom";

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const PersistentAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your EngageAI assistant. How can I help with your networking and job search today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const location = useLocation();
  
  // Get context-aware suggestions based on the current path
  const getContextSuggestions = () => {
    const path = location.pathname;
    
    if (path === "/profile") {
      return [
        "How can I improve my professional summary?",
        "What details should I add to my background?"
      ];
    } else if (path === "/job-targets") {
      return [
        "What industries should I target?",
        "How specific should my job target be?"
      ];
    } else if (path === "/companies") {
      return [
        "Help me find companies in my industry",
        "What makes a good target company?"
      ];
    }
    
    return [
      "How can I use EngageAI effectively?",
      "What should I do next in my job search?"
    ];
  };
  
  const suggestions = getContextSuggestions();
  
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages([...messages, userMessage]);
    setInputMessage("");
    
    // Simulate AI response (in a real app, this would call an API)
    setTimeout(() => {
      const responseMessage: Message = {
        text: `Thanks for your message! I'm here to help with your ${location.pathname === "/profile" ? "profile development" : location.pathname === "/job-targets" ? "job targeting" : "job search"}.`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, responseMessage]);
    }, 1000);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full md:w-96">
      <div className={`rounded-lg shadow-lg transition-all duration-300 ${isOpen ? "h-[500px]" : "h-12"}`}>
        <Button 
          variant="default" 
          className="w-full flex justify-between rounded-b-none" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            <span>EngageAI Assistant</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
        
        {isOpen && (
          <Card className="rounded-t-none border-t-0">
            <CardHeader className="bg-primary/5 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                I'm here to help with your networking and job search needs.
              </p>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[calc(500px-80px)]">
              <div className="flex-1 overflow-y-auto p-3">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`mb-2 ${message.isUser ? "text-right" : ""}`}
                  >
                    <div 
                      className={`inline-block rounded-lg px-3 py-2 text-sm ${
                        message.isUser 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {message.text}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-2 border-t">
                <div className="flex flex-wrap gap-1 mb-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full px-2 py-1 transition-colors"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                
                <div className="flex">
                  <Textarea
                    placeholder="Type a message..."
                    className="min-h-[40px] resize-none"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-2" 
                    onClick={handleSendMessage}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PersistentAssistant;
