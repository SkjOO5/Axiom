import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import ObjectiveSection from '@/components/ObjectiveSection';
import SolutionSection from '@/components/SolutionSection';
import FeaturesGrid from '@/components/FeaturesGrid';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import GrainOverlay from '@/components/GrainOverlay';

export default function Index() {
  return (
    <div className="bg-background text-foreground min-h-screen" style={{ cursor: 'none' }}>
      <CustomCursor />
      <GrainOverlay />
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <ObjectiveSection />
      <SolutionSection />
      <FeaturesGrid />
      <CTASection />
      <Footer />
    </div>
  );
}
