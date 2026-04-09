async function listModels() {
  const key = "AIzaSyDM3AppO253irqg6gMjsnR3nCmcsOJ0mSU";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    console.log("Available Models:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error listing models:", e);
  }
}

listModels();
