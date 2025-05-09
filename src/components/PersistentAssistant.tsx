
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, ChevronUp, ChevronDown, Send, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get context-aware suggestions based on the current path
  const getContextSuggestions = () => {
    const path = location.pathname;
    
    if (path === "/profile") {
      return [
        "How can I improve my professional summary?",
        "What details should I add to my background?",
        "How do LinkedIn profiles help my job search?"
      ];
    } else if (path === "/job-targets") {
      return [
        "What industries should I target?",
        "How specific should my job target be?",
        "How do I prioritize companies?"
      ];
    } else if (path === "/companies") {
      return [
        "Help me find companies in my industry",
        "What makes a good target company?",
        "How should I approach cold outreach?"
      ];
    } else if (path === "/tracking") {
      return [
        "How often should I follow up?",
        "What's a good format for follow-up messages?",
        "How do I track multiple conversations?"
      ];
    } else if (path === "/pipeline") {
      return [
        "How can I improve my conversion rates?",
        "What metrics should I focus on?",
        "How many companies should I target at once?"
      ];
    }
    
    return [
      "How can I use EngageAI effectively?",
      "What should I do next in my job search?",
      "How do I get started with networking?"
    ];
  };
  
  const suggestions = getContextSuggestions();
  
  // Get context-aware greeting
  useEffect(() => {
    if (!user || messages.length > 1) return;
    
    const path = location.pathname;
    let contextMessage = "";
    
    if (path === "/profile") {
      contextMessage = "I see you're on your profile page. Need help completing your professional information?";
    } else if (path === "/job-targets") {
      contextMessage = "Looking at job targets? I can help you define what roles and companies you're interested in.";
    } else if (path === "/companies") {
      contextMessage = "On the companies page? I can help you identify good prospects and craft outreach messages.";
    } else if (path === "/tracking") {
      contextMessage = "Need help tracking your interactions? I can provide tips for effective follow-ups.";
    } else if (path === "/pipeline") {
      contextMessage = "Looking at your job search pipeline? I can help you optimize your approach.";
    }
    
    if (contextMessage) {
      setMessages([
        {
          text: "Hello! I'm your EngageAI assistant. How can I help with your networking and job search today?",
          isUser: false,
          timestamp: new Date()
        },
        {
          text: contextMessage,
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
  }, [location.pathname, user]);
  
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
      let responseText = "";
      const userText = inputMessage.toLowerCase();
      
      // Some simple pattern matching for common questions
      if (userText.includes("next step") || userText.includes("what should i do")) {
        if (location.pathname === "/") {
          responseText = "I recommend starting by completing your professional profile. This will help us tailor job recommendations for you.";
        } else if (location.pathname === "/profile") {
          responseText = "Once your profile is complete, the next step is to define your job targets - what roles and companies you're interested in.";
        } else if (location.pathname === "/job-targets") {
          responseText = "After defining your targets, head over to the Companies section to start identifying potential employers.";
        } else if (location.pathname === "/companies") {
          responseText = "Now that you've identified companies, start tracking your interactions in the Tracking section.";
        }
      } else if (userText.includes("how") && (userText.includes("improve") || userText.includes("better"))) {
        responseText = "To improve your job search, make sure your profile is complete and specific. The more details you provide, the better we can help you target the right opportunities.";
      } else {
        responseText = `Thanks for your message! I'm here to help with your ${location.pathname === "/profile" ? "profile development" : location.pathname === "/job-targets" ? "job targeting" : location.pathname === "/companies" ? "company research" : "job search"}.`;
      }
      
      const responseMessage: Message = {
        text: responseText,
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
  
  // Handle navigation suggestion
  const handleNavigationSuggestion = (path: string) => {
    navigate(path);
    
    // Add navigation confirmation message
    const systemMessage: Message = {
      text: `I've navigated you to the ${path.replace('/', '')} page. Let me know if you need any help here.`,
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, systemMessage]);
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
                {/* Navigation shortcuts */}
                {user && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    <button
                      className="text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded-full px-3 py-1.5 transition-colors flex items-center"
                      onClick={() => handleNavigationSuggestion("/profile")}
                    >
                      Profile <ArrowRight className="ml-1 h-3 w-3" />
                    </button>
                    <button
                      className="text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded-full px-3 py-1.5 transition-colors flex items-center"
                      onClick={() => handleNavigationSuggestion("/job-targets")}
                    >
                      Targets <ArrowRight className="ml-1 h-3 w-3" />
                    </button>
                    <button
                      className="text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded-full px-3 py-1.5 transition-colors flex items-center"
                      onClick={() => handleNavigationSuggestion("/companies")}
                    >
                      Companies <ArrowRight className="ml-1 h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {/* Context-based suggestions */}
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
