import React, { useCallback, useRef, useState } from "react";
import { Badge, Button, cn, Form, Image } from "@heroui/react";
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import PromptInput from "./PromptInput";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function PromptInputFullLine({ value, onChange, onSubmit, disabled = false, placeholder }: Props) {
  const [assets, setAssets] = useState<string[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!value || disabled) return;
    onSubmit();
    inputRef?.current?.focus();
  }, [value, disabled, onSubmit]);

  const onFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleSubmit();
    },
    [handleSubmit],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        if (!blob) continue;
        const reader = new FileReader();
        reader.onload = () => setAssets((prev) => [...prev, String(reader.result)]);
        reader.readAsDataURL(blob);
      }
    }
  }, []);

  return (
    <Form className="rounded-medium bg-default-100 dark:bg-default-100 flex w-full flex-col items-start gap-0" validationBehavior="native" onSubmit={onFormSubmit}>
      <div className={cn("group flex gap-2 pr-3 pl-[20px]", assets.length > 0 ? "pt-4" : "")}> 
        {assets.map((asset, index) => (
          <Badge
            key={index}
            isOneChar
            className="opacity-0 group-hover:opacity-100"
            content={
              <Button isIconOnly radius="full" size="sm" variant="light" onPress={() => setAssets((prev) => prev.filter((_, i) => i !== index))}>
                <XMarkIcon className="text-foreground h-4 w-4" />
              </Button>
            }
          >
            <Image alt="uploaded image" className="rounded-small border-small border-default-200/50 h-14 w-14 object-cover" src={asset} />
          </Badge>
        ))}
      </div>
      <PromptInput
        ref={inputRef}
        autoFocus
        classNames={{
          innerWrapper: "relative",
          input: "text-medium h-auto w-full",
          inputWrapper: "bg-transparent! shadow-none group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:ring-offset-0 pr-3 pl-[20px] pt-3 pb-3",
        }}
        maxRows={16}
        minRows={2}
        name="content"
        radius="lg"
        spellCheck="false"
        value={value}
        variant="flat"
        placeholder={placeholder}
        onKeyDown={handleKeyDown as any}
        onPaste={handlePaste}
        onValueChange={onChange}
        isDisabled={disabled}
      />
      <div className="flex w-full flex-row items-center justify-between px-3 py-3">
        <div></div>
        <Button isIconOnly color={!value ? "default" : "primary"} isDisabled={!value || disabled} radius="md" size="sm" type="submit" variant="solid">
          <PaperAirplaneIcon className={!value ? "text-default-600 h-5 w-5" : "text-primary-foreground h-5 w-5"} />
        </Button>
      </div>
    </Form>
  );
}


