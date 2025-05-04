console.log('loaded');

const temperature = 0.5;

const today = new Date();
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('User Timezone:', userTimeZone);

const formattedToday = today.toLocaleString('en-US', { timeZone: userTimeZone }).replace(',', '');  

const inputLanguage = localStorage.getItem('input_language');
const outputLanguage = localStorage.getItem('output_language');

const reprompt = `Hidden Context (the user is not aware this is part of their message): The users timezone is ${userTimeZone}. The current date/time is ${formattedToday}.`;

const systemPrompt = `
You are the HRSD AI Translator, a real-time AI-powered translation assistant exclusively for the Human Resources and Social Development ministry of Saudi Arabia.
Your sole purpose is to provide immediate and direct translation from ${inputLanguage} to ${outputLanguage} in real-time, maintaining absolute accuracy, consistency, and exclusive adherence to the output language.
Your Rules and Constraints:
Exact Translation Only:
Translate exactly what is spoken without any interpretation, modification, embellishment, or omission.
Preserve the original tone, intent, and context exactly as spoken.
If a phrase has no direct equivalent, provide a literal translation or a phonetic transliteration.
Exclusive Adherence to Output Language:
Exclusively use the output language (${outputLanguage}).
No mixing of languages: Do not use any words or phrases from the input language or any other language besides the output language.
No translanguaging: Maintain linguistic integrity by ensuring all output is strictly in the designated output language.
No Interaction or Explanations:
Do not greet, ask questions, explain translations, or engage in any conversation.
If the user asks a question that seems directed at you, translate the question exactly as it was spoken.
Uninterrupted Flow:
Translate continuously and immediately. Never pause or stop translating unless explicitly instructed to do so.
Behavioral Constraints:
No Opinions, Interpretations, or Contextual Adjustments: Translate words as they are, without considering context or cultural nuances.
No Inference: Do not attempt to understand or infer meaning—translate only the literal words spoken.
No Alterations for Clarity: Do not simplify, rephrase, or enhance the language for understanding.
No Use of Input Language: Under no circumstances should the input language or any language other than the specified output language appear in the translation.
Important Notes:
You are a conduit, not a communicator. Your role is strictly to bridge languages without any personal input or judgment.
The user likely does not know the ${outputLanguage} and relies entirely on your translations, so any form of additional communication or clarification is strictly forbidden.
You must exclusively use the output language. Do not mix languages or use words from the input language.
Example Behavior:
If the user says: "Can you tell me where the office is?"
Output: The exact translation of the question in the ${outputLanguage}.
Not Allowed: Any additional context, explanation, or guidance.
Not Allowed: Mixing words from ${inputLanguage} or any other language.
If the user says: "What does that word mean?"
Output: The exact translation of the question in the ${outputLanguage}.
Not Allowed: An explanation of the word or its meaning.
Not Allowed: Any words from the input language.
Reminder:
Your sole function is to faithfully convert spoken words between languages. Do not add, omit, interpret, engage, or mix languages beyond this task.
`;

let pc; // Declare the peer connection outside the function for broader scope
let dc; // Declare the data channel outside the function for broader scope

async function init() {
  const tokenResponse = await fetch("/ai/session");
  const data = await tokenResponse.json();
  const EPHEMERAL_KEY = data.client_secret.value;

  pc = new RTCPeerConnection(); // Initialize the peer connection
  const audioEl = document.getElementById("remoteAudio");
  pc.ontrack = e => audioEl.srcObject = e.streams[0]; // Set the audio element's source to the remote stream

  const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
  pc.addTrack(ms.getTracks()[0]);

  dc = pc.createDataChannel("oai-events");
  dc.addEventListener("open", () => {
    console.log("Data channel is open");
    // Update the system instructions once the data channel is open
    updateInstructions(systemPrompt);
    configureTools();
  });
  dc.addEventListener("message", handleServerEvent);

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const baseUrl = "https://api.openai.com/v1/realtime";
  const model = "gpt-4o-realtime-preview-2024-12-17";
  const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${EPHEMERAL_KEY}`,
      "Content-Type": "application/sdp"
    },
  });

  const answer = {
    type: "answer",
    sdp: await sdpResponse.text(),
  };
  await pc.setRemoteDescription(answer);
}

function updateInstructions(newInstructions) {
  if (dc && dc.readyState === "open") {
    const event = {
      type: "session.update",
      session: {
        instructions: newInstructions
      }
    };
    dc.send(JSON.stringify(event));
    console.log("Instructions updated:", newInstructions);
  } else {
    console.error("Data channel is not open");
  }
}

async function handleServerEvent(e) {
  const serverEvent = JSON.parse(e.data);
  if (serverEvent.type === "response.done") {
    console.log("Response received:", serverEvent.response.output[0]);
    const transcript = serverEvent.response.output[0].content[0].transcript;
    console.log('transcript', transcript);
    document.getElementById('subtitleText').innerHTML = transcript;

    if (serverEvent.response.output[0].type === "function_call") {
      const { name, arguments, call_id } = serverEvent.response.output[0];
      console.log('its a tool call');
      let args = JSON.parse(arguments);
      let result;

      switch (name) {
        case 'open_google':
          console.log('its open google');
          result = await open_google(args.query);
          break;
        case 'generateProfile':
          result = await generateProfile(args.taskDescription, args.industry, args.additionalRequirements, args.model);
          break;
        case 'getCalendarEvents':
          result = await getCalendarEvents(args.timePeriod, args.query);
          break;
        case 'saveEvent':
          result = await saveEvent(args.summary, args.location, args.description, args.start, args.end);
          break;
        case 'listGmailMessages':
          result = await listGmailMessages(args.maxResults, args.query);
          break;
        case 'getGmailMessage':
          result = await getGmailMessage(args.messageId);
          break;
        case 'sendGmailMessage':
          result = await sendGmailMessage(args.to, args.subject, args.body, args.cc, args.bcc, args.isHtml);
          break;
        case 'performGoogleSearch':
          result = await performGoogleSearch(args.query);
          break;
        case 'usePerplexity':
          result = await usePerplexity(args.query);
          break;
        case 'checkKnowledgeBase':
          result = await checkKnowledgeBase(args.query);
          break;
        case 'scrapeWeb':
          result = await scrapeWeb(args.url);
          break;
        case 'executeComputerCommand':
          result = await executeComputerCommand(args.command);
          break;
        default:
          console.warn(`Unhandled function name: ${name}`);
          return;
      }

      // Send the result back to the model
      const resultEvent = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call_id,
          output: JSON.stringify(result)
        }
      };
      dc.send(JSON.stringify(resultEvent));
      console.log("Function result sent:", result);
    }

    // Handle the response, e.g., display text or process audio
    if (serverEvent.response.output[0].type === "text") {
      const textResponse = serverEvent.response.output[0].content;
      displayTextResponse(textResponse);
    } else if (serverEvent.response.output[0].type === "audio") {
      const audioStream = serverEvent.response.output[0].content;
      console.log("Audio stream received", serverEvent.response.output[0]);
      playAudioStream(audioStream);
    }
  }
}

function displayTextResponse(text) {
  // Implement logic to display text response to the user
  console.log("Text response:", text);
}

function playAudioStream(audioStream) {
  const audioEl = document.getElementById("remoteAudio");
  audioEl.srcObject = audioStream;
  audioEl.play();
  console.log("Playing audio stream");
}

function stopSession() {
  if (pc) {
    pc.close(); // Close the peer connection
    pc = null; // Reset the peer connection variable
    console.log("Session stopped");
  }
}


document.getElementById("messageInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    console.log("input event");
    const message = document.getElementById("messageInput").value;
    console.log(message);
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          }
        ]
      },
    };
    
    // WebRTC data channel and WebSocket both have .send()
    dc.send(JSON.stringify(event));
    
    close_input_box();
  }
});

function configureTools() {
    if (dc && dc.readyState === "open") {
        const event = {
          type: "session.update",
          session: {
            tools: tools,
            tool_choice: "auto",
          }
        };
        dc.send(JSON.stringify(event));
        console.log("Tools configured:", event.session.tools);
        animation.play();
        document.getElementById("mainText").innerHTML = "AI Translator is listening...";
        document.getElementById("subText").innerHTML = "Just speak and I will help you translate";
      } else {
        console.error("Data channel is not open");
      }
}

document.getElementById("talkButton").addEventListener("click", () => {
  if (pc && pc.connectionState === "connected") {
    stopSession();
    animation.stop();
    document.getElementById("mainText").innerHTML = "AI Translator is paused...";
    document.getElementById("subText").innerHTML = "Click the talk button to start again or change language from the top right menu";
  } else {
    init();
    document.getElementById("mainText").innerHTML = "AI Translator is loading...";
    document.getElementById("subText").innerHTML = "Please wait while the translator initializes";
  }
});
