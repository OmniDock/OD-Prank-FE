import { Accordion, AccordionItem } from "@heroui/accordion";

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-6">
        Frequently asked questions
      </h2>
      <Accordion variant="splitted">
        <AccordionItem key="1" aria-label="Trial" title="Is there a free trial?">
          Yes. You can start on the Free plan, and upgrade anytime. No credit card is required to begin.
        </AccordionItem>
        <AccordionItem key="2" aria-label="Change plan" title="Can I change plans later?">
          Absolutely. Switch between monthly and annual billing at any time from your dashboard.
        </AccordionItem>
        <AccordionItem key="3" aria-label="Refunds" title="Do you offer refunds?">
          We offer refunds where required by law. Contact support and we’ll help you out.
        </AccordionItem>
        <AccordionItem key="4" aria-label="Enterprise" title="Do you have enterprise options?">
          Yes. Enterprise includes SSO, SLAs, security reviews and dedicated support. Contact us to learn more.
        </AccordionItem>
      </Accordion>
    </div>
  );
}


