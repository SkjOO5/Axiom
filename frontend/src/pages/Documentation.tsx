import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import GrainOverlay from '@/components/GrainOverlay';
import { motion } from 'framer-motion';

export default function Documentation() {
  return (
    <div className="bg-background text-foreground min-h-screen relative" style={{ cursor: 'none' }}>
      <CustomCursor />
      <GrainOverlay />
      <Navbar />
      
      {/* Decorative Glows */}
      <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] opacity-50 pointer-events-none" />
      
      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-primary font-medium tracking-wider uppercase text-sm mb-4">Support & Guides</p>
          <h1 className="text-4xl md:text-5xl font-display font-medium text-foreground tracking-tight mb-4">
            Documentation
          </h1>
          <p className="text-muted-foreground text-sm">Everything you need to utilize AXiOM securely and effectively.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-8 md:p-12 rounded-3xl bg-muted/10 border border-border glass-card space-y-8 text-foreground/90 leading-relaxed text-sm md:text-base"
        >
          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">1. Getting Started with AXiOM</h2>
            <p>AXiOM is designed to provide seamless detection, auditing, and mitigation of bias. First, head to the Dashboard. You will find our centralized file upload tool. The system evaluates files in-memory, parses extensions, and instantly routes you to either a Dataset Analysis Pipeline or a Document Language Pipeline based strictly on the uploaded artifact.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">2. Supported File Formats</h2>
            <div className="overflow-x-auto rounded-lg border border-border mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/20 border-b border-border">
                    <th className="p-3 font-medium text-white">Format Type</th>
                    <th className="p-3 font-medium text-white">File Extensions</th>
                    <th className="p-3 font-medium text-white">Analysis Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3">Structured Datasets</td>
                    <td className="p-3">.csv, .xlsx, .xls, .json</td>
                    <td className="p-3">Statistical Disparity Audit</td>
                  </tr>
                  <tr>
                    <td className="p-3">Text Documents</td>
                    <td className="p-3">.pdf, .txt, .doc, .docx</td>
                    <td className="p-3">Inclusive Language & Sentiment NLP</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">3. Fairness Metrics Explained</h2>
            <p>For structured data, grasping these internal definitions accelerates audit comprehension:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li><strong>Demographic Parity:</strong> Measures if positive outcome rates are equal across all protected groups (e.g. are male/female applicants approved for a loan at similar frequencies?).</li>
              <li><strong>Equalized Odds:</strong> Ensures false positive and false negative error rates are uniform among demographic factions.</li>
              <li><strong>Disparate Impact (80% Rule):</strong> An EEOC metric confirming the disadvantaged group's selection rate functions at least at 80% (or 4/5ths) of the advantaged group's rate.</li>
              <li><strong>Predictive Parity:</strong> Evaluating if precision (positive predictive value) matches up evenly representing equality of competence interpretations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">4. Interpreting Your Fairness Score</h2>
            <p>AXiOM generates an aggregate, quantifiable "Fairness Score" ranking 0 to 100.</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li><strong>80 - 100 (Low Risk):</strong> Algorithm complies with standard heuristic limits. Generally seen as "Fair".</li>
              <li><strong>60 - 79 (Medium Risk):</strong> Moderate disparities present. "Potentially Biased" — merits a brief check.</li>
              <li><strong>40 - 59 (High Risk):</strong> High error divergence flags inequality. Represents a "Biased" system.</li>
              <li><strong>0 - 39 (Critical Risk):</strong> Severe regulatory vulnerability identified. Fails standard tests entirely.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">5. TroubleShooting</h2>
            <p>Encountering issues during tests? We've compiled a few diagnostics:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li><strong>"Failed to fetch" on Dashboard:</strong> This occurs if your Python backend server isn't actively running. Run `python main.py` or restart your backend to fix CORS requests.</li>
              <li><strong>Empty Dropdowns in Configuration:</strong> Occurs when the uploaded JSON or CSV structure is flat and missing standardized tabular headers.</li>
              <li><strong>Missing Analysis History:</strong> Cleared browser cookies/local storage erases temporary session history. Consider creating an account to persist it in future iterations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">6. Frequently Asked Questions (FAQ)</h2>
            <div className="space-y-3 pt-2">
              <details className="p-4 bg-background border border-border rounded-lg cursor-pointer">
                <summary className="font-medium text-white hover:text-primary transition-colors">Is AXiOM compliant with GDPR & CCPA?</summary>
                <p className="mt-2 text-muted-foreground text-sm">Yes. We act as temporary data processors and adhere strictly to all leading geographic privacy policies regarding file ephemeral storage.</p>
              </details>
              <details className="p-4 bg-background border border-border rounded-lg cursor-pointer">
                <summary className="font-medium text-white hover:text-primary transition-colors">What is the "Target Column" in a CSV?</summary>
                <p className="mt-2 text-muted-foreground text-sm">The specific attribute representing the prediction or final classification outcome (e.g. "Credit_Risk" or "Hired").</p>
              </details>
              <details className="p-4 bg-background border border-border rounded-lg cursor-pointer">
                <summary className="font-medium text-white hover:text-primary transition-colors">Are the results guaranteed to protect me legally?</summary>
                <p className="mt-2 text-muted-foreground text-sm">No, they are statistical indicators designed to augment operational auditing, not a certified legal defense.</p>
              </details>
              <details className="p-4 bg-background border border-border rounded-lg cursor-pointer">
                <summary className="font-medium text-white hover:text-primary transition-colors">Can I export my reports?</summary>
                <p className="mt-2 text-muted-foreground text-sm">Yes, JSON, PDF, and CSV exports are natively supported immediately post-audit.</p>
              </details>
              <details className="p-4 bg-background border border-border rounded-lg cursor-pointer">
                <summary className="font-medium text-white hover:text-primary transition-colors">Why didn't my PDF parse correctly?</summary>
                <p className="mt-2 text-muted-foreground text-sm">Image-based PDFs require OCR capability currently undergoing implementation. Ensure your PDF has selectable text.</p>
              </details>
              <details className="p-4 bg-background border border-border rounded-lg cursor-pointer">
                <summary className="font-medium text-white hover:text-primary transition-colors">Does AXiOM support multivariable intersectionality?</summary>
                <p className="mt-2 text-muted-foreground text-sm">Yes, selecting multiple protected attributes computes a combined risk threshold intersecting attributes automatically.</p>
              </details>
              <details className="p-4 bg-background border border-border rounded-lg cursor-pointer">
                <summary className="font-medium text-white hover:text-primary transition-colors">Is my data shared externally?</summary>
                <p className="mt-2 text-muted-foreground text-sm">Absolutely not. AXiOM does not distribute raw datasets to third-party endpoints or vendors.</p>
              </details>
              <details className="p-4 bg-background border border-border rounded-lg cursor-pointer">
                <summary className="font-medium text-white hover:text-primary transition-colors">How do I access older analyses?</summary>
                <p className="mt-2 text-muted-foreground text-sm">Navigating to your Profile exposes the Analysis History UI, permitting historical test restorations seamlessly.</p>
              </details>
            </div>
          </section>

        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
}
