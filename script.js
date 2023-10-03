const connectButton = document.getElementById("connectButton");
const output = document.getElementById("output");
const cashElement = document.getElementById("cash");
let port;

async function detectCableDisconnection() {
  while (true) {
    if (!port || port.readable === false) {
      // Cable disconnected or port is closed
      handleCableDisconnection();
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Check every second
  }
}

function handleCableDisconnection() {
  // Display a message to the user
  output.textContent = "Cable disconnected. Please reconnect.\n";

  // Clear any data or buffers
  // Close the port if it's still open
  if (port && port.readable) {
    port.close();
  }
}

detectCableDisconnection(); // Start monitoring

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

        // Combine the received data with any previously accumulated partial data
        const combinedData = partialData + receivedString;

        // Use a regular expression to extract the numeric value with two decimal places
        const match = combinedData.match(/(\d+\.\d{2})/);

        if (match) {
          const numericValue = parseFloat(match[0]);
          console.log(numericValue);
          output.textContent = `${numericValue.toFixed(2)} kg\n`;
          // console.log(numericValue.toFixed(2) * 0.5);
          cashElement.textContent = `£ ${numericValue.toFixed(2) * 0.5}`;

          // Clear the partial data since we have successfully extracted a valid value
          partialData = "";
        } else {
          // No valid numeric value found in the combined data, so store it as partial data
          partialData = combinedData;
        }
      }
    } catch (error) {
      console.error("Read error:", error);
    } finally {
      reader.releaseLock();
    }
  }
}

connectButton.addEventListener("click", connect);
