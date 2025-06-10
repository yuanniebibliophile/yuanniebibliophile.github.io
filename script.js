const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

//API setup
const API_KEY = "AIzaSyAPHNpdN6wcBom2aN5RwyNerioxy3YCoyI";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
}

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// Create message element with dynamic classes and return it
const createMessageElement = (content,...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

//Generate bot response using API
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text")
    chatHistory.push({
        role: "user",
        parts: [{ text: userData.message }, ...(userData.file.data ? [{inline_data: userData.file}]: [])]
    });

    //API request options
    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: chatHistory
        })
    }
    try {
        //Fetch bot response from API
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "API Error");

        //Extract and display bot's response text
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        messageElement.innerText = apiResponseText;

        chatHistory.push({
        role: "model",
        parts: [{ text: apiResponseText}]
        });
        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
        console.log("Bot:", botReply);

    } catch (error) {
        // Handle error in API response
        console.log("Fetch error:", error);
        messageElement.innerText = error.message;
        messageElement.style.color = "#ff0000";
    } finally {
        // Reset user's file data, removing thinking indicator and scroll chat to bottom
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking")
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});
    }
};


// Handle outgoing user messages
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    messageInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.dispatchEvent(new Event("input"));

    // Create and display user message
    const messageContent = `<div class="message-text"></div>
                            ${userData.file.data ? `<img src="data:${userData.file.mim_type};base64,${userData.file.data}" class="attachment" />` : ""}`;

    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});

    // Simulate bot response with thinking indicator after a delay
    setTimeout(() => {
        const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024"><path 
                        d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"/></svg>
                <div class="message-text">
                    <div class="thinking-indicator">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>`;

        const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({top: chatBody.scrollHeight, behavior: "smooth"});
        generateBotResponse(incomingMessageDiv);
    }, 600);
}

// Handle Enter key press for sending messages
messageInput.addEventListener("keydown", (e) => {
    const userMessage = e.target.value.trim();
    if(e.key === "Enter" && userMessage && !e.shiftKey && window.innerWidth > 768) {
        handleOutgoingMessage(e);
    }
});

// Adjust input field height dynamically
messageInput.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

// Handle file input change
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        const base64String = e.target.result.split(",")[1];

        // Store file data in userData
        userData.file = {
            data: base64String, 
            mime_type: file.type
        }

        fileInput.value = "";
    }

    reader.readAsDataURL(file);
});


// Cancel file upload
fileCancelButton.addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("file-uploaded");
});

// Initialize emoji picker
const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
        const { selectionStart: start, selectionEnd: end } = messageInput;
        messageInput.setRangeText(emoji.native, start, end, "end");
        messageInput.focus();
    },
    onClickOutside: (e) => {
        if(e.target.id === "emoji-picker") {
            document.body.classList.toggle("show-emoji-picker");
        } else {
            document.body.classList.remove("show-emoji-picker");
        }
    }
});

document.querySelector(".chat-form").appendChild(picker);

sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
//Trigger the file input when the file upload button is clicked
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());

chatbotToggler.addEventListener("click", () => document.body.classList.toggle ("show-chatbot"));
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));

// Grabs visible text from main content of the web page
function getPageText() {
    // Remove your chatbot and other popups from text 
    // (example: id or class for chatbot container)
    const chatbot = document.querySelector('.chatbot-popup');
    if (chatbot) chatbot.style.display = 'none'; // temporarily hide

    let texts = [];
    // For demo: add more selectors as needed
    ['h1','h2','h3','p','li'].forEach(tag => {
        document.querySelectorAll(tag).forEach(node => {
            if(node.offsetParent !== null) // visible
                texts.push(node.innerText.trim());
        });
    });

    if (chatbot) chatbot.style.display = ''; // restore

    // Join
    return texts.join(' \n ');
}

// Usage:
const WEBSITE_CONTEXT = getPageText();

function debounce(fn, ms) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    }
}

const API_SUGGESTION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Used to avoid repeated suggestions
let usedSuggestions = new Set();

// Call Gemini API to get suggestions
async function fetchSuggestionsFromApi(userInput, context) {
    const prompt = `
Given the website content below:
"""
${context.slice(0, 3000)}
"""
The user is starting to type: "${userInput}"

Suggest 5 likely things the user could ask, in a numbered list.
Keep each suggestion short, unique, and relevant to the website.
Only reply with the list.
`;

    const payload = {
        contents: [
            { role: "user", parts: [{ text: prompt }] }
        ]
    };

    const resp = await fetch(API_SUGGESTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if(!data.candidates) return [];
    // Extract numbered items (trim Gemini output)
    const text = data.candidates[0]?.content?.parts[0]?.text || "";
    return text.split(/\d+\.\s*/).filter(Boolean)
      .map(s => s.trim()).filter(q => !usedSuggestions.has(q));
}

const suggestionsBox = document.querySelector(".suggestions-list") || document.createElement("div");
suggestionsBox.className = "suggestions-list";
document.querySelector(".chatbot-popup").appendChild(suggestionsBox);

const debouncedSuggest = debounce(async function(inputValue) {
    if (inputValue.length < 2) {
        suggestionsBox.style.display = "none";
        return;
    }
    // Fetch suggestions intelligently
    let suggestions = await fetchSuggestionsFromApi(inputValue, WEBSITE_CONTEXT);
    if (!suggestions || !suggestions.length) {
        suggestionsBox.style.display = "none";
        return;
    }
    suggestionsBox.innerHTML = suggestions.map(
        q => `<div class="suggestion-item">${q}</div>`
    ).join("");
    suggestionsBox.style.display = "block";
}, 400);

// Hook input event
messageInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    debouncedSuggest(val);
});

// Picking and hiding logic remains:
suggestionsBox.addEventListener("mousedown", (e) => {
    if (!e.target.classList.contains('suggestion-item')) return;
    const text = e.target.textContent;
    messageInput.value = text;
    messageInput.focus();
    suggestionsBox.style.display = "none";
    usedSuggestions.add(text); // Avoid repeat
    messageInput.dispatchEvent(new Event("input"));
});

sendMessageButton.addEventListener("click", () => {
    suggestionsBox.style.display = "none";
});