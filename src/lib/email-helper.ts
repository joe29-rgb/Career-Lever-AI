export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openEmailWithAttachmentInstructions(
  to: string,
  subject: string,
  body: string,
  resumeBlob?: Blob,
  coverLetterBlob?: Blob
) {
  // Download attachments first
  if (resumeBlob) {
    downloadFile(resumeBlob, 'resume.pdf');
  }
  if (coverLetterBlob) {
    downloadFile(coverLetterBlob, 'cover-letter.pdf');
  }

  // Add instruction to body
  const attachmentNote = '\n\n[Please attach the downloaded resume and cover letter files to this email before sending]';
  const fullBody = body + attachmentNote;

  // Open mailto
  const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
  window.location.href = mailtoLink;
}
