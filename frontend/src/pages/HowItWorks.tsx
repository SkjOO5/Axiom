import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import GrainOverlay from '@/components/GrainOverlay';
import { Upload, Search, CheckCircle, ChevronDown, Check, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function HowItWorks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "What file formats are supported?",
      a: "CSV, Excel (.xlsx), JSON for structured data. PDF, Word (.doc/.docx), TXT for documents."
    },
    {
      q: "Is my data secure?",
      a: "File processing happens client-side in your browser. Files are not permanently stored. See our Privacy Policy."
    },
    {
      q: "What fairness metrics are calculated?",
      a: "17+ metrics: Demographic Parity, Disparate Impact, Equal Opportunity, Equalized Odds, Predictive Parity, Calibration, Theil Index, Counterfactual Fairness, Intersectional Analysis, and more."
    },
    {
      q: "Can I use this for regulatory compliance?",
      a: "AXiOM checks against US EEOC (4/5 rule), EU AI Act, GDPR Article 22. Analysis is advisory — consult legal counsel for formal compliance."
    },
    {
      q: "What is a proxy variable?",
      a: "A seemingly neutral data point that correlates with a protected attribute. Example: zip code → race, university name → socioeconomic status. AXiOM detects these automatically."
    },
    {
      q: "How is the fairness score calculated?",
      a: "Weighted average of all metrics: demographic parity, disparate impact, equal opportunity, data balance, proxy risk, and governance compliance."
    },
    {
      q: "Can I analyze job descriptions or policies?",
      a: "Yes. Upload any PDF, Word, or TXT document for NLP-based bias analysis including gendered terms, ableist language, and governance gaps."
    },
    {
      q: "What is intersectional analysis?",
      a: "Checking bias at the intersection of multiple attributes. Example: Black women may face more bias than Black people or women separately. This catches hidden discrimination."
    }
  ];

  return (
    <div className="bg-background text-foreground min-h-screen relative overflow-hidden" style={{ cursor: 'none' }}>
      <CustomCursor />
      <GrainOverlay />
      <Navbar />

      {/* Decorative Glows */}
      <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] opacity-50 pointer-events-none" />
      
      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto relative z-10">
        
        {/* Section 1: Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-display font-medium text-white tracking-tight mb-4">
            How It Works
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A complete step-by-step guide to detecting and eliminating bias in your AI systems using AXiOM
          </p>
        </motion.div>

        {/* Section 2: 3-Step Quick Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24"
        >
          <div className="bg-muted/10 border border-border rounded-xl shadow-lg p-8 glass-card">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Upload size={24} />
              </div>
              <span className="text-2xl font-display font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'var(--gradient-primary)' }}>01</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Upload Your Data</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Upload your dataset (CSV, Excel, JSON) or document (PDF, Word, TXT). We support all major file formats.
            </p>
          </div>

          <div className="bg-muted/10 border border-border rounded-xl shadow-lg p-8 glass-card">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Search size={24} />
              </div>
              <span className="text-2xl font-display font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'var(--gradient-primary)' }}>02</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Run Bias Analysis</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Our engine scans for 17+ fairness metrics, detects hidden proxy variables, and identifies bias across gender, race, age, disability, and more.
            </p>
          </div>

          <div className="bg-muted/10 border border-border rounded-xl shadow-lg p-8 glass-card">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <CheckCircle size={24} />
              </div>
              <span className="text-2xl font-display font-bold text-transparent bg-clip-text" style={{ backgroundImage: 'var(--gradient-primary)' }}>03</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Get Actionable Results</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Receive a detailed fairness report with scores, visualizations, risk levels, and prioritized recommendations to fix bias.
            </p>
          </div>
        </motion.div>

        {/* Section 3: Detailed Walkthrough */}
        <div className="space-y-32 mb-32 max-w-5xl mx-auto">
          
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="w-full md:w-1/2"
            >
              <div className="bg-black/40 border border-border rounded-xl shadow-2xl p-6 md:p-8 transform rotate-1 md:hover:rotate-0 transition-all">
                <h4 className="text-white text-lg font-bold text-center mb-6">Create Account</h4>
                <div className="space-y-4">
                  <div className="h-10 bg-white/5 border border-white/10 rounded-full w-full flex items-center px-4">
                    <span className="text-muted-foreground text-xs">Email Address</span>
                  </div>
                  <div className="h-10 bg-white/5 border border-white/10 rounded-full w-full flex items-center px-4">
                    <span className="text-muted-foreground text-xs">Password</span>
                  </div>
                  <div className="h-10 rounded-full w-full flex items-center justify-center mt-2 group" style={{ background: 'var(--gradient-primary)' }}>
                    <span className="text-white text-sm font-medium">Sign Up</span>
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="w-full md:w-1/2 space-y-4">
              <p className="text-primary font-bold uppercase tracking-wider text-xs">Step 1</p>
              <h3 className="text-3xl font-display text-white font-bold">Create Your Account</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>Visit AXiOM and click 'Get Started' or 'Sign Up'</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>Enter your email address and create a secure password</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>Once registered, you'll have access to the full dashboard</span>
                </li>
              </ul>
              <div className="mt-6 border-l-4 border-primary bg-primary/5 rounded-r-xl p-4 flex gap-3">
                <Lightbulb size={20} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Tip:</strong> You can enter your email in the 'Ready to Build Fair AI?' section on the homepage to pre-fill your signup.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 space-y-4">
              <p className="text-primary font-bold uppercase tracking-wider text-xs">Step 2</p>
              <h3 className="text-3xl font-display text-white font-bold">Navigate to the Dashboard</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>After logging in, click 'Dashboard' in the navigation bar</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>Or use the profile dropdown → Dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>Or click 'Go to Dashboard' on the homepage</span>
                </li>
              </ul>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="w-full md:w-1/2"
            >
              <div className="bg-black/40 border border-border rounded-xl shadow-2xl p-4 transform -rotate-1 md:hover:rotate-0 transition-all flex justify-between items-center">
                <div className="font-bold text-xl text-white">AXiOM</div>
                <div className="hidden sm:flex gap-4">
                  <div className="px-3 py-1 bg-white/5 border-b-2 border-primary text-white text-sm rounded-t-sm shadow-[0_0_15px_rgba(var(--primary),0.3)]">Dashboard</div>
                  <div className="text-muted-foreground text-sm py-1">About</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">DH</div>
              </div>
            </motion.div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="w-full md:w-1/2"
            >
              <div className="bg-muted/10 border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 text-muted-foreground">
                  <Upload size={28} />
                </div>
                <div className="px-4 py-2 rounded-full text-sm font-semibold text-white mb-3" style={{ background: 'var(--gradient-primary)' }}>Choose File</div>
                <p className="text-xs text-muted-foreground">dataset_2026.csv (2.4 MB)</p>
              </div>
            </motion.div>
            <div className="w-full md:w-1/2 space-y-4">
              <p className="text-primary font-bold uppercase tracking-wider text-xs">Step 3</p>
              <h3 className="text-3xl font-display text-white font-bold">Upload Your File</h3>
              <p className="text-muted-foreground">Click 'Choose File' to select your file. We support:</p>
              
              <div className="overflow-x-auto rounded-lg border border-border my-4">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-muted/20 border-b border-border">
                      <th className="p-3 font-medium text-muted-foreground">Format</th>
                      <th className="p-3 font-medium text-muted-foreground">Type</th>
                      <th className="p-3 font-medium text-muted-foreground">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="bg-background"><td className="p-3 text-white">CSV</td><td className="p-3 text-white">Structured Data</td><td className="p-3 text-muted-foreground">Tabular datasets</td></tr>
                    <tr className="bg-background"><td className="p-3 text-white">Excel</td><td className="p-3 text-white">Structured Data</td><td className="p-3 text-muted-foreground">Spreadsheet data</td></tr>
                    <tr className="bg-background"><td className="p-3 text-white">JSON</td><td className="p-3 text-white">Structured Data</td><td className="p-3 text-muted-foreground">API data</td></tr>
                    <tr className="bg-background"><td className="p-3 text-white">PDF</td><td className="p-3 text-white">Document</td><td className="p-3 text-muted-foreground">Policies, reports</td></tr>
                    <tr className="bg-background"><td className="p-3 text-white">Word</td><td className="p-3 text-white">Document</td><td className="p-3 text-muted-foreground">HR guidelines</td></tr>
                    <tr className="bg-background"><td className="p-3 text-white">TXT</td><td className="p-3 text-white">Document</td><td className="p-3 text-muted-foreground">Plain text</td></tr>
                  </tbody>
                </table>
              </div>
              
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Structured data → full statistical fairness analysis</li>
                <li>• Documents → NLP-based language bias analysis</li>
              </ul>
              
              <div className="mt-4 border-l-4 border-primary bg-primary/5 rounded-r-xl p-4 flex gap-3">
                <Lightbulb size={20} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Tip:</strong> For tabular data, ensure your CSV has column headers in the first row.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 space-y-4">
              <p className="text-primary font-bold uppercase tracking-wider text-xs">Step 4</p>
              <h3 className="text-3xl font-display text-white font-bold">Configure Analysis</h3>
              <p className="text-muted-foreground">For structured datasets, select:</p>
              <ul className="space-y-3 text-muted-foreground mt-2">
                <li><strong className="text-white font-medium">Target Column:</strong> The outcome column (e.g., 'hired', 'approved', 'loan_status')</li>
                <li><strong className="text-white font-medium">Protected Attributes:</strong> Sensitive columns (e.g., 'gender', 'race', 'age')</li>
                <li>AXiOM auto-detects likely protected attributes — you can adjust</li>
              </ul>
              
              <div className="mt-6 border-l-4 border-primary bg-primary/5 rounded-r-xl p-4 flex gap-3">
                <Lightbulb size={20} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Tip:</strong> AXiOM detects proxy variables too — columns like zip code that secretly encode race or socioeconomic status.
                </p>
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="w-full md:w-1/2"
            >
              <div className="bg-black/40 border border-border rounded-xl shadow-2xl p-6 space-y-6">
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-2 block">Target Column</label>
                  <div className="border border-border bg-background rounded-lg p-3 flex justify-between items-center">
                    <span className="text-sm text-white">loan_status</span>
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase font-semibold mb-2 block">Protected Attributes</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-primary bg-primary/10 rounded-lg p-2 flex items-center gap-2">
                      <Check size={14} className="text-primary" />
                      <span className="text-sm text-white">gender</span>
                    </div>
                    <div className="border border-primary bg-primary/10 rounded-lg p-2 flex items-center gap-2">
                      <Check size={14} className="text-primary" />
                      <span className="text-sm text-white">race</span>
                    </div>
                    <div className="border border-border bg-background rounded-lg p-2 flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border border-muted-foreground rounded-sm"></div>
                      <span className="text-sm text-muted-foreground">income</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Step 5 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="w-full md:w-1/2"
            >
              <div className="bg-black/40 border border-border rounded-xl shadow-2xl p-6 text-center">
                <div className="px-6 py-3 rounded-full text-sm font-semibold text-white inline-block mb-6 shadow-lg shadow-primary/20" style={{ background: 'var(--gradient-primary)' }}>Analyze for Bias →</div>
                
                <div className="space-y-3 text-left max-w-[200px] mx-auto">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle size={16} className="text-green-400" /> Extracting data...</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle size={16} className="text-green-400" /> Detecting attributes...</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle size={16} className="text-green-400" /> Calculating fairness...</div>
                  <div className="flex items-center gap-2 text-sm text-primary font-medium animate-pulse"><span className="w-4 flex justify-center text-lg">⏳</span> Generating results...</div>
                </div>
              </div>
            </motion.div>
            <div className="w-full md:w-1/2 space-y-4">
              <p className="text-primary font-bold uppercase tracking-wider text-xs">Step 5</p>
              <h3 className="text-3xl font-display text-white font-bold">Run the Analysis</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>Click 'Analyze for Bias' to start</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>Watch the progress indicator as each step completes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>Analysis takes 5-30 seconds depending on file size</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 6 */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 space-y-4">
              <p className="text-primary font-bold uppercase tracking-wider text-xs">Step 6</p>
              <h3 className="text-3xl font-display text-white font-bold">Fairness Score</h3>
              <p className="text-muted-foreground">Your overall fairness score (0-100):</p>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <span className="text-white text-sm font-medium w-16">80-100:</span>
                  <span className="text-muted-foreground text-sm">Fair — minimal bias detected</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
                  <span className="text-white text-sm font-medium w-16">60-79:</span>
                  <span className="text-muted-foreground text-sm">Needs Attention — some bias patterns</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                  <span className="text-white text-sm font-medium w-16">40-59:</span>
                  <span className="text-muted-foreground text-sm">Concerning — significant bias issues</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                  <span className="text-white text-sm font-medium w-16">0-39:</span>
                  <span className="text-muted-foreground text-sm">Biased — critical, immediate action needed</span>
                </div>
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="w-full md:w-1/2"
            >
              <div className="bg-black/40 border border-border rounded-xl shadow-2xl p-8 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--muted)" strokeWidth="6" />
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="#eab308" strokeWidth="6" strokeDasharray="282.7" strokeDashoffset="98.9" className="drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-display font-bold text-white">65</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Score</span>
                  </div>
                </div>
                <h4 className="text-yellow-400 font-bold mb-1">Medium Risk</h4>
                <p className="text-xs text-muted-foreground">12 issues (3 critical)</p>
              </div>
            </motion.div>
          </div>

          {/* Step 7 */}
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="w-full md:w-1/2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-black/40 border border-border rounded-lg p-4">
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">Demographic Parity</p>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-bold text-white">0.62</span>
                    <span className="text-[10px] text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">Failed</span>
                  </div>
                </div>
                <div className="bg-black/40 border border-border rounded-lg p-4">
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">Disparate Impact</p>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-bold text-white">0.85</span>
                    <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded">Passed</span>
                  </div>
                </div>
                <div className="bg-black/40 border border-border rounded-lg p-4 sm:col-span-2">
                  <p className="text-[10px] uppercase text-muted-foreground mb-1">Proxy Detection</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-red-400 h-1.5 rounded-full w-[80%]"></div></div>
                    <span className="text-xs text-red-400 font-bold">80% High Risk</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Column 'zipcode' correlates with 'race'</p>
                </div>
              </div>
            </motion.div>
            <div className="w-full md:w-1/2 space-y-4">
              <p className="text-primary font-bold uppercase tracking-wider text-xs">Step 7</p>
              <h3 className="text-3xl font-display text-white font-bold">Detailed Metrics</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><strong className="text-white">Demographic Parity:</strong> Are outcomes distributed equally?</li>
                <li><strong className="text-white">Disparate Impact Ratio:</strong> Legal threshold (US EEOC 4/5 rule)</li>
                <li><strong className="text-white">Equal Opportunity:</strong> Equality of accuracy across groups.</li>
                <li><strong className="text-white">Proxy Detection:</strong> Secretly encoding protected attributes.</li>
                <li><strong className="text-white">Intersectional Analysis:</strong> Bias at the combination of attributes.</li>
              </ul>
              <p className="text-sm font-medium text-white mt-4 border-b border-border/50 pb-2">For Documents:</p>
              <p className="text-sm text-muted-foreground">Gendered detection, Racially coded language, Ableist terms, Governance gap analysis.</p>
            </div>
          </div>

          {/* Step 8 */}
          <div className="flex flex-col-reverse md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 space-y-4">
              <p className="text-primary font-bold uppercase tracking-wider text-xs">Step 8</p>
              <h3 className="text-3xl font-display text-white font-bold">Act & Export</h3>
              <p className="text-muted-foreground">AXiOM provides prioritized recommendations:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="text-red-400 mr-2">🔴 Immediate:</span> Quick fixes</li>
                <li><span className="text-yellow-400 mr-2">🟡 Short-term:</span> Policy changes</li>
                <li><span className="text-green-400 mr-2">🟢 Long-term:</span> Systemic improvements</li>
              </ul>
              <p className="text-sm text-white font-medium mt-4">Export options: PDF, CSV, JSON.</p>
              <div className="mt-4 border-l-4 border-primary bg-primary/5 rounded-r-xl p-4 flex gap-3">
                <Lightbulb size={20} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Tip:</strong> You can revisit any past analysis from your Profile page anytime.
                </p>
              </div>
            </div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="w-full md:w-1/2"
            >
              <div className="bg-black/40 border border-border rounded-xl shadow-2xl p-6">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><CheckCircle size={14} className="text-primary" /> Recommendations</h4>
                <div className="space-y-2 mb-6">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <span className="text-[10px] text-red-400 uppercase font-bold tracking-wider">Immediate</span>
                    <p className="text-xs text-white mt-1">Remove direct reference to demographic columns before deploying model.</p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <span className="text-[10px] text-yellow-400 uppercase font-bold tracking-wider">Short Term</span>
                    <p className="text-xs text-white mt-1">Implement fairness threshold tuning post-processing.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 text-center py-1.5 border border-border rounded-md text-[10px] text-white bg-white/5">PDF</div>
                  <div className="flex-1 text-center py-1.5 border border-border rounded-md text-[10px] text-white bg-white/5">CSV</div>
                  <div className="flex-1 text-center py-1.5 border border-border rounded-md text-[10px] text-white bg-white/5">JSON</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Section 4: Use Cases Grid */}
        <div className="mb-32 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-medium text-white mb-4">Common Use Cases</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">AXiOM scales across industries to safeguard predictive decision making.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-muted/10 border border-border rounded-xl p-6 glass-card hover:border-primary/50 transition-colors">
              <h3 className="text-xl font-bold text-white mb-3">🏢 HR & Hiring</h3>
              <p className="text-muted-foreground text-sm">Audit resume screening algorithms and hiring criteria for gender, racial, or age bias before they affect real candidates.</p>
            </div>
            <div className="bg-muted/10 border border-border rounded-xl p-6 glass-card hover:border-primary/50 transition-colors">
              <h3 className="text-xl font-bold text-white mb-3">🏦 Banking & Lending</h3>
              <p className="text-muted-foreground text-sm">Check loan approval models for discriminatory patterns across race, gender, income level, and neighborhood.</p>
            </div>
            <div className="bg-muted/10 border border-border rounded-xl p-6 glass-card hover:border-primary/50 transition-colors">
              <h3 className="text-xl font-bold text-white mb-3">🏥 Healthcare</h3>
              <p className="text-muted-foreground text-sm">Ensure treatment recommendation algorithms don't disadvantage patients based on ethnicity, age, or disability.</p>
            </div>
            <div className="bg-muted/10 border border-border rounded-xl p-6 glass-card hover:border-primary/50 transition-colors">
              <h3 className="text-xl font-bold text-white mb-3">⚖️ Legal & Compliance</h3>
              <p className="text-muted-foreground text-sm">Generate compliance reports for EU AI Act, GDPR Article 22, US EEOC guidelines, and other regulatory frameworks.</p>
            </div>
          </div>
        </div>

        {/* Section 5: FAQ Accordion */}
        <div className="max-w-3xl mx-auto mb-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-medium text-white mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-muted/10 border border-border rounded-xl overflow-hidden glass-card">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="text-white font-medium">{faq.q}</span>
                  <ChevronDown 
                    size={18} 
                    className={`text-muted-foreground transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-4 text-sm text-muted-foreground border-t border-border/50 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Bottom CTA */}
        <div className="max-w-4xl mx-auto text-center bg-muted/10 border border-border rounded-2xl p-12 glass-card relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full mix-blend-screen filter blur-[80px] opacity-50 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-display font-medium text-white mb-4">Ready to Start?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Upload your first file and get a comprehensive fairness analysis in seconds.</p>
            
            <button 
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.97]"
              style={{ background: 'var(--gradient-primary)' }}
            >
              {user ? 'Go to Dashboard →' : 'Sign Up Free →'}
            </button>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
