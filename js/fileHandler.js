const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const previewsContainer = document.getElementById('file-previews');
let selectedFiles = [];

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

// Drag and drop on the whole chat container
document.querySelector('.chat-container').addEventListener('dragover', (e) => {
  e.preventDefault();
});
document.querySelector('.chat-container').addEventListener('drop', (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
});

function handleFiles(fileList) {
  selectedFiles = [...selectedFiles, ...Array.from(fileList)];
  renderPreviews();
}

function renderPreviews() {
  previewsContainer.innerHTML = '';
  previewsContainer.classList.toggle('hidden', selectedFiles.length === 0);
  selectedFiles.forEach((file, index) => {
    const preview = document.createElement('div');
    preview.className = 'file-preview';
    preview.innerHTML = `${file.name} <button data-index="${index}">✕</button>`;
    preview.querySelector('button').addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFiles.splice(index, 1);
      renderPreviews();
    });
    previewsContainer.appendChild(preview);
  });
}

// Expose function to clear files after sending
function clearFiles() {
  selectedFiles = [];
  fileInput.value = '';
  renderPreviews();
}
