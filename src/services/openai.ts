import OpenAI from 'openai';

const MENSTRUATION_SYSTEM_PROMPT = `You are FloMentor's AI assistant, specialized in menstrual health and wellness. 

IMPORTANT RESTRICTIONS:
- ONLY answer questions related to menstruation, periods, reproductive health, women's wellness, and related topics
- If asked about unrelated topics, politely redirect to menstrual health
- Keep responses supportive, informative, and medically accurate
- Suggest consulting healthcare providers for serious concerns

Your expertise includes:
- Menstrual cycle education and tracking
- Period symptoms and management
- Reproductive health basics
- Wellness tips during menstruation
- Emotional support during cycles
- Pain management techniques
- Nutrition and exercise during periods

Always be empathetic, supportive, and encourage users to track their symptoms for better health understanding.`;

class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = localStorage.getItem('openai_api_key');
    if (this.apiKey) {
      this.initializeClient();
    }
  }

  private initializeClient() {
    if (this.apiKey) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    localStorage.setItem('openai_api_key', apiKey);
    this.initializeClient();
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  async generateResponse(message: string, conversationHistory: any[] = []): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const messages = [
        { role: 'system', content: MENSTRUATION_SYSTEM_PROMPT },
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.message
        })),
        { role: 'user', content: message }
      ];

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages as any,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('period') || lowerMessage.includes('menstrual')) {
      return "I'm here to help with your menstrual health questions! While I'm currently offline, I can still provide basic guidance. Your period is a natural part of your cycle. For detailed tracking and insights, make sure to log your symptoms in the app.";
    }
    
    if (lowerMessage.includes('pain') || lowerMessage.includes('cramp')) {
      return "Period pain is manageable with heat therapy, gentle exercise, and proper rest. If you're experiencing severe pain, please consult your healthcare provider. You can track your pain levels in the app to identify patterns.";
    }
    
    if (lowerMessage.includes('mood') || lowerMessage.includes('emotional')) {
      return "Mood changes during your cycle are completely normal due to hormonal fluctuations. Regular exercise, adequate sleep, and stress management can help. Remember to be kind to yourself during this time.";
    }
    
    return "I'm your menstrual health companion! I can help with questions about periods, symptoms, cycle tracking, and wellness tips. What would you like to know about your menstrual health?";
  }
}

export const openAIService = new OpenAIService();