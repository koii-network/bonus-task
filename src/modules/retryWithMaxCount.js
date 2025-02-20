export async function retryWithMaxCount(func, args, MAX_RETRY_COUNT, TIMEOUT) {
  let retryCount = 0;
  let lastErrorMsg = null;

  while (retryCount < MAX_RETRY_COUNT) {
    try {
      const response = await Promise.race([
        await func(...args),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), TIMEOUT * 1000),
        ),
      ]);
      return { success: true, data: response };
    } catch (error) {
      if (error instanceof Error) {
        lastErrorMsg = error.message;
      } else {
        lastErrorMsg = JSON.stringify(error);
      }
      console.error(
        `Function call failed on attempt ${retryCount + 1}: ${lastErrorMsg}`,
      );
      retryCount += 1;
    }
  }

  let errorMsg =
    lastErrorMsg?.toLowerCase() === "timeout"
      ? "timeout"
      : "max retries reached";

  console.error(errorMsg, lastErrorMsg);
  return {
    success: false,
    data: null,
  };
}
