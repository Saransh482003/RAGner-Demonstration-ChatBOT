import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { 
  Send, Database, Network, Zap, ChevronDown, ChevronUp, Loader2, 
  Globe, Mail, MessageSquare
} from "lucide-react";
import { FiLinkedin, FiGithub } from "react-icons/fi";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { COMPANY_DIRECTORY } from "@/config/companies";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SourceCard = ({ source }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getBadgeClass = (type) => {
    switch (type) {
      case "graph_edge": return styles.labelGraph;
      case "raptor_summary": 
      case "raptor_root_summary": return styles.labelRaptor;
      case "table": return styles.labelTable;
      default: return styles.labelText;
    }
  };

  const getLabel = (type) => {
    if (type === "graph_edge") return "Knowledge Graph";
    if (type?.includes("raptor")) return "RAPTOR Tree";
    if (type === "table") return "Data Table";
    return "Document Text";
  };

  return (
    <div className={styles.sourceCard}>
      <div className={styles.sourceHeader}>
        <div className={styles.sourceMeta}>
          <span className={`${styles.sourceLabel} ${getBadgeClass(source.metadata.chunk_type)}`}>
            {getLabel(source.metadata.chunk_type)}
          </span>
          <span style={{ color: "#6b7280", fontWeight: 500 }}>{source.metadata.source}</span>
          <span style={{ color: "#9ca3af" }}>| Page {source.metadata.page_number}</span>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      <div className={`${styles.sourceText} ${expanded ? "" : styles.collapsed}`}>
        {source.text}
      </div>
      
      {expanded && source.cross_encoder_score && (
        <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "#9ca3af", fontFamily: "monospace" }}>
          Relevance Score: {source.cross_encoder_score.toFixed(4)}
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  
  // Safely initialize with master, then update when Next.js hydration completes
  const [currentCompany, setCurrentCompany] = useState(COMPANY_DIRECTORY.master);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [strategy, setStrategy] = useState("auto");
  const [selectedDoc, setSelectedDoc] = useState("all");
  const [isQuerying, setIsQuerying] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Catch the URL parameter dynamically 
  useEffect(() => {
    if (router.isReady) {
      const slug = (router.query.company || router.query.c || "master").toString().toLowerCase();
      setCurrentCompany(COMPANY_DIRECTORY[slug] || COMPANY_DIRECTORY.master);
      
      // Reset chat and doc selection when the company context switches
      setMessages([]);
      setSelectedDoc("all");
    }
  }, [router.isReady, router.query]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submitQuery = async (queryText) => {
    if (!queryText.trim() || isQuerying) return;

    setMessages(prev => [...prev, { role: "user", content: queryText }]);
    setIsQuerying(true);

    try {
      const response = await fetch("https://scaler-chatbot-ragner.onrender.com/api/v1/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          strategy: strategy,
          project_name: currentCompany.projectName, // Sends `null` for Global, or "nvidia" for scoped
          document_name: selectedDoc === "all" ? null : selectedDoc
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: data.answer,
          sources: data.sources,
          strategy_used: data.strategy_used
        }]);
      } else {
        throw new Error(data.detail || "Query failed");
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", content: `❌ Error: ${error.message}`, isError: true }]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const userQuery = input;
    setInput("");
    submitQuery(userQuery);
  };

  return (
    <>
      <Head>
        <title>{`${currentCompany.displayName} ChatBOT | by Saransh Saini`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className={`${styles.container} ${geistSans.variable} ${geistMono.variable}`}>
        
        {/* Sidebar */}
        <div className={styles.sidebar} style={{ display: "flex", flexDirection: "column" }}>
          <div className={styles.header}>
            <h1 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={24} color="#3b82f6" />
              <span>
                <span style={{ color: "#3b82f6", fontWeight: "800" }}>{currentCompany.displayName}</span>
                <span style={{ color: "#000000", fontWeight: "800", marginLeft: "4px" }}>ChatBOT</span>
              </span>
            </h1>
            <p className={styles.subtitle}>Custom Knowledge Agent</p>
          </div>

          <div className={styles.sidebarContent} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            
            <div style={{ marginTop: "16px" }}>
              <h2 className={styles.sectionTitle}>Indexed Corpus</h2>
              <ul className={styles.docList} style={{ padding: 0, listStyle: "none" }}>
                {currentCompany.docs.map((doc, idx) => (
                  <li key={idx} className={styles.docItem} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 0", fontSize: "0.875rem", color: "#4b5563" }}>
                    <Database size={14} color="#3b82f6" />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Personal Details Section */}
            <div style={{ marginTop: "auto", paddingTop: "24px", borderTop: "1px solid #e5e7eb" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginBottom: "12px" }}>
                Developed By
              </p>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", margin: "0 0 4px 0" }}>Saransh Saini</h3>
              <p style={{ fontSize: "0.875rem", color: "#4b5563", margin: "0 0 12px 0" }}>IIT Madras | BS Data Science</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <a href="mailto:saransh.saini.ai@gmail.com" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem", color: "#3b82f6", textDecoration: "none" }}>
                  <Mail size={16} /> saransh.saini.ai@gmail.com
                </a>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                  <a href="https://www.linkedin.com/in/saranshsaini48/" target="_blank" rel="noopener noreferrer" style={{ color: "#6b7280", transition: "color 0.2s" }} onMouseOver={(e) => e.target.style.color = "#3b82f6"} onMouseOut={(e) => e.target.style.color = "#6b7280"}>
                    <FiLinkedin size={20} />
                  </a>
                  <a href="https://github.com/Saransh482003" target="_blank" rel="noopener noreferrer" style={{ color: "#6b7280", transition: "color 0.2s" }} onMouseOver={(e) => e.target.style.color = "#111827"} onMouseOut={(e) => e.target.style.color = "#6b7280"}>
                    <FiGithub size={20} />
                  </a>
                  <a href="https://www.saranshsaini.in/" target="_blank" rel="noopener noreferrer" style={{ color: "#6b7280", transition: "color 0.2s" }} onMouseOver={(e) => e.target.style.color = "#3b82f6"} onMouseOut={(e) => e.target.style.color = "#6b7280"}>
                    <Globe size={20} />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Main Chat Area */}
        <div className={styles.chatArea}>
          <div className={styles.messagesWindow}>
            {messages.length === 0 ? (
              <div className={styles.emptyState} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "20px" }}>
                <Network size={48} color="#3b82f6" style={{ marginBottom: "16px", opacity: 0.8 }} />
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", margin: 0 }}>Agentic Retrieval Active</h2>
                
                <div style={{ marginTop: "24px", textAlign: "left", maxWidth: "600px", width: "100%", fontSize: "0.875rem", color: "#4b5563" }}>
                  <p style={{ margin: "0 0 16px 0", fontWeight: 600, color: "#374151", textAlign: "center" }}>Try testing the pipeline with these sample queries:</p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {currentCompany.sampleQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => submitQuery(q)}
                        disabled={isQuerying}
                        style={{
                          background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 16px",
                          fontSize: "0.875rem", color: "#374151", textAlign: "left", cursor: isQuerying ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "flex-start", gap: "12px", transition: "all 0.2s ease",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                        }}
                        onMouseOver={(e) => { if(!isQuerying) { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#1d4ed8"; } }}
                        onMouseOut={(e) => { if(!isQuerying) { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; } }}
                      >
                        <MessageSquare size={16} style={{ marginTop: "2px", flexShrink: 0, color: "#9ca3af" }} />
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                const rowClass = isUser ? styles.rowUser : styles.rowAi;
                let bubbleClass = styles.bubbleAi;
                if (isUser) bubbleClass = styles.bubbleUser;
                if (msg.isError) bubbleClass = styles.bubbleError;

                return (
                  <div key={idx} className={`${styles.messageRow} ${rowClass}`}>
                    <div className={`${styles.bubble} ${bubbleClass}`}>
                      
                      {msg.strategy_used && (
                        <div className={styles.strategyBadge}>
                          <Zap size={12} />
                          Routed via {msg.strategy_used}
                        </div>
                      )}

                      <div className={styles.markdownProse}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {msg.sources && msg.sources.length > 0 && (
                        <div className={styles.sourcesSection}>
                          <h4 className={styles.sourcesTitle}>Grounding Sources</h4>
                          <div>
                            {msg.sources.map((source, sIdx) => (
                              <SourceCard key={sIdx} source={source} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            
            {isQuerying && (
              <div className={`${styles.messageRow} ${styles.rowAi}`}>
                <div className={styles.loadingPill}>
                  <Loader2 size={18} className={styles.spin} />
                  <span>Navigating Vector Space & Knowledge Graph...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={styles.inputArea}>
            <form onSubmit={handleFormSubmit} className={styles.inputForm}>
              <div className={styles.selectGroup}>
                <select 
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="auto">Auto-Router</option>
                  <option value="vanilla">Vanilla Vector</option>
                  <option value="raptor">RAPTOR Tree</option>
                  <option value="graph">Knowledge Graph</option>
                </select>

                <select 
                  value={selectedDoc}
                  onChange={(e) => setSelectedDoc(e.target.value)}
                  className={styles.selectInput}
                  style={{ textOverflow: "ellipsis", maxWidth: "200px" }}
                >
                  <option value="all">Global Corpus ({currentCompany.displayName})</option>
                  {currentCompany.docs.map((doc, idx) => (
                    <option key={idx} value={doc}>{doc}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Ask a question about ${currentCompany.displayName}'s documentation...`}
                  className={styles.textInput}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isQuerying}
                  className={styles.sendBtn}
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}