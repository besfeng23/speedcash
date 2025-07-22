
'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import Image from 'next/image';

interface Message {
  sender: 'USER' | 'AI';
  text: string;
}

const isImageDataUri = (text: string) => text.startsWith('data:image/');

export function ChatAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { user, role } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const askKaiMutation = useApi('cpayDispatcher');

  useEffect(() => {
    if (isOpen && user) {
      let initialGreeting = "Hi! I’m Kai, the AI assistant for CPay. 👋 I'm here to help with your wallet, transactions, or anything else you need.";

      switch (role) {
        case 'partner':
          initialGreeting = "Hello and welcome! I’m Kai, your CPay AI co-pilot. I’ll assist with partner tools, payouts, account help, or onboarding questions.";
          break;
        case 'admin':
        case 'superadmin':
          initialGreeting = "Welcome, Admin. I’m Kai — CPay’s intelligent AI assistant. I’m ready to support you with privileged actions like user suspension or image generation.";
          break;
      }
      
      setMessages([{ sender: 'AI', text: initialGreeting }]);
    }
  }, [isOpen, user, role]);

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, askKaiMutation.isPending]);


  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || askKaiMutation.isPending) return;
    
    const userMessage: Message = { sender: 'USER', text: input };
    const currentMessages = [...messages, userMessage];
    
    setMessages(currentMessages);
    const currentInput = input;
    setInput('');

    const response = await askKaiMutation.mutateAsync({
        action: 'askAuthenticatedKai',
        payload: {
            query: currentInput,
            // Pass the history *before* the user's current message
            conversationHistory: messages 
        }
    });
    
    if (response) {
      setMessages(prev => [...prev, { sender: 'AI', text: (response as any).reply }]);
    }
  };

  if (!user) {
    return null; 
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg" size="icon">
        <Bot className="h-8 w-8"/>
        <span className="sr-only">Open Chat</span>
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm z-50">
        <Card className="flex flex-col h-[60vh] rounded-2xl shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-primary"/>
                    <CardTitle className="text-lg">Kai Assistant</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X size={20} />
                    <span className="sr-only">Close Chat</span>
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-2", { 'justify-end flex-row-reverse': msg.sender === 'USER' })}>
                             {msg.sender === 'AI' && <Bot className="h-6 w-6 self-start text-primary flex-shrink-0"/>}
                             {msg.sender === 'USER' && (
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs">
                                    {user.displayName?.charAt(0) || 'U'}
                                </div>
                             )}
                            <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm break-words", 
                                msg.sender === 'AI' ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
                            )}>
                                 {isImageDataUri(msg.text) ? (
                                    <div className="p-2 bg-background rounded-md">
                                        <Image src={msg.text} alt="Generated by AI" width={256} height={256} className="rounded-md" data-ai-hint="illustration design"/>
                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Image generated by AI</p>
                                    </div>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    ))}
                    {askKaiMutation.isPending && (
                        <div className="flex items-start gap-2">
                             <Bot className="h-6 w-6 self-start text-primary flex-shrink-0"/>
                            <div className="bg-muted rounded-lg px-3 py-2 flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>
                            </div>
                        </div>
                    )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t">
                <form onSubmit={handleSend} className="flex w-full items-center gap-2">
                    <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask something..." autoComplete="off"/>
                    <Button type="submit" size="icon" disabled={askKaiMutation.isPending || !input.trim()}>
                        <Send />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    </div>
  );
}
