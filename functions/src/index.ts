import { onRequest } from "firebase-functions/v2/https";
import {
  goToBookingPage,
  initializeBotInstance,
  login,
  selectBookingDate,
} from "./utils";

export const initializeBot = onRequest(
  { memory: "8GiB", timeoutSeconds: 540, cors: true },
  async (req, res) => {
    // const authHeader = req.headers.authorization;
    // testAuthCheck(authHeader);
    const { browser, page } = await initializeBotInstance();
    try {
      await login(page);
      await goToBookingPage(page);
      await selectBookingDate(page);
      res.status(200).send({ message: "Bot initialized" });
    } catch (e) {
      console.error(e, "Error getting pages snapshot");
      res.status(400).send({ error: "Error initializing scrape" });
    } finally {
      await browser.close();
    }
  }
);
