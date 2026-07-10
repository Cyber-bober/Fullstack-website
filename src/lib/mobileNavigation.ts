// Функции для мобильного чата
export function initMobileChat() {
  if (typeof window === 'undefined') return;
  
  const isMobile = window.innerWidth <= 768;
  if (!isMobile) return;
  
  // Обработчик клика на чат
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.addEventListener('click', function() {
      const chatRight = document.querySelector('.chat-right');
      const chatLeft = document.querySelector('.chat-left');
      
      if (chatRight && chatLeft) {
        chatRight.classList.add('active');
        chatLeft.classList.add('hidden');
      }
    });
  });
  
  // Кнопка назад в чате
  const chatBackBtn = document.querySelector('.chat-back-btn');
  if (chatBackBtn) {
    chatBackBtn.addEventListener('click', () => {
      const chatRight = document.querySelector('.chat-right');
      const chatLeft = document.querySelector('.chat-left');
      
      if (chatRight && chatLeft) {
        chatRight.classList.remove('active');
        chatLeft.classList.remove('hidden');
      }
    });
  }
}

// Функции для мобильной поддержки
export function initMobileSupport() {
  if (typeof window === 'undefined') return;
  
  const isMobile = window.innerWidth <= 768;
  if (!isMobile) return;
  
  // Обработчик клика на тикет
  document.querySelectorAll('.support-ticket-item').forEach(item => {
    item.addEventListener('click', function() {
      const supportRight = document.querySelector('.support-right');
      const supportLeft = document.querySelector('.support-left');
      
      if (supportRight && supportLeft) {
        supportRight.classList.add('active');
        supportLeft.classList.add('hidden');
      }
    });
  });
  
  // Кнопка назад в поддержке
  const supportBackBtn = document.querySelector('.support-back-btn');
  if (supportBackBtn) {
    supportBackBtn.addEventListener('click', () => {
      const supportRight = document.querySelector('.support-right');
      const supportLeft = document.querySelector('.support-left');
      
      if (supportRight && supportLeft) {
        supportRight.classList.remove('active');
        supportLeft.classList.remove('hidden');
      }
    });
  }
}

// Инициализация при загрузке
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    initMobileChat();
    initMobileSupport();
  });
  
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      // Сброс на десктопе
      const chatRight = document.querySelector('.chat-right');
      const chatLeft = document.querySelector('.chat-left');
      const supportRight = document.querySelector('.support-right');
      const supportLeft = document.querySelector('.support-left');
      
      if (chatRight) chatRight.classList.remove('active', 'hidden');
      if (chatLeft) chatLeft.classList.remove('hidden');
      if (supportRight) supportRight.classList.remove('active');
      if (supportLeft) supportLeft.classList.remove('hidden');
    }
  });
}