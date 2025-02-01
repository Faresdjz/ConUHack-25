import { useState } from 'react';
import PropTypes from 'prop-types';
import './ChatBot.css';

const ChatBot = ({ onItemGenerated }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const renderGameItem = (item) => {
    if (!item || typeof item !== 'object') return null;

    const stats = item.stats || {};
    const hasStats = Object.keys(stats).length > 0;

    return (
      <div className="game-item">
        <h3>{item.name || 'Unknown Item'}</h3>
        <p className="price">Price: ${item.price || 0}</p>
        {item.image && (
          <img 
            src={`data:image/png;base64,${item.image}`} 
            alt={item.name || 'Item image'} 
            className="item-image"
          />
        )}
        {hasStats && (
          <div className="stats">
            <h4>Stats:</h4>
            <ul>
              {Object.entries(stats).map(([stat, value]) => (
                <li key={stat}>
                  {stat}: {value}
                </li>
              ))}
            </ul>
          </div>
        )}
        {item.description && (
          <p className="description">{item.description}</p>
        )}
        <button 
          className="purchase-button"
          onClick={() => onItemGenerated(item)}
          disabled={!item.price}
        >
          Purchase for ${item.price || 0}
        </button>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage]
        })
      });

      const data = await response.json();
      let content = data.content[0].text;
      
      try {
        // Try to parse the response as JSON
        const parsedContent = JSON.parse(content);
        console.log(parsedContent);
        const assistantMessage = {
          role: 'assistant',
          content: parsedContent,
          isGameItem: true
        };
        setMessages(prev => [...prev, assistantMessage]);
      } catch {
        // If parsing fails, treat it as a regular message
        const assistantMessage = {
          role: 'assistant',
          content: content,
          isGameItem: false
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isGameItem: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            {message.isGameItem ? (
              renderGameItem(message.content)
            ) : (
              <p>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</p>
            )}
          </div>
        ))}
        {isLoading && <div className="loading">Generating item...</div>}
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Request a weapon, item, or obstacle..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
};

ChatBot.propTypes = {
  onItemGenerated: PropTypes.func.isRequired
};

export default ChatBot;
