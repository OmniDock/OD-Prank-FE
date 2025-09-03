import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import DefaultLayout from "@/layouts/default";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { PhoneIcon, TrashIcon, PlusIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function BlacklistPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [blacklistedNumbers, setBlacklistedNumbers] = useState<string[]>([
    "+49 151 12345678",
    "+1 555 0123",
    "+44 20 7946 0958",
  ]);

  const handleAddNumber = () => {
    const trimmed = phoneNumber.trim();
    if (trimmed && !blacklistedNumbers.includes(trimmed)) {
      setBlacklistedNumbers([...blacklistedNumbers, trimmed]);
      setPhoneNumber("");
    }
  };

  const handleRemoveNumber = (number: string) => {
    setBlacklistedNumbers(blacklistedNumbers.filter((n) => n !== number));
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

          <Card className="backdrop-blur-md bg-white/80 dark:bg-neutral-900/80">
            <CardHeader className="pb-4">
              <h2 className="text-xl font-semibold">Manage Blacklisted Numbers</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="Enter phone number to blacklist"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  startContent={<PhoneIcon className="w-4 h-4 text-neutral-400" />}
                  className="flex-1"
                />
                <Button color="primary" onPress={handleAddNumber} startContent={<PlusIcon className="w-4 h-4" />}>
                  Add to Blacklist
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                  Currently Blacklisted Numbers ({blacklistedNumbers.length})
                </p>
                {blacklistedNumbers.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">No numbers blacklisted yet</div>
                ) : (
                  <div className="grid gap-2">
                    {blacklistedNumbers.map((number) => (
                      <motion.div
                        key={number}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800"
                      >
                        <div className="flex items-center gap-3">
                          <PhoneIcon className="w-5 h-5 text-neutral-500" />
                          <span className="font-mono">{number}</span>
                        </div>
                        <Button size="sm" color="danger" variant="flat" isIconOnly onPress={() => handleRemoveNumber(number)}>
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <strong>Important:</strong> Blacklisted numbers will be permanently blocked from receiving any prank calls.
                  This helps ensure responsible use of our service and protects individuals who should not be contacted.
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </DefaultLayout>
  );
}


