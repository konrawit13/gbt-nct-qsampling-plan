// components/IDGenerator.js
export const IDGenerator = (label = "System ID") => {
  return {
    state: {
      currentId: crypto.randomUUID(),
    },

    template() {
        return `
            <div class="input-group mb-3">
                <span class="input-group-text" id="idlabel-addon1">${label}</span>
                <input
                    type="text" 
                    class="form-control" 
                    readonly
                    id="uuid-input"
                    aria-describedby="idlabel-addon1"
                    value="${this.state.currentId}"
                >
                <button class="btn btn-outline-primary" type="button" id="copy-btn">
                    Copy
                </button>
                <div id="copy-feedback" class="form-text text-success d-none">
                    Copied to clipboard!
                </div>
            </div>
        `;
        return `
        <div class="mb-3">
          <label class="form-label text-secondary small fw-bold">${label}</label>
          <div class="input-group">
            <span class="input-group-text bg-light">
              <i class="bi bi-fingerprint"></i>
            </span>
            <input 
              type="text" 
              class="form-control bg-white" 
              value="${this.state.currentId}" 
              readonly 
              id="uuid-input"
              style="font-family: monospace; cursor: default;"
            >
            <button class="btn btn-outline-primary" type="button" id="copy-btn">
              Copy
            </button>
            <button class="btn btn-outline-secondary" type="button" id="refresh-btn">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
          <div id="copy-feedback" class="form-text text-success d-none">
            Copied to clipboard!
          </div>
        </div>
      `;
    },

    events(container) {
      const input = container.querySelector('#uuid-input');
      const copyBtn = container.querySelector('#copy-btn');
    //   const refreshBtn = container.querySelector('#refresh-btn');
      const feedback = container.querySelector('#copy-feedback');

      // Refresh Logic
    //   refreshBtn.addEventListener('click', () => {
    //     this.state.currentId = crypto.randomUUID();
    //     input.value = this.state.currentId;
    //   });

      // Copy Logic
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(this.state.currentId);
        
        // Visual Feedback
        feedback.classList.remove('d-none');
        copyBtn.innerText = "Done!";
        
        setTimeout(() => {
          feedback.classList.add('d-none');
          copyBtn.innerText = "Copy";
        }, 1000);
      });
    },

    render(parentElement) {
      parentElement.innerHTML = this.template();
      this.events(parentElement);
    }
  };
};