import React from "react";
import { Avatar } from "@heroui/react";

type MessageCardProps = React.HTMLAttributes<HTMLDivElement> & {
  avatar?: string;
  avatarName?: string;
  avatarNode?: React.ReactNode;
  message?: React.ReactNode;
  status?: "success" | "failed";
  side?: "left" | "right";
};

export default function MessageCard({ avatar, avatarName, avatarNode, message, status, side = "left", className = "", ...props }: MessageCardProps) {
  const failed = status === "failed";

  if (side === "right") {
    return (
      <div {...props} className={["flex gap-3 justify-end mb-3", className].join(" ")}> 
        <div className={[
          "relative px-4 py-3 rounded-medium max-w-[80%]",
          failed ? "bg-danger-100/50 border border-danger-100 text-foreground" : "bg-default-100 text-default-700 border border-default-200",
        ].join(" ")}>
          <div className="text-small whitespace-pre-wrap">{message}</div>
        </div>
        <div className="flex-none">
          {avatarNode ? (
            <div className="h-9 w-9 inline-flex items-center justify-center">
              {avatarNode}
            </div>
          ) : (
            <Avatar src={avatar} name={avatarName} className="h-9 w-9" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div {...props} className={["flex gap-3 mb-3", className].join(" ")}> 
      <div className="flex-none">
        {avatarNode ? (
          <div className="h-9 w-9 inline-flex items-center justify-center">
            {avatarNode}
          </div>
        ) : (
          <Avatar src={avatar} name={avatarName} className="h-9 w-9" />
        )}
      </div>
      <div className={[
        "relative px-4 py-3 rounded-medium max-w-[80%]",
        failed ? "bg-danger-100/50 border border-danger-100 text-foreground" : "bg-violet-50 text-violet-700 border border-violet-200",
      ].join(" ")}> 
        <div className="text-small whitespace-pre-wrap">{message}</div>
      </div>
    </div>
  );
}


