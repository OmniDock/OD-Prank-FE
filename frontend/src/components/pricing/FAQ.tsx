import { Accordion, AccordionItem } from "@heroui/accordion";

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-4xl font-bold text-gradient tracking-tight text-center mb-8">
        Häufige gestellte Fragen
      </h2>
      <Accordion >
        <AccordionItem key="1" aria-label="Trial" title="Gibt es eine kostenlose Testversion?">
          Ja. Du kannst auf der Free-Version starten und jederzeit upgraden. Keine Kreditkarte ist erforderlich.
        </AccordionItem>
        <AccordionItem key="2" aria-label="Change plan" title="Kann ich später meine Pläne ändern?">
          Ja. Du kannst zwischen monatlicher und jährlicher Abrechnung jederzeit von deinem Dashboard aus wechseln.
        </AccordionItem>
        <AccordionItem key="3" aria-label="Refunds" title="Bietet ihr Rückerstattungen an?">
          Wir bieten Rückerstattungen, wenn dies gesetzlich vorgeschrieben ist. Kontaktiere uns und wir helfen dir.
        </AccordionItem>
      </Accordion>
    </div>
  );
}


