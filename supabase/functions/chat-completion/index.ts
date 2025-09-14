import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const messages = [
      { role: 'system', content: MENSTRUATION_SYSTEM_PROMPT },
      ...conversationHistory.slice(-10).map((msg: any) => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.message
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please check your API key usage limits or try again later.');
      } else if (response.status === 401) {
        throw new Error('OpenAI API key is invalid. Please check your API key.');
      } else if (response.status === 403) {
        throw new Error('OpenAI API access forbidden. Please check your API key permissions.');
      } else {
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

    return new Response(JSON.stringify({ response: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-completion function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});