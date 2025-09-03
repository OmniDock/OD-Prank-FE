import DefaultLayout from "@/layouts/default";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export default function TermsPage() {
  return (
    <DefaultLayout>
      <AnimatedBackground variant="mixed" density={10} />

      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <DocumentTextIcon className="w-16 h-16 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Allgemeine Geschäftsbedingungen (AGB)
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">Terms and Conditions</p>
          </div>

          <Card className="backdrop-blur-md bg-gradient-surface glass-card ">
            <CardBody className="prose dark:prose-invert max-w-none p-6">
              <h2>§ 1 Geltungsbereich</h2>
              <p>
                (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle über unsere Webseite
                www.callit.ai geschlossenen Verträge zwischen uns und unseren Kunden.
              </p>
              <p>(2) Maßgeblich ist die jeweils bei Abschluss des Vertrags gültige Fassung der AGB.</p>
              <p>
                (3) Abweichende Bedingungen des Kunden akzeptieren wir nicht. Dies gilt auch, wenn wir der
                Einbeziehung nicht ausdrücklich widersprechen.
              </p>

              <h2>§ 2 Vertragsschluss</h2>
              <p>
                (1) Die Präsentation unserer Dienstleistungen auf der Webseite stellt kein bindendes Angebot unsererseits
                dar.
              </p>
              <p>(2) Erst die Bestellung einer Dienstleistung durch Sie ist ein bindendes Angebot nach § 145 BGB.</p>
              <p>(3) Der Vertrag kommt mit unserer Auftragsbestätigung oder mit der Erbringung der Dienstleistung zustande.</p>

              <h2>§ 3 Leistungsbeschreibung</h2>
              <p>
                (1) Wir bieten einen Service zur Erstellung und Durchführung von KI-generierten Telefonanrufen zu
                Unterhaltungszwecken an.
              </p>
              <p>
                (2) Der Nutzer ist verpflichtet, den Service ausschließlich für legale Zwecke und nur mit Einverständnis
                der angerufenen Person zu nutzen.
              </p>
              <p>
                (3) Die Nutzung des Services für Belästigung, Betrug oder andere illegale Aktivitäten ist strengstens
                untersagt.
              </p>

              <h2>§ 4 Preise und Zahlung</h2>
              <p>(1) Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.</p>
              <p>(2) Die Zahlung erfolgt per Kreditkarte, PayPal oder anderen angebotenen Zahlungsmethoden.</p>
              <p>(3) Credits verfallen 12 Monate nach dem Kaufdatum, sofern nicht anders angegeben.</p>

              <h2>§ 5 Nutzungsrechte</h2>
              <p>
                (1) Mit vollständiger Zahlung erhalten Sie das nicht-exklusive, nicht-übertragbare Recht, unseren Service
                gemäß diesen AGB zu nutzen.
              </p>
              <p>(2) Die generierten Audioinhalte dürfen nur für private, nicht-kommerzielle Zwecke verwendet werden.</p>

              <h2>§ 6 Haftungsbeschränkung</h2>
              <p>
                (1) Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach Maßgabe des
                Produkthaftungsgesetzes.
              </p>
              <p>
                (2) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist unsere Haftung auf den
                vorhersehbaren, vertragstypischen Schaden begrenzt.
              </p>
              <p>(3) Wir übernehmen keine Haftung für Schäden, die durch missbräuchliche Nutzung unseres Services entstehen.</p>

              <h2>§ 7 Datenschutz</h2>
              <p>(1) Wir verarbeiten personenbezogene Daten gemäß unserer Datenschutzerklärung.</p>
              <p>(2) Der Nutzer stimmt der Verarbeitung seiner Daten im Rahmen der Serviceerbringung zu.</p>

              <h2>§ 8 Widerrufsrecht</h2>
              <p>(1) Verbrauchern steht ein Widerrufsrecht nach Maßgabe der gesetzlichen Bestimmungen zu.</p>
              <p>
                (2) Das Widerrufsrecht erlischt bei digitalen Inhalten, wenn wir mit der Ausführung des Vertrags begonnen
                haben und Sie dem ausdrücklich zugestimmt haben.
              </p>

              <h2>§ 9 Kündigung</h2>
              <p>(1) Der Nutzer kann sein Konto jederzeit kündigen.</p>
              <p>
                (2) Wir behalten uns das Recht vor, Nutzerkonten bei Verstoß gegen diese AGB fristlos zu kündigen.
              </p>

              <h2>§ 10 Änderungen der AGB</h2>
              <p>
                (1) Wir behalten uns vor, diese AGB zu ändern, um sie an geänderte Rechtslagen oder Dienstleistungen
                anzupassen.
              </p>
              <p>(2) Änderungen werden dem Nutzer per E-Mail mitgeteilt.</p>

              <h2>§ 11 Schlussbestimmungen</h2>
              <p>(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.</p>
              <p>(2) Gerichtsstand ist, soweit gesetzlich zulässig, unser Geschäftssitz.</p>
              <p>
                (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen
                Bestimmungen unberührt.
              </p>

              <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Stand: {new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long" })}
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </DefaultLayout>
  );
}


