import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import AuroraDivider from '@/components/AuroraDivider';
import { useI18n } from '@/i18n';

const faqItems = [
  { q: 'help.faq.credits_q', a: 'help.faq.credits_a' },
  { q: 'help.faq.formats_q', a: 'help.faq.formats_a' },
  { q: 'help.faq.byok_q', a: 'help.faq.byok_a' },
  { q: 'help.faq.export_q', a: 'help.faq.export_a' },
  { q: 'help.faq.free_q', a: 'help.faq.free_a' },
];

const Help = () => {
  const { t } = useI18n();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">{t('help.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('help.subtitle')}</p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqItems.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="glass-surface rounded-lg border-none px-4">
            <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">
              {t(faq.q)}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">
              {t(faq.a)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <AuroraDivider />

      <div className="glass-surface rounded-lg p-6 text-center">
        <MessageCircle className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-heading font-semibold mb-1">{t('help.more_help_title')}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t('help.more_help_subtitle')}</p>
        <Button variant="outline" disabled>
          <MessageCircle className="h-4 w-4 mr-2" />
          {t('help.contact_support')}
        </Button>
      </div>
    </div>
  );
};

export default Help;
