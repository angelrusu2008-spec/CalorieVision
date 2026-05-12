import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/analyze-food", async (req, res) => {
  try {
    const { image } = req.body as { image?: string };

    if (!image) {
      res.status(400).json({ error: "image is required (base64 string)" });
      return;
    }

    const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food image and return a JSON object with nutritional information. Be precise and realistic.
              
Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "foodName": "Name of the food/dish",
  "description": "Brief description of what you see (1-2 sentences)",
  "servingSize": "Estimated serving size (e.g. '1 plate ~350g')",
  "calories": 450,
  "protein": 28.5,
  "carbs": 42.0,
  "fat": 18.0,
  "fiber": 4.5,
  "sugar": 8.0,
  "sodium": 620,
  "confidence": "high",
  "ingredients": ["ingredient1", "ingredient2", "ingredient3"]
}

All macros in grams, calories as kcal, sodium in mg. Confidence: "high", "medium", or "low". If you cannot identify food in the image, return confidence "low" with estimated values of 0.`,
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
