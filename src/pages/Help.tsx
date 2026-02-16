import { HelpCircle, MessageCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import AuroraDivider from '@/components/AuroraDivider';

const faqs = [
  { q: 'How do credits work?', a: 'Each generation costs 1 credit. You get credits based on your plan or can buy additional packs.' },
  { q: 'What formats are supported?', a: 'We support Social Posts (Feed, Story, Landscape), E-commerce Banners (Desktop, Mobile), and Photoshoot (Square).' },
  { q: 'Can I use my own AI API key?', a: 'Yes! Go to Billing → BYOK section to connect your OpenAI, Replicate, or Stability AI key.' },
  { q: 'How do I export my creatives?', a: 'After generating, click "Export 2K" in the editor. You can choose PNG, JPG, or WebP format in Settings.' },
  { q: 'Is there a free plan?', a: 'We offer a free trial with 10 credits to get started. After that, choose from our Starter, Pro, or Business plans.' },
];

const Help = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Help</h1>
        <p className="text-sm text-muted-foreground mt-1">Frequently asked questions and support.</p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="glass-surface rounded-lg border-none px-4">
            <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <AuroraDivider />

      <div className="glass-surface rounded-lg p-6 text-center">
        <MessageCircle className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-heading font-semibold mb-1">Need more help?</h3>
        <p className="text-sm text-muted-foreground mb-4">Our team is ready to assist you.</p>
        <Button variant="outline" disabled>
          <MessageCircle className="h-4 w-4 mr-2" />
          Contact Support
        </Button>
      </div>
    </div>
  );
};

export default Help;
