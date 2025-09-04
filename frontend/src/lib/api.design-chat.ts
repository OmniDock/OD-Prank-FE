/**
 * API integration for Design Chat WebSocket
 */

import { DesignChatResponse, DesignChatWebSocketMessage } from '@/types/design-chat';
import { supabase } from '@/lib/supabaseClient';

const getWebSocketUrl = () => {
  // Use same backend URL as regular API calls
  const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
  if (!backendUrl) {
    console.error('VITE_BACKEND_URL not configured');
    return '';
  }
  
  // Convert http/https to ws/wss
  return backendUrl
    .replace(/^https:/, 'wss:')
    .replace(/^http:/, 'ws:');
};

export class DesignChatWebSocket {
  private ws: WebSocket | null = null;
  private url: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private pingInterval: NodeJS.Timeout | null = null;
  
  private async initializeUrl() {
    // Get auth token from Supabase directly
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || '';
    
    if (!token) {
      console.warn('No auth token available for WebSocket');
    }
    
    const baseUrl = getWebSocketUrl();
    this.url = `${baseUrl}/design-chat/ws?token=${token}`;
  }
  
  async connect(
    onMessage: (data: DesignChatResponse) => void,
    onError?: (error: any) => void,
    onClose?: () => void
  ): Promise<void> {
    // Initialize URL with current auth token
    await this.initializeUrl();
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('Design chat WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Start ping interval to keep connection alive
          this.startPingInterval();
          
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as DesignChatResponse;
            onMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (onError) onError(error);
          reject(error);
        };
        
        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.stopPingInterval();
          
          if (onClose) onClose();
          
          // Attempt reconnection if not intentional close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            setTimeout(() => {
              this.connect(onMessage, onError, onClose);
            }, 1000 * this.reconnectAttempts);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  sendMessage(content: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: DesignChatWebSocketMessage = {
        type: 'message',
        content
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }
  
  finalize() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: DesignChatWebSocketMessage = {
        type: 'finalize'
      };
      this.ws.send(JSON.stringify(message));
    }
  }
  
  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }
  
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  disconnect() {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
