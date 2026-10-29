const fs = require('fs');

// Let's check peacock_invitation.html for rsvp-section
let peacockHtml = '';
if (fs.existsSync('peacock_invitation.html')) {
  peacockHtml = fs.readFileSync('peacock_invitation.html', 'utf-8');
} else if (fs.existsSync('peacock_src/invitation.html')) {
  peacockHtml = fs.readFileSync('peacock_src/invitation.html', 'utf-8');
}

console.log('Peacock HTML exists:', !!peacockHtml);
if (peacockHtml) {
  const rStart = peacockHtml.indexOf('<section id="rsvp-section"');
  const rEnd = peacockHtml.indexOf('</section>', rStart);
  console.log('RSVP SECTION:\n', peacockHtml.substring(rStart, rEnd + 10));
}
