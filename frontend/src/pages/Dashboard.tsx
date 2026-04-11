import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ShieldAlert, CheckCircle, Info, FileText, Scale, Activity, Gavel, FileCheck, BarChart2, Download, Printer, Share2, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedSensCols, setSelectedSensCols] = useState<string[]>([]);
  const [targetCol, setTargetCol] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadNotice, setUploadNotice] = useState(''); // for non-tabular file info
  
  const [activeTab, setActiveTab] = useState('inspection'); // kept for backwards compat internally if needed, but not shown
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [docResult, setDocResult] = useState<any>(null); // Result from document bias analysis
  const [showFixedDoc, setShowFixedDoc] = useState(false); // Toggle for side-by-side view
  
  const [inspectResult, setInspectResult] = useState<any>(null);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [mitigateResult, setMitigateResult] = useState<any>(null);
  const [mitigateCol, setMitigateCol] = useState('');
  
  const [analysisStep, setAnalysisStep] = useState(0);

  const fetchInspection = async (target: string) => {
    const formData = new FormData();
    formData.append("target_col", target);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/inspect", {
        method: "POST", body: formData
      });
      const data = await res.json();
      setInspectResult(data);
    } catch(e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploadError('');
    setUploadNotice('');
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    console.log(`[Upload] Selected file: ${uploadedFile.name}, Type: ${uploadedFile.type}, Size: ${uploadedFile.size} bytes`);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      console.log(`[Upload] Sending request to POST /api/upload...`);
      const res = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      
      console.log(`[Upload] Response status: ${res.status} ${res.statusText}`);
      
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Invalid JSON response from server (Status: ${res.status}). The backend may have crashed.`);
      }
      
      console.log(`[Upload] Response payload:`, data);
      
      if (!res.ok || data.error) {
        setUploadError(data.error || `Server error ${res.status}`);
        setColumns([]);
        return;
      }

      // Non-tabular file: show notice, show specific analysis flow
      if (data.file_type_notice) {
        setUploadNotice(""); // Hide the notice from step 1, we will show doc flow in step 2
        setColumns([]);
        setTargetCol('');
        setSelectedSensCols([]);
        setAuditResult(null);
        setDocResult(null);
        return;
      }
      
      setColumns(data.columns);
      setSelectedSensCols(data.sensitive_cols_detected);
      if (data.columns && data.columns.length > 0) {
        setTargetCol(data.columns[0]);
        fetchInspection(data.columns[0]);
      }
      setAuditResult(null);
      setMitigateResult(null);
      setDocResult(null);
    } catch (err: any) {
      console.error("[Upload Error]:", err);
      // Give meaningful error for fetch failures (like CORS or offline server)
      if (err.message.includes("Failed to fetch")) {
        setUploadError("Network connection failed. Please ensure the backend server is running on port 8000 and CORS is enabled.");
      } else {
        setUploadError(err.message || "Failed to reach the backend server.");
      }
      setColumns([]);
    }
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTarget = e.target.value;
    setTargetCol(newTarget);
    fetchInspection(newTarget);
  };

  const toggleSensCol = (colStr: string) => {
    if (selectedSensCols.includes(colStr)) {
      setSelectedSensCols(selectedSensCols.filter(c => c !== colStr));
    } else {
      setSelectedSensCols([...selectedSensCols, colStr]);
    }
  };

  const runAudit = async () => {
    if (selectedSensCols.length === 0) {
      alert("Please select at least one sensitive column.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisStep(0);
    const progressInterval = setInterval(() => {
      setAnalysisStep(prev => prev < 7 ? prev + 1 : prev);
    }, 800);

    const formData = new FormData();
    formData.append("target_col", targetCol);
    formData.append("sensitive_cols", selectedSensCols.join(","));

    try {
      console.log(`[Audit Calculation] Sending request to POST /api/audit ...`);
      const res = await fetch("http://127.0.0.1:8000/api/audit", {
        method: "POST",
        body: formData,
      });
      
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        clearInterval(progressInterval);
        setIsAnalyzing(false);
        throw new Error(`The backend returned an unparseable response (Status: ${res.status}). It likely crashed.`);
      }

      console.log(`[Audit Result] Payload:`, data);
      
      if (!res.ok) {
        const errorMsg = data.detail || data.error || "Unknown server error occurred.";
        throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      setAuditResult(data);
      if (selectedSensCols.length > 0) {
        setMitigateCol(selectedSensCols[0]);
      }
    } catch (err: any) {
      console.error("[Audit Crash]:", err);
      alert(`Fairness Analysis Failed:\n${err.message}`);
    }
    clearInterval(progressInterval);
    setAnalysisStep(7);
    setIsAnalyzing(false);
  };

  const runDocAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    const progressInterval = setInterval(() => {
      setAnalysisStep(prev => prev < 7 ? prev + 1 : prev);
    }, 800);
    
    console.log(`[Document Analysis] Sending request to POST /api/analyze-document...`);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/analyze-document", { method: "POST" });
      console.log(`[Document Analysis] Response status: ${res.status}`);
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        clearInterval(progressInterval);
        setIsAnalyzing(false);
        throw new Error(`Invalid JSON response from server (Status: ${res.status}). Ensure the backend is running without errors.`);
      }
      console.log(`[Document Analysis] Response payload:`, data);
      
      if (!res.ok || data.error) {
        alert(data.error || "Document analysis failed.");
      } else {
        setDocResult(data);
      }
    } catch (err: any) {
      console.error("[Document Analysis Error]:", err);
      alert(err.message || "Failed to reach the backend server.");
    }
    clearInterval(progressInterval);
    setAnalysisStep(7);
    setIsAnalyzing(false);
  };

  const runMitigation = async () => {
    const formData = new FormData();
    formData.append("strategy", "Reweighing");
    formData.append("sensitive_col", mitigateCol);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/mitigate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setMitigateResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  const startNewAnalysis = () => {
    setFile(null);
    setColumns([]);
    setTargetCol('');
    setSelectedSensCols([]);
    setAuditResult(null);
    setDocResult(null);
    setUploadNotice('');
    setUploadError('');
    setAnalysisStep(0);
  };

  const exportAsJSON = () => {
    const data = auditResult || docResult;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'axiom_fairness_report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    // simplified CSV dump
    let csvContent = "data:text/csv;charset=utf-8,Category,Value\n";
    if (auditResult) {
      csvContent += `Base Accuracy,${auditResult.accuracy}\n`;
      Object.keys(auditResult.audits).forEach(col => {
        csvContent += `Audit For,${col}\n`;
        const ex = auditResult.audits[col].executive_summary;
        if(ex) {
          csvContent += `Risk Level,${ex.risk_level}\n`;
          csvContent += `Overall Status,${ex.overall_status}\n`;
        }
      });
    } else if (docResult) {
      csvContent += `Domain,${docResult.summary?.domain || 'General'}\n`;
      csvContent += `Readiness,${docResult.summary?.fast_readiness || ''}\n`;
      csvContent += `Overall Risk,${docResult.summary?.overall_risk || ''}\n`;
    }
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = 'axiom_fairness_summary.csv';
    a.click();
  };

  return (
    <div className="bg-background text-foreground min-h-screen pt-24 pb-12">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8">AI Fairness Dashboard</h1>
        
        {/* Step 1: Upload */}
        <div className="mb-8 p-6 border border-border rounded-xl bg-muted/20">
          <h2 className="text-xl font-semibold mb-4">1. Data Source</h2>
          <p className="text-sm text-muted-foreground mb-4">
            <strong>Supported formats:</strong> You can upload CSV, Excel, JSON, TXT, PDF, DOC, and DOCX files.
            Structured datasets (CSV / Excel / JSON) work best for fairness analysis.
          </p>
          <label
            htmlFor="file-upload"
            className="block w-full cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <span
                className="px-4 py-2 rounded-full text-sm font-semibold text-primary-foreground shrink-0"
                style={{ background: 'var(--gradient-primary)' }}
              >
                Choose File
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {file ? file.name : 'No file chosen'}
              </span>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls,.txt,.json,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
          {uploadNotice && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-200">
              ℹ️ {uploadNotice}
            </div>
          )}
          {uploadError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500 font-medium">
              ❌ {uploadError}
            </div>
          )}
        </div>

        {/* Step 2: Configuration & Analysis */}
        {file && !uploadError && (
          <div className="space-y-6">
            
            {Boolean(file.name.match(/\.(csv|xlsx|xls|json)$/i)) ? (
              columns.length > 0 ? (
                <>
                  {/* INSTRUCTIONS */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-200">
                    <p className="font-bold flex items-center gap-2 mb-1">✅ File Uploaded! Here is what to do next:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1 text-blue-100">
                      <li>Select the <strong>Target column</strong> (what your model is trying to predict).</li>
                      <li>Check the <strong>Sensitive columns</strong> below (e.g., 'race', 'gender') to test for bias.</li>
                      <li>Click <strong>Analyze Fairness</strong> to run the audit.</li>
                    </ol>
                  </div>

                  {/* Configuration Header */}
                  <div className="p-6 border border-border rounded-xl bg-[#1a1b26] text-white">
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-primary">Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Target column (what the model predicts)</label>
                        <select 
                          value={targetCol}
                          onChange={handleTargetChange}
                          className="w-full bg-[#24283b] border border-gray-700 rounded p-2 text-sm text-white"
                        >
                          {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Sensitive / protected attribute columns</label>
                        <div className="flex flex-wrap gap-2 p-2 bg-[#24283b] border border-gray-700 rounded min-h-[42px]">
                          {columns.map(c => (
                            <label key={c} className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={selectedSensCols.includes(c)}
                                onChange={() => toggleSensCol(c)}
                                className="w-4 h-4 cursor-pointer"
                              />
                              <span className="text-xs text-gray-300">{c}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 border border-border rounded-xl bg-[#1a1b26] text-white">
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-primary">Structured Dataset Analysis</h2>
                  <p className="text-sm text-gray-300 mb-4 animate-pulse">
                    Parsing structured columns... Please wait or check for errors.
                  </p>
                </div>
              )
            ) : Boolean(file.name.match(/\.(pdf|doc|docx|txt)$/i)) ? (
              <div className="p-6 border border-border rounded-xl bg-[#1a1b26] text-white">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-primary">Document Analysis</h2>
                <p className="text-sm text-gray-300 mb-4">
                  The uploaded file ({file.name}) is a document. We will analyze its text for exclusionary language, 
                  stereotypes, and fairness governance concerns.
                </p>
              </div>
            ) : (
              <div className="p-6 border border-border rounded-xl bg-yellow-900/20 border-yellow-500/30 text-white">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-yellow-400">Unknown Format</h2>
                <p className="text-sm text-yellow-200/80 mb-4">
                  The uploaded file ({file.name}) has an unrecognized extension. We will attempt a best-effort document analysis.
                </p>
              </div>
            )}

            {/* Analyze Button Component */}
            <div className="flex justify-center mt-6">
              {!isAnalyzing ? (
                <button
                  onClick={Boolean(file.name.match(/\.(csv|xlsx|xls|json)$/i)) ? runAudit : runDocAnalysis}
                  disabled={isAnalyzing}
                  className="group w-full max-w-sm flex items-center justify-center gap-2 px-6 py-4 rounded-full text-base font-medium text-primary-foreground transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:scale-[1.02]"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  Analyze Fairness
                </button>
              ) : (
                <div className="w-full max-w-md bg-[#1a1b26] p-6 rounded-xl border border-border/50 text-center shadow-lg">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    <span>Progress</span>
                    <span>Step {analysisStep + 1}/8</span>
                  </div>
                  <div className="h-2 w-full bg-[#0f111a] rounded-full overflow-hidden mb-4 border border-border/50">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out"
                      style={{ width: `${((analysisStep + 1)/8) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-green-400 animate-pulse font-medium">
                    {[
                      "Uploading Data...",
                      "Parsing Formats...",
                      "Detecting Sensitive Attributes...",
                      "Calculating Demographic Parity...",
                      "Assessing Disparate Impact...",
                      "Analyzing Intersectionality Risks...",
                      "Generating Explanations...",
                      "Finalizing Exportable Report..."
                    ][analysisStep]}
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Results Section */}
            {(auditResult || docResult) && (
              <div className="mt-12 space-y-6 animate-in slide-in-from-bottom-4 duration-500 relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 mb-6 sticky top-0 bg-background/95 backdrop-blur z-10 pt-4">
                  <h2 className="text-2xl font-bold">
                    2. Fairness Analysis Results
                  </h2>
                  <div className="flex gap-2 mt-4 md:mt-0 flex-wrap">
                    <button onClick={exportAsJSON} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1b26] hover:bg-[#24283b] border border-border rounded text-sm transition text-white">
                      <Download className="w-3.5 h-3.5" /> JSON
                    </button>
                    <button onClick={exportAsCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1b26] hover:bg-[#24283b] border border-border rounded text-sm transition text-white">
                      <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1b26] hover:bg-[#24283b] border border-border rounded text-sm transition text-white">
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={startNewAnalysis} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded text-sm transition ml-2 font-medium">
                      <RefreshCw className="w-3.5 h-3.5" /> New Analysis
                    </button>
                  </div>
                </div>

                {/* Structured Data Results */}
                {auditResult && !auditResult.error && (
                  <div className="space-y-6">
                    <div className="inline-block p-4 bg-muted/20 border border-border rounded-lg">
                      <h3 className="text-sm text-muted-foreground">Base Model Accuracy</h3>
                      <p className="text-3xl font-bold">{(auditResult.accuracy * 100).toFixed(1)}%</p>
                    </div>

                    {Object.keys(auditResult.audits).map((col) => {
                      const audit = auditResult.audits[col];
                      const ex = audit.executive_summary || {};
                      const metrics = audit.metrics || {};
                      const rep = audit.representation || null;
                      const dq = audit.data_quality || null;

                      return (
                        <div key={col} className="p-6 bg-background border border-border rounded-xl shadow-lg">
                          {/* Header */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-border/50 gap-4">
                            <div>
                              <h3 className="text-2xl font-bold text-primary mb-1">Audit: {col}</h3>
                              <p className="text-sm text-muted-foreground">{ex.overall_status}</p>
                            </div>
                            <div className={`px-5 py-3 rounded-lg border flex flex-col items-end ${
                              ex.risk_level === 'Low Risk' ? 'bg-green-400/10 border-green-400/20 text-green-400' :
                              ex.risk_level === 'Moderate Risk' ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' :
                              'bg-red-400/10 border-red-400/20 text-red-500'
                            }`}>
                              <span className="text-xs uppercase tracking-wider block mb-1 opacity-80">Fairness Risk</span>
                              <span className="font-bold text-xl">{ex.risk_level} ({audit.overall_fairness_score?.toFixed(1)}/100)</span>
                            </div>
                          </div>

                          {/* Executive Findings */}
                          {ex.key_findings && (
                            <div className="mb-6 bg-muted/20 p-5 rounded-lg border border-border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
                              <h4 className="font-bold mb-3 flex items-center gap-2"><span className="text-primary">⚡</span> Executive Findings</h4>
                              <ul className="space-y-2">
                                {ex.key_findings.map((f: string, i: number) => (
                                  <li key={i} className="text-sm text-foreground/90 flex gap-2">
                                    <span className="text-muted-foreground shrink-0">•</span><span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <h4 className="text-base font-bold mb-4 border-b border-border/30 pb-2">Deep Structured Data Metrics</h4>

                          {/* Radar Chart & High-Level Indices */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
                            
                            {/* Disparity Radar */}
                            <div className="lg:col-span-2 p-5 bg-[#1a1b26] border border-border/50 rounded-lg flex flex-col">
                              <h5 className="font-semibold text-white text-sm mb-4">Multidimensional Fairness Disparity (Lower is Better)</h5>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart outerRadius={80} data={[
                                    { subject: 'Demographic Parity', val: metrics.demographic_parity?.difference || 0 },
                                    { subject: 'Equalized Odds', val: metrics.equalized_odds?.difference || 0 },
                                    { subject: 'Predictive Parity', val: metrics.predictive_parity?.max_difference || 0 },
                                    { subject: 'Treatment Parity', val: metrics.advanced_errors?.max_treatment_disparity > 2 ? 0.5 : (metrics.advanced_errors?.max_treatment_disparity || 0) / 4},
                                    { subject: 'Calibration Error', val: metrics.calibration?._missing ? 0 : (metrics.calibration?.max_calibration_error || 0) },
                                  ]}>
                                    <PolarGrid stroke="#3f3f46" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                                    <Radar name="Disparity Level" dataKey="val" stroke="#f87171" fill="#f87171" fillOpacity={0.4} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Inequality Indices (Gini & Theil) & Feature Risk */}
                            <div className="flex flex-col gap-4">
                              {metrics.inequality_indices && (
                                <div className="p-5 bg-gradient-to-br from-[#1a1b26] to-[#0f111a] border border-border/50 rounded-lg flex-1">
                                  <h5 className="font-semibold text-white text-sm mb-3">Utility Inequality</h5>
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Gini Coefficient</p>
                                      <p className={`text-xl font-mono ${metrics.inequality_indices.gini_coefficient > 0.3 ? 'text-red-400' : 'text-green-400'}`}>{metrics.inequality_indices.gini_coefficient.toFixed(3)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Theil Index</p>
                                      <p className={`text-xl font-mono ${metrics.inequality_indices.theil_index > 0.2 ? 'text-yellow-400' : 'text-green-400'}`}>{metrics.inequality_indices.theil_index.toFixed(3)}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {metrics.feature_influence && !metrics.feature_influence._missing && (
                                <div className="p-4 bg-[#1a1b26] border border-border/50 rounded-lg">
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Top Proxies (Risk)</p>
                                  <div className="space-y-1 text-xs text-gray-300">
                                    {Object.entries(metrics.feature_influence.top_influential_features || {}).slice(0,3).map(([fk, fv]: any) => (
                                      <div key={fk} className="flex justify-between">
                                        <span className="truncate pr-2">{fk}</span>
                                        <span className="font-mono text-red-400">{(fv * 100).toFixed(1)}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">

                            {/* Disparate Impact Breakdown */}
                            {metrics.disparate_impact && (
                              <div className="p-5 bg-[#1a1b26] border border-border/50 rounded-lg flex flex-col">
                                <h5 className="font-semibold text-white text-sm mb-1">{metrics.disparate_impact.title}</h5>
                                <p className="text-xs text-muted-foreground mb-4">{metrics.disparate_impact.explainability?.what}</p>
                                <div className="flex items-center gap-6 mb-4">
                                  <div className="flex-1">
                                    <span className="text-sm text-gray-400 block mb-1">Ratio:</span>
                                    <span className={`text-3xl font-mono ${metrics.disparate_impact.passes_80_percent_rule ? 'text-green-400' : 'text-red-400'}`}>
                                      {metrics.disparate_impact.disparate_impact_ratio?.toFixed(3)}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                     <span className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-block ${
                                      metrics.disparate_impact.severity === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                      metrics.disparate_impact.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                      'bg-green-500/20 text-green-400 border border-green-500/30'
                                    }`}>Severity: {metrics.disparate_impact.severity}</span>
                                    {!metrics.disparate_impact.passes_80_percent_rule && <span className="block mt-2 text-xs text-red-400 font-medium whitespace-nowrap">Fails Minimum 80% Rule</span>}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Treatment Equality & Individual Consistency */}
                            {metrics.advanced_errors && (
                              <div className="p-5 bg-[#1a1b26] border border-border/50 rounded-lg flex flex-col">
                                <h5 className="font-semibold text-white text-sm mb-1">Treatment Equality</h5>
                                <p className="text-xs text-muted-foreground mb-4">Compares False Positives to False Negatives ratios between groups.</p>
                                <div className="flex justify-between items-center mb-4">
                                  <div>
                                    <span className="text-sm text-gray-400 block mb-1">Max Disparity:</span>
                                    <span className={`text-xl font-mono ${metrics.advanced_errors.max_treatment_disparity > 1.5 ? 'text-red-400' : 'text-green-400'}`}>
                                      {metrics.advanced_errors.max_treatment_disparity?.toFixed(3)}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm text-gray-400 block mb-1">Consistency (Proxy):</span>
                                    <span className="text-xl font-mono text-blue-400">
                                      {(metrics.advanced_errors.individual_consistency_proxy * 100)?.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Confusion Matrices */}
                            {metrics.advanced_errors && metrics.advanced_errors.confusion_matrices && (
                              <div className="p-5 bg-[#1a1b26] border border-border/50 rounded-lg flex flex-col md:col-span-2">
                                <h5 className="font-semibold text-white text-sm mb-4">Confusion Matrices by Group</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Object.entries(metrics.advanced_errors.confusion_matrices).map(([groupName, cm]: any) => (
                                    <div key={groupName} className="p-3 bg-background border border-border/40 rounded">
                                      <p className="font-bold text-xs text-gray-300 mb-2 truncate">Group: {groupName}</p>
                                      <div className="grid grid-cols-2 gap-1 text-center font-mono text-xs">
                                        <div className="bg-green-500/10 text-green-400 p-2 rounded">TP: {cm.TP}</div>
                                        <div className="bg-red-500/10 text-red-400 p-2 rounded">FP: {cm.FP}</div>
                                        <div className="bg-yellow-500/10 text-yellow-400 p-2 rounded">FN: {cm.FN}</div>
                                        <div className="bg-blue-500/10 text-blue-400 p-2 rounded">TN: {cm.TN}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Data Quality Risk */}
                            {dq && dq.risk_level === 'HIGH' && (
                              <div className="p-5 bg-red-900/10 border border-red-500/30 rounded-lg flex flex-col md:col-span-2">
                                <h5 className="font-semibold text-red-400 text-sm mb-1 flex items-center gap-2">⚠️ {dq.title}</h5>
                                <p className="text-xs text-red-400/80 mb-2">{dq.explainability?.suggests}</p>
                                <ul className="list-disc list-inside text-xs text-red-500/70">
                                  {(dq.reasons || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Recommendations & Limitations */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-border/50">
                            <div>
                              <h4 className="font-bold text-xs uppercase tracking-widest text-primary mb-3">Recommendations</h4>
                              <ul className="space-y-2 text-sm text-gray-300 pl-4 list-disc">
                                {(audit.recommendations || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Analysis Limitations</h4>
                              <ul className="space-y-2 text-sm text-gray-500 pl-4 list-disc">
                                {(audit.limitations || []).map((l: string, i: number) => <li key={i}>{l}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {auditResult?.error && <p className="text-destructive p-4 bg-destructive/10 rounded-lg">{auditResult.error}</p>}

                {/* Document Results (Phase 7 Visualization Dashboard) */}
                {docResult && !docResult.error && (
                  <div className="space-y-6">
                    
                    {/* Top Level Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
                      <div className="p-5 bg-background border border-border rounded-xl shadow flex flex-col justify-center">
                        <span className="text-xs text-muted-foreground uppercase tracking-widest block mb-2 font-bold flex items-center gap-1"><FileText className="w-3 h-3"/> Document Analyzed</span>
                        <p className="font-medium text-lg truncate text-white">{docResult.summary?.domain || "General"} Domain</p>
                      </div>
                      
                      <div className={`p-5 rounded-xl shadow border flex flex-col justify-center ${
                        docResult.summary?.fast_readiness === 'Needs Urgent Review' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                      }`}>
                        <span className="text-xs uppercase tracking-widest block mb-2 opacity-80 font-bold flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Readiness</span>
                        <p className="font-bold text-lg">{docResult.summary?.fast_readiness}</p>
                      </div>

                      <div className={`p-5 rounded-xl shadow border flex flex-col justify-center ${
                        docResult.summary?.overall_risk === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                        docResult.summary?.overall_risk === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                        'bg-green-500/10 border-green-500/30 text-green-500'
                      }`}>
                        <span className="text-xs uppercase tracking-widest block mb-2 opacity-80 font-bold flex items-center gap-1"><Activity className="w-3 h-3"/> Overall Risk Level</span>
                        <p className="font-bold text-2xl">{docResult.summary?.overall_risk}</p>
                      </div>
                    </div>

                    {/* Chart Dashboard Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Sentiment & Tone */}
                      <div className="p-6 bg-background border border-border rounded-xl shadow-lg">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-primary flex items-center gap-2"><BarChart2 className="w-4 h-4"/> Sentiment & Tone</h3>
                        <div className="flex items-center">
                          <div className="w-1/2 h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={[
                                    {name: "Positive", value: docResult.sentiment_and_tone?.positive_pct || 33},
                                    {name: "Neutral", value: docResult.sentiment_and_tone?.neutral_pct || 33},
                                    {name: "Negative", value: docResult.sentiment_and_tone?.negative_pct || 34}
                                  ]} 
                                  innerRadius={40} outerRadius={70} 
                                  paddingAngle={5} dataKey="value"
                                >
                                  <Cell fill="#4ade80" />
                                  <Cell fill="#94a3b8" />
                                  <Cell fill="#f87171" />
                                </Pie>
                                <RechartsTooltip 
                                  contentStyle={{ backgroundColor: '#1a1b26', borderColor: '#24283b', borderRadius: '8px' }}
                                  itemStyle={{ color: '#fff' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-1/2 space-y-4">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Detected Tone</p>
                              <p className="text-lg font-medium text-white">{docResult.sentiment_and_tone?.tone}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Power Dynamics</p>
                              <p className={`text-sm font-medium ${docResult.sentiment_and_tone?.power_dynamics === 'High' ? 'text-red-400' : 'text-green-400'}`}>
                                {docResult.sentiment_and_tone?.power_dynamics}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Readability (Flesch proxy)</p>
                              <p className="text-sm text-gray-300">{docResult.language_patterns?.readability_score?.toFixed(0)}/100</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Compliance & Governance */}
                      <div className="p-6 bg-background border border-border rounded-xl shadow-lg flex flex-col">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-primary flex items-center gap-2"><Gavel className="w-4 h-4"/> Compliance & Governance</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {Object.entries(docResult.compliance || {}).map(([key, val]: any) => (
                            <div key={key} className="p-3 bg-[#1a1b26] rounded-lg border border-border/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1 truncate">{key.replace(/_/g, " ")}</p>
                              <p className={`text-sm font-medium ${val.status === 'Likely Compliant' ? 'text-green-400' : 'text-yellow-400'}`}>{val.status}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-auto pt-4 border-t border-border/50 flex gap-4 text-sm">
                          <span className={`${docResult.governanceChecklist?.human_oversight === 'Present' ? 'text-green-400' : 'text-red-400'}`}>
                            {docResult.governanceChecklist?.human_oversight === 'Present' ? '✅ Human Oversight' : '❌ No Oversight'}
                          </span>
                          <span className={`${docResult.governanceChecklist?.appeals === 'Present' ? 'text-green-400' : 'text-red-400'}`}>
                            {docResult.governanceChecklist?.appeals === 'Present' ? '✅ Appeals Process' : '❌ No Appeals'}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Detailed Findings List */}
                    <div className="p-6 bg-background border border-border rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
                      <h3 className="text-xl font-bold mb-5 text-primary flex items-center gap-2"><Scale className="w-5 h-5"/> Detailed Inclusivity Findings</h3>
                      {docResult.findings && docResult.findings.length > 0 ? (
                        <div className="space-y-4">
                          {docResult.findings.map((f: any, i: number) => (
                            <div key={i} className={`p-4 rounded-lg border ${
                              f.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'
                            }`}>
                              <div className="flex items-start gap-3">
                                <span className="mt-1">{f.severity === 'Critical' ? '🚨' : '⚠️'}</span>
                                <div className="flex-1">
                                  <h4 className={`font-bold mb-1 ${f.severity === 'Critical' ? 'text-red-400' : 'text-yellow-400'}`}>{f.title}</h4>
                                  <p className="text-sm text-foreground/90 mb-2">{f.description}</p>
                                  <div className="bg-[#1a1b26] p-3 rounded border border-border/50 text-xs font-mono text-gray-300 mb-2">
                                    "{f.evidence}"
                                  </div>
                                  <p className="text-sm text-green-400 font-medium">✨ {f.suggestion}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-center font-medium">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
                          No exclusionary, biased, or problematic terminology detected.
                        </div>
                      )}
                    </div>

                    {/* Document Diff Viewer */}
                    {docResult.fixed_document && (
                      <div className="p-6 bg-background border border-border rounded-xl shadow-lg">
                        <div className="flex justify-between items-center mb-5">
                          <h3 className="text-xl font-bold text-primary flex items-center gap-2"><FileCheck className="w-5 h-5"/> Mitigation: Fixed Document</h3>
                          <button 
                            onClick={() => setShowFixedDoc(!showFixedDoc)}
                            className="px-4 py-2 bg-[#24283b] hover:bg-[#1a1b26] border border-gray-700 rounded-lg text-sm transition text-white"
                          >
                            {showFixedDoc ? 'Hide Fixed Version' : 'Show Side-by-Side Diff'}
                          </button>
                        </div>
                        
                        {showFixedDoc && (
                          <div className="flex flex-col md:flex-row gap-4 h-[400px]">
                            <div className="flex-1 border border-border/50 rounded-lg bg-[#0f111a] flex flex-col overflow-hidden">
                              <div className="p-2 border-b border-border/50 bg-[#1a1b26] text-xs font-bold text-red-400 text-center uppercase tracking-widest">Original Text</div>
                              <div className="p-4 overflow-y-auto text-sm text-gray-400 whitespace-pre-wrap flex-1 leading-relaxed">
                                {docResult.extracted_text_preview}
                              </div>
                            </div>
                            <div className="flex-1 border border-border/50 rounded-lg bg-[#0f111a] flex flex-col overflow-hidden">
                              <div className="p-2 border-b border-border/50 bg-[#1a1b26] text-xs font-bold text-green-400 text-center uppercase tracking-widest">Fixed Text</div>
                              <div className="p-4 overflow-y-auto text-sm text-gray-200 whitespace-pre-wrap flex-1 leading-relaxed">
                                {docResult.fixed_document}
                              </div>
                            </div>
                          </div>
                        )}
                        {!showFixedDoc && (
                           <p className="text-sm text-muted-foreground">The platform has generated an auto-corrected version of this document replacing exclusionary terms with inclusive phrasing. Click the button above to review.</p>
                        )}
                      </div>
                    )}
                    
                  </div>
                )}
                {docResult?.error && <p className="text-destructive p-4 bg-destructive/10 rounded-lg">{docResult.error}</p>}

              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
