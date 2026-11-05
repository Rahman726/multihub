// AI Chat Application - Works without API keys
// Uses predefined topic responses and fallback question bank
document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');

  // Predefined AI responses for different topics
  // These use the existing fallback question bank themes
  const aiKnowledge = {
    'science': '🔬 Science is the systematic study of the structure and behavior of the physical and natural world through observation and experiment. Key branches include physics, chemistry, biology, and earth science.',

    'space': '🚀 Space, also known as the universe or cosmos, encompasses all of space and time and their contents, including planets, stars, galaxies, and other celestial bodies. The observable universe is about 93 billion light-years across.',

    'maths': '➗ Mathematics is the study of numbers, quantities, and shapes. It includes branches like algebra, geometry, calculus, and statistics. Mathematics is the foundation of all sciences and engineering.',

    'history': '📜 History is the study of past events, particularly in human affairs. It helps us understand how societies, cultures, and nations have developed over time. World history covers ancient, medieval, and modern periods.',

    'movies': '🎬 Movies (motion pictures) are a form of visual storytelling that combines images, sound, and narrative to entertain, inform, or inspire audiences. The film industry began in the late 19th century.',

    'music': '🎵 Music is the art of arranging sounds in time through melody, harmony, rhythm, and timbre. It includes genres like classical, jazz, rock, pop, and electronic music. Music expresses emotion and cultural identity.',

    'general': '💡 General knowledge encompasses a wide range of topics including science, history, geography, technology, and culture. It\'s what makes us well-rounded individuals able to discuss various subjects.',

    'default': '🤖 That\'s an interesting topic! I can help answer questions about science, space, math, history, movies, music, or general knowledge. Try asking me about one of those!'
  };

  // Add message to chat UI
  function addMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${sender}-msg`;
    msgDiv.innerHTML = `<strong>${sender.charAt(0).toUpperCase() + sender.slice(1)}:</strong> ${text}`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Generate AI response based on topic
  function getAIResponse(topic) {
    const lowerTopic = topic.toLowerCase().trim();

    // Check for topic keywords
    if (lowerTopic.includes('science') || lowerTopic.includes('scientific')) {
      return aiKnowledge.science;
    } else if (lowerTopic.includes('space') || lowerTopic.includes('astronomy') || lowerTopic.includes('planet')) {
      return aiKnowledge.space;
    } else if (lowerTopic.includes('math') || lowerTopic.includes('mathematics') || lowerTopic.includes('calculate')) {
      return aiKnowledge.maths;
    } else if (lowerTopic.includes('history') || lowerTopic.includes('historical') || lowerTopic.includes('ancient')) {
      return aiKnowledge.history;
    } else if (lowerTopic.includes('movie') || lowerTopic.includes('films') || lowerTopic.includes('cinema')) {
      return aiKnowledge.movies;
    } else if (lowerTopic.includes('music') || lowerTopic.includes('song') || lowerTopic.includes('band')) {
      return aiKnowledge.music;
    } else if (lowerTopic.includes('general')) {
      return aiKnowledge.general;
    }

    return aiKnowledge.default;
  }

  // Send message function
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage('user', text);
    chatInput.value = '';

    // Get AI response based on topic
    const response = getAIResponse(text);

    // Simulate thinking delay and add AI message
    setTimeout(() => {
      addMessage('ai', response);
    }, 800);
  }

  // Event listeners
  sendBtn.addEventListener('click', sendMessage);

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Welcome message on load
  setTimeout(() => {
    addMessage('ai', '👋 Hello! I\'m an AI chat without needing any API keys. Try asking me about science, space, math, history, movies, or music!');
  }, 500);
});