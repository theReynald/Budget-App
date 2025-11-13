import React, { useState, useRef, useEffect } from 'react';
import { Transaction, ChatMessage } from '../types';
import { nanoid } from 'nanoid';

interface FinancialAdvisorChatProps {
    startingBalance: number;
    transactions: Transaction[];
}

export function FinancialAdvisorChat({ startingBalance, transactions }: FinancialAdvisorChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionId = useRef(nanoid());

    const API_BASE = ((import.meta as unknown) as { env?: Record<string, string> }).env?.VITE_API_BASE || '';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const resp = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Id': sessionId.current
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    context: {
                        startingBalance,
                        transactions
                    }
                })
            });

            if (!resp.ok) {
                throw new Error(`Chat failed (${resp.status})`);
            }

            const data = await resp.json();
            if (!data.ok) {
                throw new Error(data.error || 'Chat failed');
            }

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.data.message,
                timestamp: data.data.timestamp
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: `Error: ${msg}`,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const quickQuestions = [
        'How can I save more money?',
        'Is my spending healthy?',
        'What should I focus on improving?',
        'Am I spending too much on food?'
    ];

    const askQuickQuestion = (question: string) => {
        setInput(question);
        setExpanded(true);
    };

    if (!expanded) {
        return (
            <section className="bg-white border border-gray-100 rounded-md shadow-sm p-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">🤖 AI Financial Advisor</h2>
                            <p className="text-xs text-gray-500">Ask questions about your budget</p>
                        </div>
                        <button
                            onClick={() => setExpanded(true)}
                            className="px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-opacity-90 transition"
                        >
                            Start Chat
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {quickQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => askQuickQuestion(q)}
                                className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 transition"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-white border border-gray-100 rounded-md shadow-sm p-4 space-y-3">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">🤖 AI Financial Advisor</h2>
                    <p className="text-xs text-gray-500">Ask me anything about your budget</p>
                </div>
                <button
                    onClick={() => setExpanded(false)}
                    className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition"
                >
                    Minimize
                </button>
            </header>

            {/* Messages */}
            <div className="border border-gray-200 rounded p-3 h-64 overflow-y-auto space-y-3 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-sm text-gray-500 py-8">
                        <p className="mb-3">👋 Hi! I&apos;m your AI financial advisor.</p>
                        <p className="text-xs">Ask me questions about your budget, spending, or saving strategies.</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={
                            'rounded p-3 text-xs ' +
                            (msg.role === 'user'
                                ? 'bg-accent text-white ml-8'
                                : 'bg-white border border-gray-200 mr-8')
                        }
                    >
                        <div className="font-medium mb-1 text-[10px] opacity-70">
                            {msg.role === 'user' ? 'You' : 'AI Advisor'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                ))}
                {loading && (
                    <div className="bg-white border border-gray-200 rounded p-3 text-xs mr-8">
                        <div className="font-medium mb-1 text-[10px] opacity-70">AI Advisor</div>
                        <div className="flex items-center gap-1">
                            <span>Thinking</span>
                            <span className="animate-pulse">...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={sendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask a question about your budget..."
                    className="flex-1 rounded border-gray-300 text-sm"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </form>

            {/* Quick Questions */}
            {messages.length === 0 && (
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 w-full">Quick questions:</span>
                    {quickQuestions.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => setInput(q)}
                            className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 transition"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            <p className="text-[10px] text-gray-400 italic text-center">
                AI responses are educational only. Rate limited to 5 messages per minute.
            </p>
        </section>
    );
}

export default FinancialAdvisorChat;
