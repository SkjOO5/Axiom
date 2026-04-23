import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import GrainOverlay from '@/components/GrainOverlay';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
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
            Privacy Policy
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
            <h2 className="text-2xl font-display text-white">1. Introduction</h2>
            <p>Welcome to AXiOM. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">2. Information We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">3. How We Use Your Information</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <p>To register you as a new customer, to process and deliver your order including: managing payments, fees and charges, collecting and recovering money owed to us.</p>
            <p>To manage our relationship with you which will include: Notifying you about changes to our terms or privacy policy, asking you to leave a review or take a survey.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">4. File Upload Data Handling</h2>
            <p>AXiOM provides an AI fairness auditing platform. When you upload files (such as CSV, Excel, PDF, TXT):</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Your files are temporarily processed in-memory. They are exclusively used for running the statistical bias and fairness text-analysis audits you request.</li>
              <li>Files are <strong>not</strong> used to silently train our foundational LLMs or external models.</li>
              <li>Uploaded dataset contents are disposed of after the session closes or the analysis concludes unless you explicitly grant persistence preferences within your Account Settings.</li>
              <li>Only the synthesized audit reports (score, metrics, textual breakdowns) are securely stored in your user profile to permit you to revisit the analysis history.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">5. Data Storage & Security</h2>
            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
            <p>They will only process your personal data on our instructions and they are subject to a duty of confidentiality. We have put in place procedures to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">6. Cookies & Tracking</h2>
            <p>You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly. Specifically, cookies are vital for verifying user authentication tokens, retaining local storage preferences like your Dashboard Analysis History, and securing anti-CSRF behaviors.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">7. Third-Party Services</h2>
            <p>This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements. When you leave our website, we encourage you to read the privacy notice of every website you visit.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">8. Your Rights (GDPR / CCPA)</h2>
            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data. This encompasses European (GDPR), Californian (CCPA), and global protections such as:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li><strong>Request access</strong> to your personal data (commonly known as a "data subject access request").</li>
              <li><strong>Request correction</strong> of the personal data that we hold about you.</li>
              <li><strong>Request erasure</strong> of your personal data.</li>
              <li><strong>Object to processing</strong> of your personal data where we are relying on a legitimate interest.</li>
              <li><strong>Request restriction of processing</strong> of your personal data.</li>
              <li><strong>Request the transfer</strong> of your personal data to you or to a third party.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">9. Data Retention</h2>
            <p>We will only retain your personal data for as long as necessary to fulfil the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.</p>
            <p>To determine the appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorised use or disclosure of your personal data, the purposes for which we process your personal data and whether we can achieve those purposes through other means, and the applicable legal requirements.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display text-white">10. Changes to This Policy & Contact Information</h2>
            <p>We reserve the right to modify this privacy policy at any time, so please review it frequently. Changes and clarifications will take effect immediately upon their posting on the website. If we make material changes to this policy, we will notify you here that it has been updated.</p>
            <p>If you have any questions about this privacy policy, please contact us at <a href="mailto:privacy@axiom-ui.local" className="text-primary hover:underline">privacy@axiom-ui.local</a>.</p>
          </section>

        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
}
