const connectButton = document.getElementById("connectButton");
const output = document.getElementById("output");
const cashElement = document.getElementById("cash");
let dataReceived = false;
let timeoutID;
let port;

async function connect() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    readLoop();
    connectButton.hidden = true;
  } catch (error) {
    if (
      error.toString().trim() ===
      `NetworkError: Failed to execute 'open' on 'SerialPort': Failed to open serial port.`
    ) {
      output.textContent =
        "Error: Please disconnect, reconnect cable and press connect";
    } else output.textContent = error;
  }
}

function startTimeout() {
  clearTimeout(timeoutID);
  dataReceived = false; // Reset the dataReceived flag
  timeoutID = setTimeout(() => {
    if (!dataReceived) {
      output.textContent =
        "The Scale is connected, but off. Please turn on scales";
    }
  }, 1000); // Adjust the timeout duration as needed (in milliseconds)
}

async function readLoop() {
  startTimeout(); // Start the timeout when the connection is established
  let partialData = ""; // Initialize a variable to accumulate partial data
  while (port.readable) {
    const reader = port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        dataReceived = true; // Mark data as received
        clearTimeout(timeoutID); // Reset the timeout

        // Convert the received data to a string
        const textDecoder = new TextDecoder("utf-8");
        const receivedString = textDecoder.decode(value);
        console.log(receivedString);

        // Combine the received data with any previously accumulated partial data
        const combinedData = partialData + receivedString;

        // Use a regular expression to extract the numeric value with two decimal places,
        // allowing for an optional negative sign and ignoring extra characters and spaces
        const match = combinedData.match(/-?\s*\d+\.\d{2}/);

        if (match) {
          // console.log(match, "match");
          const numericValue = parseFloat(match[0].replace(/\s+/g, "")); // Remove spaces
          output.textContent = `${numericValue.toFixed(2)} kg\n`;
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
      connectButton.hidden = false;
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
connectButton.addEventListener("click", connect);
