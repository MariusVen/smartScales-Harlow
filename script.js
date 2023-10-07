const connectButton = document.getElementById("connectButton");
const output = document.getElementById("output");
const cashElement = document.getElementById("cash");
let port;

async function connect() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    readLoop();
    connectButton.disabled = true;
  } catch (error) {
    console.error("Connection error:", error);
  }
}

async function readLoop() {
  let partialData = ""; // Initialize a variable to accumulate partial data
  while (port.readable) {
    const reader = port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        // Convert the received data to a string
        const textDecoder = new TextDecoder("utf-8");
        const receivedString = textDecoder.decode(value);
        console.log(receivedString);

        // Combine the received data with any previously accumulated partial data
        const combinedData = partialData + receivedString;

        // Use a regular expression to extract the numeric value with two decimal places
        const match = combinedData.match(/(\d+\.\d{2})/);

        if (match) {
          const numericValue = parseFloat(match[0]);
          console.log(numericValue);
          output.textContent = `${numericValue.toFixed(2)} kg\n`;
          // console.log(numericValue.toFixed(2) * 0.5);
          cashElement.textContent = `£ ${
            Math.round(numericValue.toFixed(2) * 0.5 * 100) / 100
          }`;

          // Clear the partial data since we have successfully extracted a valid value
          partialData = "";
        } else {
          // No valid numeric value found in the combined data, so store it as partial data
          partialData = combinedData;
        }
      }
    } catch (error) {
      connectButton.disabled = false;

      output.textContent = error;
    } finally {
      reader.releaseLock();
    }
  }
}

const getDate = () => {
  //display date
  // Get the current date
  const currentDate = new Date();

  // Format the date as "dd/mm/yyyy"
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = currentDate.getFullYear();

  // Create the formatted date string
  const formattedDate = `${day}/${month}/${year}`;

  // Get the day of the week name
  const options = { weekday: "long" };
  const dayOfWeek = currentDate.toLocaleDateString("en-US", options);

  // Display the formatted date and day of the week on the webpage
  const currentDateElement = document.getElementById("currentDate");
  currentDateElement.textContent = `${dayOfWeek} ${formattedDate}`;
};
getDate();
console.log();
connectButton.addEventListener("click", connect);
