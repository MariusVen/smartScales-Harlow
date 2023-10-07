const connectButton = document.getElementById("connectButton");
const output = document.getElementById("output");
const cashElement = document.getElementById("cash");
let port;

let dataTimeout;

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
        "Error: Please disconnect, reconnect the cable, and press connect";
    } else output.textContent = error;
  }
}

function resetOutput() {
  output.textContent = "Scale connected but off. Please power it on";
  cashElement.textContent = "";
}

async function readLoop() {
  resetOutput(); // Initialize the output to "Scale connected but off. Please power it on"

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

        // Use a regular expression to extract the numeric value with two decimal places,
        // allowing for an optional negative sign and ignoring extra characters and spaces
        const match = combinedData.match(/-?\s*\d+\.\d{2}/);

        if (match) {
          const numericValue = parseFloat(match[0].replace(/\s+/g, ""));
          output.innerHTML = `<strong>Weight</strong> ${numericValue.toFixed(
            2
          )} kg\n`;
          cashElement.textContent = `£ ${
            Math.round(numericValue.toFixed(2) * 0.5 * 100) / 100
          }`;

          // Reset the data timeout
          clearTimeout(dataTimeout);
          dataTimeout = setTimeout(resetOutput, 2000); // Reset to "Scale connected but off. Please power it on" after 2 seconds without data

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
      resetOutput(); // Handle disconnection or errors by resetting the output
      break;
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
