import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import GrainOverlay from '@/components/GrainOverlay';
import { motion } from 'framer-motion';

export default function Terms() {
  return (
    <div className="bg-background text-foreground min-h-screen relative flex flex-col" style={{ cursor: 'none' }}>
      <CustomCursor />
      <GrainOverlay />
      <Navbar />
      
      {/* Decorative Glows */}
      <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] opacity-50 pointer-events-none" />
      
      <main className="flex-1 w-full pt-32 pb-24 px-6 max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-primary font-medium tracking-wider uppercase text-sm mb-4">Legal Directory</p>
          <h1 className="text-4xl md:text-5xl font-display font-medium text-foreground tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-sm">Last updated: April 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-8 md:p-12 rounded-3xl bg-muted/10 border border-border glass-card space-y-8 text-foreground/90 leading-relaxed text-sm md:text-base"
        >
          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">1. Acceptance of Terms</h2>
            <p>By accessing or using the AXiOM platform, you agree to comply with and be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the Service.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">2. Description of Service</h2>
            <p>AXiOM provides an AI fairness analysis platform that allows users to perform statistical audits, disparate impact assessments, and textual bias checks on datasets and documents. The service is provided "as is" and is intended for preliminary evaluation and guidance.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">3. User Accounts & Responsibilities</h2>
            <p>To use certain features of the service, you must register for an account. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree to notify us immediately of any unauthorized use of your account.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">4. Acceptable Use Policy</h2>
            <p>You agree not to use the Service in any way that is unlawful, illegal, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity. You must not upload files containing malicious software or attempting to exploit vulnerabilities within our auditing ecosystem.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">5. File Upload Terms & Ownership</h2>
            <p>You retain full ownership of any data, datasets, or documents you upload to AXiOM. By uploading your files, you grant us a temporary, restricted license solely for the purpose of executing the requested AI fairness analysis. We do not claim ownership, nor do we employ user datasets to enrich proprietary machine learning models without express consent.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">6. Intellectual Property</h2>
            <p>The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of AXiOM and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">7. Disclaimer of Warranties</h2>
            <p>The auditing results and "Fairness Scores" provided by AXiOM are purely advisory. <strong>AXiOM does not provide legal advice.</strong> Our tools are engineered to highlight statistical disparities, which may not exclusively reflect unlawful discrimination under specific jurisdictions. We disclaim all liability regarding actions taken (or not taken) based on our service's outputs.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">8. Limitation of Liability</h2>
            <p>In no event shall AXiOM, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">9. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. You may also initiate the termination of your account at any point.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">10. Governing Law & Jurisdiction</h2>
            <p>These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.</p>
          </section>

        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
}
