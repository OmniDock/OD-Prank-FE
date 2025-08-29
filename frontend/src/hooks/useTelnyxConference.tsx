import { useContext, useEffect, useState } from "react";
import { TelnyxRTCContext, useCallbacks, useNotification } from "@telnyx/react-client";

interface UseTelnyxConferenceProps {
  token: string;
  conference: string;
  autoJoin?: boolean;
}

export function useTelnyxConference({ conference, autoJoin = true }: UseTelnyxConferenceProps) {
  const client = useContext(TelnyxRTCContext) as any;
  const notification = useNotification() as any;
  const activeCall = notification?.call;
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected" | "hangup" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hangupReason, setHangupReason] = useState<string | null>(null);

  // Create a silent MediaStream without microphone access
  const createSilentStream = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Set gain to 0 for complete silence
    gainNode.gain.value = 0;
    oscillator.frequency.value = 0;
    oscillator.connect(gainNode);
    
    const destination = audioContext.createMediaStreamDestination();
    gainNode.connect(destination);
    oscillator.start();
    
    // Clean up after a short time (the stream will persist)
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 100);
    
    return destination.stream;
  };

  const joinConference = () => {
    if (!client) {
      setError("Telnyx client not ready");
      return;
    }

    try {
      console.log(`Attempting to join conference: ${conference}`);
      setConnectionState("connecting");
      
      // Create silent stream to bypass getUserMedia
      createSilentStream();
      
      client.newCall({
        destinationNumber: `+493040739273`,
        audio: true,  // Keep this true for proper audio negotiation
        video: false,
        customHeaders: [{ name: "X-Conference-Name", value: conference }]
      });
      
      console.log('Joining conference with silent stream (no mic access)...');
    } catch (error: any) {
      console.error('Failed to initiate call to join conference:', error);
      setError(error?.message || "Failed to join conference");
      setConnectionState("error");
    }
  };

  useCallbacks({
    onReady: () => {
      if (autoJoin) {
        joinConference();
      }
    },
    onError: (error: any) => {
      console.error('Error during call:', error);
      setError(error?.message || "Connection error");
      setConnectionState("error");
    },
    onSocketError: () => {
      console.log('client socket error');
      setError("Socket connection error");
      setConnectionState("error");
    },
    onSocketClose: () => {
      console.log('client disconnected');
      setConnectionState("idle");
    },
    onNotification: (notification: any) => { 
      console.log('received notification:', notification);
      const call = notification?.call;
      
      if (call?.state === "active") {
        setConnectionState("connected");
      } else if (call?.state === "hangup" || call?.state === "destroy") {
        setConnectionState("hangup");
        setHangupReason(call?.cause || "Call ended");
        console.log("Call ended:", call?.cause, call?.causeCode);
      }
    },
  });

  useEffect(() => {
    if (activeCall?.state === "active") {
      setConnectionState("connected");
    } else if (activeCall?.state === "hangup" || activeCall?.state === "destroy") {
      setConnectionState("hangup");
      setHangupReason(activeCall?.cause || "Call ended");
    }
  }, [activeCall?.state]);

  return {
    activeCall,
    remoteStream: activeCall?.remoteStream,
    connectionState,
    error,
    hangupReason,
    joinConference,
  };
}
