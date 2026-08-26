import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  Sparkles,
  BookOpen,
  Send,
  Loader2,
  FileText,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataService } from '@/lib/data-service';
import { PythonRagDocument } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export function PythonRagAssistant() {
  const { profile, role } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [retrievedDocs, setRetrievedDocs] = useState<PythonRagDocument[]>([]);
  const [modelUsed, setModelUsed] = useState<string>('');

  const sampleQuestions = [
    'What is the two-adult rule for childcare safety?',
    'How do AV volunteers prepare Sunday live audio & OBS stream?',
    'How are volunteer service points and badges awarded?',
    'What are the facilities setup and sanctuary lighting protocols?',
    'What are the guidelines for prayer team and pastoral counseling?',
  ];

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim()) return;
    setLoading(true);
    setAnswer(null);
    setRetrievedDocs([]);

    try {
      const response = await DataService.askGeminiRagAssistant(questionText, {
        name: profile?.name || 'Volunteer',
        role: role,
        department: profile?.department || 'General Ministry',
      });

      setAnswer(response.answer);
      setRetrievedDocs(response.retrievedDocuments || []);
      setModelUsed(response.modelUsed || 'Python RAG Vector Engine');
    } catch (e) {
      console.error(e);
      setAnswer('Unable to query the RAG assistant at this moment. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-glow/10 via-primary/10 to-accent/10 border border-glow/30">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-glow/20 text-glow flex items-center justify-center shrink-0 border border-glow/30">
            <Brain className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-glow/20 text-glow font-bold border border-glow/40">
                PYTHON RAG & GEMINI AI
              </span>
              <span className="text-xs text-foreground/60">Ministry Policy & Standard Operating Procedure Vector Index</span>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              SOP & Ministry Knowledge Base (RAG Search)
            </h3>
            <p className="text-xs sm:text-sm text-foreground/70 mt-1 max-w-3xl">
              Powered by Python TF-IDF Vector Embeddings and Gemini 3.7 Flash. Semantically search church volunteer manuals, safety protocols, AV setups, and pastoral directives with grounded document citations.
            </p>
          </div>
        </div>
      </div>

      {/* Query Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(query)}
            placeholder="Ask anything about church policies, AV procedures, childcare safety, or points..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-border text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:border-glow/60"
          />
        </div>
        <Button
          onClick={() => handleAsk(query)}
          disabled={loading || !query.trim()}
          className="gap-2 shrink-0 bg-glow text-background font-bold hover:brightness-110"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Retrieving & Reasoning...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Ask RAG AI
            </>
          )}
        </Button>
      </div>

      {/* Suggested Quick Queries */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-foreground/50 font-medium">Quick Prompts:</span>
        {sampleQuestions.map((q) => (
          <button
            key={q}
            onClick={() => {
              setQuery(q);
              handleAsk(q);
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-foreground/80 hover:text-foreground border border-border hover:border-glow/30 transition-colors text-left"
          >
            💡 {q}
          </button>
        ))}
      </div>

      {/* Answer & Retrieved Grounding Documents */}
      <AnimatePresence>
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-5 p-5 rounded-2xl bg-white/5 border border-border"
          >
            {/* AI Answer Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-glow font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  AI Pastoral & SOP Answer
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-glow/10 text-glow font-mono">
                  Engine: {modelUsed}
                </span>
              </div>
              <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line bg-background/50 p-4 rounded-xl border border-border">
                {answer}
              </div>
            </div>

            {/* Retrieved Context Chunks (RAG Grounding) */}
            {retrievedDocs.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-3 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-glow" />
                  Retrieved Knowledge Base Grounding ({retrievedDocs.length} Chunks Matched)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {retrievedDocs.map((doc, i) => (
                    <div
                      key={doc.id || i}
                      className="p-3.5 rounded-xl bg-white/5 border border-border/80 hover:border-glow/40 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-glow/15 text-glow">
                            {doc.category}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-glow">
                            {doc.similarity}% Match
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-foreground mb-1 line-clamp-1">
                          {doc.title}
                        </h5>
                        <p className="text-xs text-foreground/70 line-clamp-4 leading-relaxed">
                          {doc.content}
                        </p>
                      </div>

                      {doc.matched_terms && doc.matched_terms.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-border/50 flex flex-wrap gap-1">
                          {doc.matched_terms.map((t) => (
                            <span
                              key={t}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-background text-foreground/60"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
