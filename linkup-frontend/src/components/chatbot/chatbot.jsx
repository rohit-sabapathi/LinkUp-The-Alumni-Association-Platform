import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';

// Styled components for the chat bot
const ChatBotContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 350px;
  max-height: ${props => props.isOpen ? '500px' : '60px'};
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: max-height 0.3s ease-in-out, box-shadow 0.3s ease;
  overflow: hidden;
  font-family: 'Arial', sans-serif;
  
  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background-color: ${props => props.isValid ? ' #4a6cf7' : ' #e74c3c'};
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  h3 {
    margin: 0;
    font-size: 16px;
  }
  
  .status-indicator {
    display: flex;
    align-items: center;
  }
  
  .status-dot {
    height: 8px;
    width: 8px;
    border-radius: 50%;
    background-color: ${props => props.isValid ? ' #2ecc71' : ' #e74c3c'};
    margin-right: 5px;
  }
`;

const ChatBody = styled.div`
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  max-height: 300px;
  background-color: #f9f9f9;
`;

const Message = styled.div`
  margin-bottom: 10px;
  padding: 10px 15px;
  border-radius: 18px;
  max-width: 80%;
  word-wrap: break-word;
  font-color: #4a6cf7;
  
  ${props => props.isUser ? `
    align-self: flex-end;
    background-color: #4a6cf7;
    color: white;
    margin-left: auto;
  ` : `
    align-self: flex-start;
    background-color: #e9e9eb;
    color: #333;
  `}
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const InputArea = styled.div`
  display: flex;
  padding: 10px;
  border-top: 1px solid #eee;
  background-color: white;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
  color: black;
  
  
  &:focus {
    border-color: #4a6cf7;
  }
`;

const SendButton = styled.button`
  margin-left: 10px;
  padding: 10px 15px;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #3a5ce5;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  
  span {
    height: 8px;
    width: 8px;
    margin: 0 1px;
    background-color: #bbb;
    border-radius: 50%;
    display: inline-block;
    animation: typing 1.4s infinite ease-in-out both;
  }
  
  span:nth-child(1) {
    animation-delay: 0s;
  }
  
  span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  span:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes typing {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.5);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const ChatBot = ({ apiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState(true);
  const messagesEndRef = useRef(null);
  
  // Check if API key is valid on component mount
  useEffect(() => {
    if (!apiKey) {
      console.warn('Groq API key is missing. Chat functionality will not work properly.');
      setApiKeyValid(false);
      setMessages([{
        text: 'API key is missing. Please check your environment variables.',
        isUser: false
      }]);
    }
  }, [apiKey]);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      // Add welcome message when opening chat for the first time
      if (apiKeyValid) {
        setMessages([{
          text: 'Hello! How can I help you today?',
          isUser: false
        }]);
      } else {
        setMessages([{
          text: 'API key is missing or invalid. Please check your environment variables.',
          isUser: false
        }]);
      }
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const sendMessage = async () => {
    if (input.trim() === '') return;
    
    // Add user message
    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Validate API key first
      if (!apiKey) {
        throw new Error('API key is missing. Please check your environment variables.');
      }
      
      // Call Groq API
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            ...messages.map(msg => ({
              role: msg.isUser ? 'user' : 'assistant',
              content: msg.text
            })),
            { role: 'user', content: input }
          ],
          temperature: 0.7,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Add bot response
      const botResponse = { 
        text: response.data.choices[0].message.content, 
        isUser: false 
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error calling Groq API:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Sorry, I encountered an error. Please try again later.';
      
      if (error.message.includes('API key is missing')) {
        errorMessage = 'API key is missing. Please check your environment variables.';
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please check your API key.';
        } else if (error.response.status === 429) {
          errorMessage = 'Too many requests. Please try again later.';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = `API Error: ${error.response.data.error.message}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      // Add error message
      setMessages(prev => [...prev, { 
        text: errorMessage, 
        isUser: false 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <ChatBotContainer isOpen={isOpen}>
      <ChatHeader onClick={toggleChat} isValid={apiKeyValid}>
        <h3>Chat Assistant</h3>
        <div className="status-indicator">
          <div className="status-dot" title={apiKeyValid ? 'API Connected' : 'API Key Invalid'} />
          <span>{isOpen ? '▼' : '▲'}</span>
        </div>
      </ChatHeader>
      
      {isOpen && (
        <>
          <ChatBody>
            <MessageContainer>
              {messages.map((message, index) => (
                <Message key={index} isUser={message.isUser}>
                  {message.text}
                </Message>
              ))}
              {isTyping && (
                <TypingIndicator>
                  <span></span>
                  <span></span>
                  <span></span>
                </TypingIndicator>
              )}
              <div ref={messagesEndRef} />
            </MessageContainer>
          </ChatBody>
          
          <InputArea>
            <Input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
            <SendButton 
              onClick={sendMessage}
              disabled={input.trim() === '' || isTyping || !apiKeyValid}
              title={!apiKeyValid ? 'API key is missing or invalid' : 'Send message'}
            >
              Send
            </SendButton>
          </InputArea>
        </>
      )}
    </ChatBotContainer>
  );
};

export default ChatBot;