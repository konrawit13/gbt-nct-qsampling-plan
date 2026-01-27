// components/Counter.js
export const Counter = (initialCount = 0) => {
  return {
    // 1. State
    state: {
      count: initialCount,
    },

    // 2. Template
    template() {
      return `
        <div class="counter-container" id="counter-${this.state.count}">
          <h2>Count: <span id="value">${this.state.count}</span></h2>
          <button id="inc-btn">Increment</button>
          <button id="dec-btn">Decrement</button>
        </div>
      `;
    },

    // 3. Logic & Events
    events(container) {
      const display = container.querySelector('#value');
      
      container.querySelector('#inc-btn').addEventListener('click', () => {
        this.state.count++;
        display.textContent = this.state.count;
      });

      container.querySelector('#dec-btn').addEventListener('click', () => {
        this.state.count--;
        display.textContent = this.state.count;
      });
    },

    // 4. Render Method
    render(parentElement) {
      parentElement.innerHTML = this.template();
      this.events(parentElement);
    }
  };
};