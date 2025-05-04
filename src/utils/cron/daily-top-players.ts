import axios from "axios";

/**
 * Function to trigger the daily top players update through the API
 * This can be called from a CRON job or scheduled task
 */
export const sendDailyTopPlayersUpdate = async () => {
  try {
    const response = await axios.post("/api/daily-top-players");
    console.log("Daily top players update sent:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error sending daily top players update:", error);
    return { success: false, error };
  }
}; 