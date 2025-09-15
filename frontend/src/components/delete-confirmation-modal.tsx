import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
} from "@heroui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  itemName: string;
  description?: string;
  onConfirm: () => Promise<void>;
  confirmText?: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onOpenChange,
  title,
  itemName,
  description,
  onConfirm,
  confirmText = "Löschen",
}: DeleteConfirmationModalProps) {
  const [inputText, setInputText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (inputText.toLowerCase() !== confirmText.toLowerCase()) {
      addToast({
        title: "Ungültige Bestätigung",
        description: `Please type '${confirmText}' to confirm`,
        color: "warning",
        timeout: 3000,
      });
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
      setInputText("");
    } catch (error) {
      console.error("Delete operation failed:", error);
      addToast({
        title: "Löschen fehlgeschlagen",
        description: "Failed to delete. Please try again.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false);
      setInputText("");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose} size="lg" hideCloseButton>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody className="space-y-4">
          <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="flex-shrink-0 w-5 h-5 text-danger-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-danger-800 mb-1">
                  Warnung: Diese Aktion kann nicht rückgängig gemacht werden
                </p>
                <p className="text-danger-700">
                  {description || `Sie sind dabei, "${itemName}" dauerhaft zu löschen.`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Um die Löschung zu bestätigen, bitte <span className="font-mono font-semibold">{confirmText}</span> unten eingeben:
            </p>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`'${confirmText}' eingeben, um zu bestätigen`}
              autoFocus
              disabled={isDeleting}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputText.toLowerCase() === confirmText.toLowerCase()) {
                  handleDelete();
                }
              }}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" size="sm" onPress={handleClose} isDisabled={isDeleting}>
            Abbrechen
          </Button>
          <Button
            color="danger"
            onPress={handleDelete}
            isLoading={isDeleting}
            isDisabled={inputText.toLowerCase() !== confirmText.toLowerCase()}
          >
            Löschen
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
