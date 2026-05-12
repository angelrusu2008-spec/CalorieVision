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
      ? `\nEl usuario dice: "${hint.trim()}". Usa esta información para identificar el alimento con mayor precisión (por ejemplo, si dice "100g de pasta", ajusta los valores nutricionales a esa cantidad exacta).`
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
              text: `Analiza esta imagen de alimento y devuelve un objeto JSON con la información nutricional. Sé preciso y realista.${hintClause}

Responde SOLO con JSON válido (sin markdown, sin explicaciones) en este formato exacto:
{
  "foodName": "Nombre del alimento o plato en español",
  "description": "Descripción breve de lo que ves (1-2 frases, en español)",
  "servingSize": "Tamaño estimado de la porción (ej: '1 plato ~350g')",
  "calories": 450,
  "protein": 28.5,
  "carbs": 42.0,
  "fat": 18.0,
  "fiber": 4.5,
  "sugar": 8.0,
  "sodium": 620,
  "confidence": "high",
  "ingredients": ["ingrediente1", "ingrediente2", "ingrediente3"],
  "healthScore": 7,
  "healthReason": "Breve explicación del índice de salud en español (1 frase)"
}

Macros en gramos, calorías en kcal, sodio en mg. Confidence: "high", "medium" o "low". healthScore del 1 al 10 (1=muy poco saludable, 10=muy saludable). Si no puedes identificar comida en la imagen, devuelve confidence "low" con valores estimados de 0.`,
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
