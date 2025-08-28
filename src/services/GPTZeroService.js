const puppeteer = require("puppeteer");

class GPTZeroService {
  constructor() {}

  async getAIPrediction(text) {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    let aiProbability = null;
    try {
      const page = await browser.newPage();
      await page.goto("https://gptzero.stoplight.io/docs/gptzero-api", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      // Use page.evaluate to fetch API from browser context
      aiProbability = await page.evaluate(async (text) => {
        try {
          const response = await fetch(
            "https://api.gptzero.me/v2/predict/text",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ document: text }),
            }
          );
          const data = await response.json();
          // Return ai_probability if available
          return data?.documents?.[0]?.completely_generated_prob ?? null;
        } catch (err) {
          return null;
        }
      }, text);
    } catch (error) {
      console.error("GPTZeroService error:", error);
    } finally {
      await browser.close();
    }
    return aiProbability;
  }
}

module.exports = GPTZeroService;
