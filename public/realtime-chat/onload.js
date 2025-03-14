document.addEventListener('DOMContentLoaded', () => {
    const inputLanguageSelect = document.getElementById('inputLanguage');
    const outputLanguageSelect = document.getElementById('outputLanguage');
    const lottieContainer = document.getElementById('lottieAnimation');
    const menuButton = document.getElementById('menuButton');
    const languageMenu = document.getElementById('languageMenu');

    if (!inputLanguageSelect || !outputLanguageSelect || !lottieContainer || !menuButton || !languageMenu) {
        console.error('Required elements are missing in the DOM.');
        return;
    }

    const timestamp = Date.now();
    const sessionId = `session_${timestamp}`;
    localStorage.setItem('session_id', sessionId);

    // Set default languages in local storage if not already set
    if (!localStorage.getItem('input_language')) {
        localStorage.setItem('input_language', 'English');
    }
    if (!localStorage.getItem('output_language')) {
        localStorage.setItem('output_language', 'Arabic');
    }

    // Set the default values in the dropdowns
    inputLanguageSelect.value = localStorage.getItem('input_language');
    outputLanguageSelect.value = localStorage.getItem('output_language');

    // Initialize Lottie animation for the main content
    var animation = lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: '../assets/loader3.json' // Path to your Lottie animation file
    });

    window.animation = animation;

    // Initialize Lottie animation for the background
    // var bgAnimation = lottie.loadAnimation({
    //     container: document.getElementById('bgAnimation'),
    //     renderer: 'svg',
    //     loop: true,
    //     autoplay: true,
    //     path: '../assets/bg.json' // Path to your background Lottie animation file
    // });

    // Check if there are messages in the main container
    function checkMessages() {
        const mainContainer = document.getElementById('mainContainer');
        const loadingScreen = document.getElementById('loadingScreen');
        // Exclude the skeletonLoader from the check
        const hasMessages = Array.from(mainContainer.children).some(child => 
            child.style.display !== 'none' && child.id !== 'skeletonLoader'
        );
        if (!hasMessages) {
            loadingScreen.style.display = 'flex';
            mainContainer.style.display = 'none';
        } else {
            loadingScreen.style.display = 'none';
            mainContainer.style.display = 'block';
        }
    }

    // Call checkMessages on page load
    checkMessages();

    menuButton.addEventListener('click', () => {
        console.log("Menu button clicked");
        //if classlist doesnt have show add it  
        if (!languageMenu.classList.contains('show')) {
            languageMenu.classList.add('show');
        } else {
            languageMenu.classList.remove('show');
        }
    });

    const languages = [
        "Dutch", "Spanish", "Korean", "Italian", "German", "Thai", "Russian", "Portuguese", "Polish", "Indonesian",
        "Mandarin (TW)", "Swedish", "Czech", "English", "Japanese", "French", "Romanian", "Cantonese (CN)", "Turkish",
        "Mandarin (CN)", "Catalan", "Hungarian", "Ukrainian", "Greek", "Bulgarian", "Arabic", "Serbian", "Macedonian",
        "Cantonese (HK)", "Latvian", "Slovenian", "Hindi", "Galician", "Danish", "Urdu", "Slovak", "Hebrew", "Finnish",
        "Azerbaijani", "Lithuanian", "Estonian", "Nynorsk", "Welsh", "Punjabi", "Afrikaans", "Persian", "Basque",
        "Vietnamese", "Bengali", "Nepali", "Marathi", "Belarusian", "Kazakh", "Armenian", "Swahili", "Tamil", "Albanian",
        "FLEURS", "Spanish", "Italian", "Korean", "Portuguese", "English", "Polish", "Catalan", "Japanese", "German",
        "Russian", "Dutch", "French", "Indonesian", "Ukrainian", "Turkish", "Malay", "Swedish", "Mandarin", "Finnish",
        "Norwegian", "Romanian", "Thai", "Vietnamese", "Slovak", "Arabic", "Czech", "Croatian", "Greek", "Serbian",
        "Danish", "Bulgarian", "Hungarian", "Filipino", "Bosnian", "Galician", "Macedonian", "Hindi", "Estonian",
        "Slovenian", "Tamil", "Latvian", "Azerbaijani", "Urdu", "Lithuanian", "Hebrew", "Welsh", "Persian", "Icelandic",
        "Kazakh", "Afrikaans", "Kannada", "Marathi", "Swahili", "Telugu", "Maori", "Nepali", "Armenian", "Belarusian",
        "Gujarati", "Punjabi", "Bengali"
    ];

    languages.forEach(language => {
        const option1 = document.createElement('option');
        option1.value = language;
        option1.textContent = language;
        inputLanguageSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = language;
        option2.textContent = language;
        outputLanguageSelect.appendChild(option2);
    });

    //set the default values from localstorage to the dropdowns
    inputLanguageSelect.value = localStorage.getItem('input_language');
    outputLanguageSelect.value = localStorage.getItem('output_language');
    document.getElementById('langText').textContent = 'Translating from ' + localStorage.getItem('input_language') + ' to ' + localStorage.getItem('output_language');

    inputLanguageSelect.addEventListener('change', () => {
        localStorage.setItem('input_language', inputLanguageSelect.value);
        window.location.reload();
    });

    outputLanguageSelect.addEventListener('change', () => {
        localStorage.setItem('output_language', outputLanguageSelect.value);
        window.location.reload();
    });
});

document.getElementById('showInput').addEventListener('click', () => {
    const messageInput = document.getElementById('messageInputContainer');
    
    if (messageInput.classList.contains('show')) {
        messageInput.classList.remove('animate__slideInUp');
        messageInput.classList.add('animate__slideOutDown');
    } else {
        messageInput.classList.remove('animate__slideOutDown');
        messageInput.classList.add('animate__slideInUp');
    }
    
    messageInput.classList.toggle('show');
    setTimeout(() => {
        messageInput.classList.toggle('hide');
    }, 500);
});

// Add hover effects to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.opacity = '0.8';
    });
    button.addEventListener('mouseleave', () => {
        button.style.opacity = '1';
    });
});

const messageInput = document.getElementById('messageInput');

messageInput.addEventListener('input', () => {
    // Reset the height to allow shrinking
    messageInput.style.height = 'auto';
    // Set the height to the scroll height to expand
    messageInput.style.height = messageInput.scrollHeight + 'px';
});
