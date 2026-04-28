  setTimeout(() => {
    if (isAgentsEnabled()) {
      runAgentDiscussion(text, activeSkill ? activeSkill.preprompt : '').then(finalAnswer => {
        const conv = conversations.find(c => c.id === currentChatId);
        if (conv) {
          conv.messages.push({ role: 'assistant', content: finalAnswer });
          if (conv.messages.length === 1) conv.title = text.substring(0, 30);
          saveConversations();
          loadConversations();
        }
        clearFiles();
      });
    } else {
      const response = generateSingleResponse(text, activeSkill);
      addMessageToChat('assistant', response, true);
      const conv = conversations.find(c => c.id === currentChatId);
      if (conv) {
        conv.messages.push({ role: 'assistant', content: response });
        saveConversations();
        loadConversations();
      }
      clearFiles();
    }
  }, 800);
