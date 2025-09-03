import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import DefaultLayout from "@/layouts/default";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { PhoneIcon, PlusIcon, ShieldCheckIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { addToBlacklist } from "@/lib/api.blacklist";
import { addToast } from "@heroui/react";



export default function BlacklistPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [successE164, setSuccessE164] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddNumber = async () => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessE164(null);
    try {
      const res = await addToBlacklist(trimmed, "DE");
      setSuccessE164(res.phone_number_e164);
      setPhoneNumber("");
    } catch (e: any) {
      const message = e?.message ?? "Failed to add to blacklist";
      addToast({
        title: "Could not add number",
        description: message,
        color: "danger",
        timeout: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <AnimatedBackground variant="phones" density={10} />

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
              Phone Number Blacklist
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Protect yourself and others by blacklisting phone numbers that should never receive prank calls
            </p>
          </div>

          <Card className="backdrop-blur-md bg-white/80 dark:bg-neutral-900/80 rounded-2xl shadow-lg">
            <CardHeader className="px-6 py-4 border-b border-default-200 dark:border-default-800">
              <h2 className="text-lg font-semibold">Add a Number to the Blacklist</h2>
            </CardHeader>
            <CardBody className="px-6 py-5 space-y-4">

              <div className="mb-6 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <strong>Important:</strong> Once added, removal requires manual support intervention.
                </p>
              </div>
              <div className="flex gap-2">
                
                <Input
                  type="tel"
                  placeholder="Enter phone number to blacklist"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  startContent={<PhoneIcon className="w-4 h-4 text-neutral-400" />}
                  className="flex-1"
                />
                <Button color="primary" isLoading={loading} onPress={handleAddNumber} startContent={<PlusIcon className="w-4 h-4" />} className="bg-gradient-primary">
                  Add to Blacklist
                </Button>
              </div>

              {successE164 && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="text-sm">Added to Blacklist: <span className="font-mono">{successE164}</span></span>
                </div>
              )}
              {errorMsg && (
                <div className="text-sm text-red-600 dark:text-red-400">{errorMsg}</div>
              )}

            </CardBody>
          </Card>
        </motion.div>
      </div>
    </DefaultLayout>
  );
}


