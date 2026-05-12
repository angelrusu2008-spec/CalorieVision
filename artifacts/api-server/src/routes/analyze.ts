import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/analyze-food", async (req, res) => {
  try {
    const { image, hint } = req.body as { image?: string; hint?: string };

    if (!image) {
      res.status(400).json({ error: "image is required (base64 string)" });
      return;
    }

    const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

    const hintClause = hint?.trim()
      ? `\nInformación adicional del usuario: "${hint.trim()}". IMPORTANTE: usa esto para ajustar los valores nutricionales exactamente (si dice 100g de pasta, calcula para 100g, no para una ración estándar).`
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Eres un nutricionista experto. Analiza esta imagen de alimento y devuelve información nutricional en JSON.

REGLAS IMPORTANTES:
- Responde SIEMPRE en español (nombres de alimentos, descripción, ingredientes, razón de salud)
- Sé preciso y realista con los valores nutricionales
- Si hay información adicional del usuario, úsala para mejorar la precisión
${hintClause}

Devuelve ÚNICAMENTE JSON válido (sin markdown, sin texto adicional) con este formato exacto:
{
  "foodName": "Nombre del alimento en español",
  "description": "Descripción breve en español (1-2 frases)",
  "servingSize": "Tamaño de la porción en español (ej: '1 plato ~350g')",
  "calories": 450,
  "protein": 28.5,
  "carbs": 42.0,
  "fat": 18.0,
  "fiber": 4.5,
  "sugar": 8.0,
  "sodium": 620,
  "confidence": "high",
  "ingredients": ["ingrediente1 en español", "ingrediente2 en español"],
  "healthScore": 7,
  "healthReason": "Motivo del índice de salud en español (1 frase)"
}

Unidades: macros en gramos, calorías en kcal, sodio en mg. confidence: "high", "medium" o "low". healthScore del 1 al 10 (1=muy poco saludable, 10=muy saludable). Si no identificas comida, usa confidence "low" y valores 0.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";

    let parsed: Record<string, unknown>;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      req.log.error({ content }, "Failed to parse OpenAI response as JSON");
      res.status(500).json({ error: "Failed to parse nutrition data" });
      return;
    }

    res.json({ success: true, data: parsed });
  } catch (err) {
    req.log.error({ err }, "Error analyzing food image");
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

export default router;
