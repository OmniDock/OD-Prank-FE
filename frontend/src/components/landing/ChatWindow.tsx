import { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@heroui/input";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function ChatWindow() {
  const [input, setInput] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const navigate = useNavigate();

  // Typewriter effect placeholders
  const placeholders = [
    "Describe your prank scenario... What kind of character should call your friend?",
    "Create a confused pizza delivery driver calling about a mysterious order...",
    "Design a tech support agent investigating suspicious WiFi activity...",
    "Make a celebrity's assistant scheduling a surprise collaboration...",
    "Build a game show host announcing they've won a ridiculous prize..."
  ];

  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect
  useEffect(() => {
    const currentFullText = placeholders[currentPlaceholderIndex];
    const typingSpeed = isDeleting ? 30 : 50;
    const pauseAfterComplete = 2000;

    const timeout = setTimeout(() => {
      if (!isDeleting && currentCharIndex < currentFullText.length) {
        // Typing forward
        setPlaceholder(currentFullText.slice(0, currentCharIndex + 1));
        setCurrentCharIndex(prev => prev + 1);
      } else if (!isDeleting && currentCharIndex === currentFullText.length) {
        // Pause at the end, then start deleting
        setTimeout(() => setIsDeleting(true), pauseAfterComplete);
      } else if (isDeleting && currentCharIndex > 0) {
        // Deleting
        setPlaceholder(currentFullText.slice(0, currentCharIndex - 1));
        setCurrentCharIndex(prev => prev - 1);
      } else if (isDeleting && currentCharIndex === 0) {
        // Move to next placeholder
        setIsDeleting(false);
        setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentCharIndex, isDeleting, currentPlaceholderIndex]);

  function goNext() {
    if (input.trim()) {
      // Fake flow: ignore content and redirect
      navigate("/signin");
    }
  }



  return (
    <div className="w-full max-w-4xl mx-auto">
      
      <div className="rounded-3xl border border-purple-300/30 dark:border-purple-800/30 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl shadow-xl shadow-primary-500/20">
        <div className="p-2">
          <div className="flex items-end gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              classNames={{
                input: "min-h-[60px] py-4 resize-none text-[16px]",
                inputWrapper: "bg-transparent border-0 shadow-none data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent"
              }}
              minRows={3}
              maxRows={10}
              variant="flat"
            />
            <div className="pb-2 pr-2">
              <Button
                onPress={goNext}
                isIconOnly
                size="md"
                className="bg-gradient-primary"
                disabled={!input.trim()}
              >
                <SparklesIcon className="w-5 h-5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


