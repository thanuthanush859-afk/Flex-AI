
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  inputMethod?: 'text' | 'voice' | 'image';
  subject?: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  subject?: string;
  messages: Message[];
}
