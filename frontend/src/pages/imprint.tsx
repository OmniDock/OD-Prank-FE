import DefaultLayout from "@/layouts/default";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";

export default function ImprintPage() {
  return (
    <DefaultLayout>
      <AnimatedBackground variant="speakers" density={8} />

      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <BuildingOfficeIcon className="w-16 h-16 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Impressum
            </h1>
          </div>

          <Card className="backdrop-blur-md bg-white/80 dark:bg-neutral-900/80">
            <CardBody className="prose dark:prose-invert max-w-none p-8">
              <h2>Angaben gemäß § 5 TMG</h2>

              <h3>Betreiber</h3>
              <p>
                [Your Company Name]<br />
                [Your Name]<br />
                [Street Address]<br />
                [Postal Code] [City]<br />
                Deutschland
              </p>

              <h3>Kontakt</h3>
              <p>
                Telefon: +49 (0) XXX XXXXXXX<br />
                E-Mail: contact@callit.ai<br />
                Website: www.callit.ai
              </p>

              <h3>Registereintrag</h3>
              <p>
                Eintragung im Handelsregister<br />
                Registergericht: [Amtsgericht]<br />
                Registernummer: HRB XXXXX
              </p>

              <h3>Umsatzsteuer-ID</h3>
              <p>
                Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
                DE XXX XXX XXX
              </p>

              <h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
              <p>
                [Responsible Person Name]<br />
                [Address]<br />
                [Postal Code] [City]
              </p>

              <h3>Streitschlichtung</h3>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p>
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
              <p>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>

              <h3>Haftung für Inhalte</h3>
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten 
                nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als 
                Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde 
                Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige 
                Tätigkeit hinweisen.
              </p>

              <h3>Haftung für Links</h3>
              <p>
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen 
                Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
                Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der 
                Seiten verantwortlich.
              </p>

              <h3>Urheberrecht</h3>
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
                dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der 
                Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung 
                des jeweiligen Autors bzw. Erstellers.
              </p>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </DefaultLayout>
  );
}


