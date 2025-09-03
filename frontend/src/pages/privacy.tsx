import DefaultLayout from "@/layouts/default";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function PrivacyPage() {
  return (
    <DefaultLayout>
      <AnimatedBackground variant="mixed" density={8} />

      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <ShieldCheckIcon className="w-16 h-16 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">How we handle your data</p>
          </div>

          <Card className="backdrop-blur-md bg-white/80 dark:bg-neutral-900/80">
            <CardBody className="prose dark:prose-invert max-w-none p-8">
              <h2>Introduction</h2>
              <p>
                We value your privacy. This Privacy Policy explains what data we collect, how we use it,
                and your rights regarding your personal information.
              </p>

              <h2>Data We Collect</h2>
              <ul>
                <li>Account information (email, name)</li>
                <li>Usage data (features you interact with)</li>
                <li>Payment details processed by our payment partners</li>
              </ul>

              <h2>How We Use Data</h2>
              <ul>
                <li>To provide and improve our services</li>
                <li>To communicate updates and support</li>
                <li>To comply with legal obligations</li>
              </ul>

              <h2>Third Parties</h2>
              <p>
                We work with trusted providers for authentication, hosting, analytics, and payments.
                These providers process data on our behalf under strict agreements.
              </p>

              <h2>Your Rights</h2>
              <ul>
                <li>Access, rectify, or delete your data</li>
                <li>Withdraw consent at any time</li>
                <li>Lodge a complaint with your local supervisory authority</li>
              </ul>

              <h2>Contact</h2>
              <p>
                For privacy questions, contact: privacy@callit.ai
              </p>

              <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </DefaultLayout>
  );
}


