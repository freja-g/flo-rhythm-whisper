import OpenAI from 'openai';

const MENSTRUATION_SYSTEM_PROMPT = `You are FloMentor's AI assistant, a compassionate and knowledgeable specialist in menstrual health and women's wellness.

CORE IDENTITY:
- You are warm, empathetic, and understanding about menstrual health concerns
- You provide evidence-based information in an accessible, non-judgmental way
- You normalize period experiences and validate users' feelings
- You encourage healthy habits and self-care during menstrual cycles

EXPERTISE AREAS:
🩸 Menstrual Cycle Education:
- Normal cycle variations (21-35 days), flow patterns, and changes over time
- Menstrual phases (menstrual, follicular, ovulation, luteal) and their effects
- Period tracking for better health understanding

💊 Symptom Management:
- Period pain relief (heat therapy, gentle exercise, OTC medications)
- PMS and PMDD symptoms (mood, bloating, breast tenderness, fatigue)
- Irregular periods, heavy or light flows, and when to seek help

🌱 Wellness & Self-Care:
- Nutrition for menstrual health (iron, magnesium, omega-3s)
- Exercise during periods (what helps vs. what to avoid)
- Sleep hygiene and stress management during cycles
- Emotional support and mood management

🩺 When to Seek Medical Care:
- Severe pain that interferes with daily life
- Very heavy bleeding (changing pad/tampon every hour)
- Periods lasting longer than 7 days or cycles shorter than 21 days
- Sudden changes in cycle patterns

RESPONSE STYLE:
- Keep responses under 100 words unless complex explanation needed
- Use encouraging, supportive language
- Include practical, actionable advice
- Acknowledge when experiences are normal vs. concerning
- Always suggest tracking symptoms in the app for patterns

RESTRICTIONS:
- ONLY discuss menstruation, periods, reproductive health, and women's wellness
- If asked unrelated questions, gently redirect: "I'm here to help with menstrual health questions. Is there anything about your cycle I can help with?"
- Never provide specific medical diagnoses
- Always recommend consulting healthcare providers for persistent or severe symptoms`;

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
    
    // Period tracking and cycle questions
    if (lowerMessage.includes('period') || lowerMessage.includes('menstrual') || lowerMessage.includes('cycle')) {
      return "📅 Normal cycles range from 21-35 days. Track your periods in the app to identify your personal pattern! Irregular cycles can be normal, but sudden changes should be discussed with a healthcare provider.";
    }
    
    // Pain and cramps
    if (lowerMessage.includes('pain') || lowerMessage.includes('cramp') || lowerMessage.includes('hurt')) {
      return "🌡️ For period pain: Try heat pads, gentle yoga, warm baths, or over-the-counter pain relievers. Stay hydrated and get enough rest. Severe pain that disrupts daily life needs medical attention.";
    }
    
    // Mood and emotional symptoms
    if (lowerMessage.includes('mood') || lowerMessage.includes('emotional') || lowerMessage.includes('sad') || lowerMessage.includes('angry')) {
      return "💚 Hormonal changes can affect mood before and during periods - you're not alone! Regular exercise, good sleep, and stress management help. Track mood patterns in the app to better understand your cycle.";
    }
    
    // Heavy or light flow
    if (lowerMessage.includes('heavy') || lowerMessage.includes('light') || lowerMessage.includes('flow')) {
      return "🩸 Flow varies from person to person! Heavy flow means changing pads/tampons every hour for several hours. Very light spotting or sudden flow changes may need medical evaluation. Track your flow patterns.";
    }
    
    // PMS symptoms
    if (lowerMessage.includes('pms') || lowerMessage.includes('bloating') || lowerMessage.includes('breast')) {
      return "🌙 PMS affects up to 75% of people who menstruate! Common symptoms include bloating, breast tenderness, and mood changes. Regular exercise, limiting salt/caffeine, and calcium can help manage symptoms.";
    }
    
    // Food and nutrition
    if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('nutrition')) {
      return "🥗 During your period, focus on iron-rich foods (leafy greens, beans), magnesium (dark chocolate, nuts), and omega-3s (fish, flax seeds). Stay hydrated and limit caffeine if it worsens symptoms.";
    }
    
    // Exercise questions
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('gym')) {
      return "🏃‍♀️ Light to moderate exercise can actually help period symptoms! Try walking, yoga, or swimming. Listen to your body - rest when needed, but gentle movement often reduces cramps and improves mood.";
    }
    
    // Default response
    return "🌸 I'm here to help with your menstrual health! Ask me about period symptoms, cycle tracking, pain management, nutrition, exercise, or emotional wellbeing during your cycle. What's on your mind today?";
  }
}

export const openAIService = new OpenAIService();