import OpenAI from 'openai';
import type { GeneratedQuestion } from '../types';

export class OpenAIService {
  private static instance: OpenAIService;
  private openai: OpenAI;

  private constructor() {
    const apiKey = process.env.OPEN_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPEN_AI_API_KEY environment variable is not set');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Generuje pytania quizowe na podstawie podanego tematu
   */
  public async generateQuestions(topic: string, questionCount: number = 3, existingQuestions: string[] = []): Promise<GeneratedQuestion[]> {
    try {
      const prompt = this.createPrompt(topic, questionCount, existingQuestions);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Jesteś ekspertem w tworzeniu pytań quizowych. Tworzysz interesujące, precyzyjne pytania z jednoznacznymi odpowiedziami. Odpowiadasz TYLKO w formacie JSON bez dodatkowych komentarzy."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('Brak odpowiedzi z OpenAI API');
      }

      // Parsowanie odpowiedzi JSON
      const parsedResponse = JSON.parse(responseContent);
      
      // Walidacja struktury odpowiedzi
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        throw new Error('Nieprawidłowa struktura odpowiedzi z OpenAI');
      }

      // Walidacja każdego pytania
      const questions: GeneratedQuestion[] = parsedResponse.questions.map((q: any, index: number) => {
        if (!q.question || !q.answer || typeof q.question !== 'string' || typeof q.answer !== 'string') {
          throw new Error(`Nieprawidłowa struktura pytania ${index + 1}`);
        }

        return {
          question: q.question.trim(),
          answer: q.answer.trim()
        };
      });

      // Sprawdzenie czy otrzymaliśmy odpowiednią liczbę pytań
      if (questions.length !== questionCount) {
        console.warn(`Otrzymano ${questions.length} pytań zamiast ${questionCount}`);
      }

      return questions;

    } catch (error) {
      console.error('Błąd podczas generowania pytań:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          throw new Error('Błąd parsowania odpowiedzi z OpenAI. Spróbuj ponownie.');
        }
        throw error;
      }
      
      throw new Error('Nieznany błąd podczas generowania pytań');
    }
  }

  /**
   * Tworzy prompt dla OpenAI na podstawie tematu i liczby pytań
   */
  private createPrompt(topic: string, questionCount: number, existingQuestions: string[] = []): string {
    let prompt = `Wygeneruj ${questionCount} pytania quizowe na temat: "${topic}".

Wymagania:
- Pytania mają być interesujące i różnorodne
- Odpowiedzi mają być krótkie, konkretne i jednoznaczne
- Pytania nie mogą być zbyt łatwe ani zbyt trudne
- Każde pytanie powinno mieć jedną poprawną odpowiedź
- Pytania mają być w języku polskim
- Odpowiedzi nie powinny być dłuższe niż 50 znaków
- Pytania nie powinny być dłuższe niż 150 znaków`;

    // Dodaj kontekst już istniejących pytań jeśli są
    if (existingQuestions.length > 0) {
      prompt += `

WAŻNE - Unikaj duplikatów! Już istniejące pytania w quizie:
${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Nowe pytania muszą być RÓŻNE od powyższych. Unikaj podobnej tematyki i sformułowań.`;
    }

    prompt += `

Zwróć odpowiedź TYLKO w formacie JSON:
{
  "questions": [
    {
      "question": "Treść pierwszego pytania?",
      "answer": "Odpowiedź 1"
    },
    {
      "question": "Treść drugiego pytania?", 
      "answer": "Odpowiedź 2"
    }
  ]
}

Nie dodawaj żadnych dodatkowych komentarzy, tylko czysty JSON.`;

    return prompt;
  }

  /**
   * Sprawdza czy OpenAI API jest dostępne
   */
  public async checkApiHealth(): Promise<boolean> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 5,
      });

      return !!completion.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenAI API health check failed:', error);
      return false;
    }
  }
} 