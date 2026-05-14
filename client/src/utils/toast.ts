export function showError(message: string) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;background:#e64c4c;color:white;padding:12px 20px;border-radius:12px;font-family:Inter,sans-serif;font-size:14px;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,0.15);max-width:360px;';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

export function showSuccess(message: string) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;background:#22c55e;color:white;padding:12px 20px;border-radius:12px;font-family:Inter,sans-serif;font-size:14px;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,0.15);max-width:360px;';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}
