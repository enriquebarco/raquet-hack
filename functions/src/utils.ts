/* eslint-disable max-len */
import puppeteer from "puppeteer";

import { ADMIN_UID } from "./config";
import { HttpsError } from "firebase-functions/v2/https";


export const base64Encode = (str: string) => {
  if (!str) return "";
  try {
    const res = Buffer.from(str).toString("base64");
    return res;
  } catch (_e) {
    return "";
  }
};

export const testAuthCheck = (bearer?: string) => {
  const auth = bearer?.split(" ")[1];
  console.log("auth", auth);
  console.log(base64Encode(ADMIN_UID));
  if (auth !== base64Encode(ADMIN_UID)) {
    throw new HttpsError(
      "permission-denied",
      "You do not have access to this resource"
    );
  }
};

export const getRandomUserAgent = (): string => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  ];

  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const randomDelay = () => new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 2000) + 3000));


export const initializeBotInstance = async (): Promise<{ browser: puppeteer.Browser, page: puppeteer.Page }> => {
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
    headless: false,
  });

  const page = await browser.newPage();

  // Set random User-Agent and other headers
  await page.setUserAgent(getRandomUserAgent());
  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9",
  });

  // Set timezone
  await page.emulateTimezone("America/New_York");

  // Randomize viewport
  //   const width = 1920 + Math.floor(Math.random() * 100) - 50;
  //   const height = 1080 + Math.floor(Math.random() * 100) - 50;

  await page.setViewport({
    width: 1000,
    height: 1000,
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  });

  // Set geolocation
  await page.setGeolocation({
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 100,
  });

  // Apply the anti-detection measures
  await page.evaluateOnNewDocument(() => {
    // Pass the Webdriver Test.
    Object.defineProperty(navigator, "webdriver", { get: () => false });

    // Pass the Plugins Length Test.
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });

    // Pass the Languages Test.
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });

    // Mock other navigator properties
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 });
    Object.defineProperty(navigator, "maxTouchPoints", { get: () => 1 });

    // Mock screen properties
    Object.defineProperty(screen, "width", { get: () => 1920 });
    Object.defineProperty(screen, "height", { get: () => 1080 });

    // Pass the Chrome Test.
    (window as any).chrome = {
      runtime: {},
      loadTimes: () => ({}),
      csi: () => ({}),
    };

    // Pass the Permissions Test.
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: PermissionDescriptor) => {
      if (parameters.name === "notifications") {
        return Promise.resolve({ state: Notification.permission } as PermissionStatus);
      }
      return originalQuery(parameters);
    };

    // Mock WebGL
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter: number) {
      if (parameter === 37445) {
        return "Intel Inc.";
      }
      if (parameter === 37446) {
        return "Intel Iris OpenGL Engine";
      }
      return getParameter(parameter);
    };

    // Mock WebGL2
    const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(parameter: number) {
      if (parameter === 37445) {
        return "Intel Inc.";
      }
      if (parameter === 37446) {
        return "Intel Iris OpenGL Engine";
      }
      return getParameter2(parameter);
    };

    // Disable WebRTC IP Leak
    const getUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator.mediaDevices, constraints).then(resolve).catch(reject);
      });
    };

    // Mocking Date and Performance API
    const originalDateNow = Date.now;
    Date.now = () => originalDateNow() + (Math.random() * 1000);

    const originalPerformanceNow = performance.now;
    performance.now = () => originalPerformanceNow() + (Math.random() * 1000);

    // Mocking additional features detection
    Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });
    Object.defineProperty(navigator, "connection", { get: () => ({ downlink: 10.0, effectiveType: "4g", rtt: 50 }) });
  });

  return { browser, page };
};
export const login = async (page: puppeteer.Page) => {
  const url = process.env.URL;
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;

  if (url && username && password) {
    try {
      await page.goto(url);

      // Wait for both email and password fields to be available
      await Promise.all([
        page.waitForSelector("#user_email"),
        page.waitForSelector("#user_password"),
      ]);

      // Type username and password concurrently
      await page.type("#user_email", username),
      await page.type("#user_password", password),

      // Click login button and go to home page
      await Promise.all([
        page.click("input[type=\"submit\"][name=\"commit\"]"),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
      console.log("Logged in successfully");
    } catch (error) {
      console.error("Error during login:", error);
      throw new Error("Login failed");
    }
  } else {
    throw new Error("Missing URL, username, or password environment variables");
  }
};
export const goToBookingPage = async (page: puppeteer.Page) => {
  const bookingUrl = process.env.BOOKING_URL;
  if (bookingUrl) {
    try {
      console.log("page", page.url());
      await page.goto(bookingUrl, { waitUntil: "networkidle2" });
    } catch (e) {
      console.error("Error navigating to booking page", e);
    }
  }
};

export const selectBookingDate = async (page: puppeteer.Page) => {
  try {
    await Promise.all([
      page.waitForSelector(".flex_mobile_button_container"),
      page.waitForSelector(".flex_mobile_button_container button:last-of-type"),
    ]);
    randomDelay();
    // delay 2 seconds
    console.log(await page.$eval(".flex_mobile_button_container button:last-of-type", (el) => el.innerHTML));
    const isReady = await page.evaluate(() => {
      return document.querySelector(".flex_mobile_button_container button:last-of-type") !== null;
    });
    if (isReady) {
      await Promise.all([
        page.click(".flex_mobile_button_container button:last-of-type"),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
    } else {
      console.log("Button not ready");
    }
    console.log("Selected booking date");
  } catch (e) {
    console.error("Error selecting booking date", e);
  }
};
